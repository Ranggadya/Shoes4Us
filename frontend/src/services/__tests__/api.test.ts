import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError, setUnauthorizedHandler, setToken, removeToken } from "../api";

describe("api.get public GET cache behavior", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("caches standard GET /products calls and bypasses cache when cache is no-store", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: { items: [{ id: "p1" }] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: { items: [{ id: "p1" }, { id: "p2" }] } }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const first = await api.get<{ data: { items: Array<{ id: string }> } }>(
      "/products?page=1&limit=100&testCacheKey=1"
    );
    const secondCached = await api.get<{ data: { items: Array<{ id: string }> } }>(
      "/products?page=1&limit=100&testCacheKey=1"
    );

    expect(first.data.items).toHaveLength(1);
    expect(secondCached.data.items).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const fresh = await api.get<{ data: { items: Array<{ id: string }> } }>(
      "/products?page=1&limit=100&testCacheKey=1",
      { cache: "no-store" }
    );
    expect(fresh.data.items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("invokes unauthorizedHandler on 401 for authenticated requests but skips login failures", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    setToken("expired-jwt");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ message: "Sesi berakhir" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(api.post("/auth/login", { email: "a@b.com", password: "wrong" })).rejects.toBeInstanceOf(
      ApiError
    );
    expect(onUnauthorized).not.toHaveBeenCalled();

    await expect(api.get("/orders", { cache: "no-store" })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    setUnauthorizedHandler(null);
    removeToken();
  });
});
