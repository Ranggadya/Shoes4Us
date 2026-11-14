const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const BASE_URL = (metaEnv?.VITE_API_URL || "/api").trim();

const GET_CACHE_TTL_MS = 30_000;
const getResponseCache = new Map<string, { data: unknown; expiresAt: number }>();
const inFlightGetRequests = new Map<string, Promise<unknown>>();

function isCacheablePublicGet(url: string): boolean {
  return (
    url.includes("/products") ||
    url.includes("/categories") ||
    url.includes("/shipping/couriers") ||
    url.includes("/reviews")
  );
}

export function clearApiCache(): void {
  getResponseCache.clear();
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  // Normalize base URL
  let base = BASE_URL.replace(/\/+$/, "");

  // If base is an external domain and doesn't end with /api, ensure /api is appended
  if (base.startsWith("http://") || base.startsWith("https://")) {
    if (!base.endsWith("/api")) {
      base = `${base}/api`;
    }
  } else if (!base.startsWith("/api")) {
    base = "/api";
  }

  // Normalize endpoint: strip leading /api if present to prevent double /api
  let path = endpoint.trim();
  if (path.startsWith("/api/")) {
    path = path.slice(4);
  } else if (path === "/api") {
    path = "";
  }

  if (path && !path.startsWith("/")) {
    path = `/${path}`;
  }

  return `${base}${path}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  const isJson = Boolean(contentType && contentType.includes("application/json"));
  const data = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const jsonBody = isJson ? (data as Record<string, unknown>) : undefined;
    const nestedError = jsonBody?.error as Record<string, unknown> | string | undefined;
    const errorMessage =
      (typeof jsonBody?.message === "string" && jsonBody.message) ||
      (typeof nestedError === "object" && nestedError && typeof nestedError.message === "string" && nestedError.message) ||
      (typeof nestedError === "string" && nestedError) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

export const api = {
  get: async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const url = buildUrl(endpoint);
    const hasAbortSignal = Boolean(options?.signal);
    const bypassCache =
      options?.cache === "no-store" || options?.cache === "reload";
    const canCache = isCacheablePublicGet(url) && !bypassCache;

    if (canCache) {
      const cached = getResponseCache.get(url);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.data as T;
      }

      if (!hasAbortSignal) {
        const existingPromise = inFlightGetRequests.get(url);
        if (existingPromise) {
          return existingPromise as Promise<T>;
        }
      }
    }

    const fetchPromise = request<T>(endpoint, { method: "GET", ...options })
      .then((res) => {
        if (canCache) {
          getResponseCache.set(url, {
            data: res,
            expiresAt: Date.now() + GET_CACHE_TTL_MS,
          });
        }
        return res;
      })
      .finally(() => {
        if (canCache && !hasAbortSignal) {
          inFlightGetRequests.delete(url);
        }
      });

    if (canCache && !hasAbortSignal) {
      inFlightGetRequests.set(url, fetchPromise);
    }

    return fetchPromise;
  },

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) => {
    clearApiCache();
    return request<T>(endpoint, {
      method: "POST",
      body: serializeBody(body),
      ...options,
    });
  },

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) => {
    clearApiCache();
    return request<T>(endpoint, {
      method: "PUT",
      body: serializeBody(body),
      ...options,
    });
  },

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) => {
    clearApiCache();
    return request<T>(endpoint, {
      method: "PATCH",
      body: serializeBody(body),
      ...options,
    });
  },

  delete: <T>(endpoint: string, options?: RequestInit) => {
    clearApiCache();
    return request<T>(endpoint, { method: "DELETE", ...options });
  },

  uploadImage: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await request<{ data: { url: string; filename: string; size: number } }>("/api/upload", {
      method: "POST",
      body: formData,
    });
    return res.data;
  },
};

export async function uploadImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  return api.uploadImage(file);
}
