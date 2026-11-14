import { api } from "@/services/api";
import type { AdminUserRecord, ApiResponse, Order, Product } from "@/types";

interface PaginatedMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

const DEFAULT_ADMIN_PAGE_LIMIT = 100;
const MAX_ADMIN_PAGES = 100;
const BATCH_CONCURRENCY = 4;

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; message?: string };
  return (
    err.name === "AbortError" ||
    (typeof err.message === "string" &&
      err.message.toLowerCase().includes("abort"))
  );
}

function resolveTotalPages(meta: PaginatedMeta | undefined, receivedCount: number, limit: number): number {
  if (typeof meta?.totalPages === "number" && meta.totalPages >= 1) {
    return Math.min(meta.totalPages, MAX_ADMIN_PAGES);
  }
  if (typeof meta?.total === "number" && meta.total > 0) {
    const resolvedLimit = typeof meta.limit === "number" && meta.limit > 0 ? meta.limit : limit;
    return Math.min(Math.max(1, Math.ceil(meta.total / resolvedLimit)), MAX_ADMIN_PAGES);
  }
  return receivedCount >= limit ? 2 : 1;
}

async function fetchRemainingPages<T>(
  totalPages: number,
  fetchPage: (page: number) => Promise<T[]>,
  signal?: AbortSignal
): Promise<T[][]> {
  const results: T[][] = [];
  for (let start = 2; start <= totalPages; start += BATCH_CONCURRENCY) {
    if (signal?.aborted) break;
    const pageNumbers: number[] = [];
    for (let p = start; p < start + BATCH_CONCURRENCY && p <= totalPages; p++) {
      pageNumbers.push(p);
    }
    const batch = await Promise.all(pageNumbers.map((p) => fetchPage(p)));
    results.push(...batch);
  }
  return results;
}

export function normalizeOrderItems(order: Order): Order {
  return {
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
  };
}

function extractOrdersPayload(
  response: ApiResponse<{ orders?: Order[]; items?: Order[] } | Order[]>
): Order[] {
  const data = response.data;
  if (Array.isArray(data)) return data.map(normalizeOrderItems);
  const raw = data?.orders ?? data?.items ?? [];
  return Array.isArray(raw) ? raw.map(normalizeOrderItems) : [];
}

function extractProductsPayload(
  response: ApiResponse<{ items?: Product[]; products?: Product[] } | Product[]>
): Product[] {
  const data = response.data;
  if (Array.isArray(data)) return data;
  const raw = data?.items ?? data?.products ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function fetchAllOrders(signal?: AbortSignal): Promise<Order[]> {
  const loadPage = (page: number) =>
    api.get<ApiResponse<{ orders?: Order[]; items?: Order[] } | Order[]>>(
      `/orders?scope=all&page=${page}&limit=${DEFAULT_ADMIN_PAGE_LIMIT}`,
      { cache: "no-store", signal }
    );

  const firstRes = await loadPage(1);
  const allOrders = extractOrdersPayload(firstRes);
  const totalPages = resolveTotalPages(
    firstRes.meta,
    allOrders.length,
    DEFAULT_ADMIN_PAGE_LIMIT
  );

  if (totalPages > 1) {
    const restPages = await fetchRemainingPages(
      totalPages,
      async (page) => extractOrdersPayload(await loadPage(page)),
      signal
    );
    for (const pageOrders of restPages) {
      allOrders.push(...pageOrders);
    }
  }

  return allOrders;
}

export async function fetchAllProducts(signal?: AbortSignal): Promise<Product[]> {
  const loadPage = (page: number) =>
    api.get<ApiResponse<{ items?: Product[]; products?: Product[] } | Product[]>>(
      `/products?page=${page}&limit=${DEFAULT_ADMIN_PAGE_LIMIT}&includeDetails=true`,
      { cache: "no-store", signal }
    );

  const firstRes = await loadPage(1);
  const allProducts = extractProductsPayload(firstRes);
  const totalPages = resolveTotalPages(
    firstRes.meta,
    allProducts.length,
    DEFAULT_ADMIN_PAGE_LIMIT
  );

  if (totalPages > 1) {
    const restPages = await fetchRemainingPages(
      totalPages,
      async (page) => extractProductsPayload(await loadPage(page)),
      signal
    );
    for (const pageProducts of restPages) {
      allProducts.push(...pageProducts);
    }
  }

  return allProducts;
}

export async function fetchRegisteredUsers(
  signal?: AbortSignal
): Promise<AdminUserRecord[]> {
  const response = await api.get<
    ApiResponse<AdminUserRecord[] | { users?: AdminUserRecord[] }>
  >("/users", { cache: "no-store", signal });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.users)) return data.users;
  return [];
}
