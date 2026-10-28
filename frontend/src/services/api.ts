const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const BASE_URL = metaEnv?.VITE_API_URL || "/api";

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
  if (endpoint.startsWith("http")) return endpoint;
  if (endpoint.startsWith("/api/") || endpoint === "/api") {
    return BASE_URL === "/api"
      ? endpoint
      : `${BASE_URL}${endpoint.slice(4)}`;
  }
  return `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
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
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "POST",
      body: serializeBody(body),
      ...options,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "PUT",
      body: serializeBody(body),
      ...options,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: serializeBody(body),
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
};
