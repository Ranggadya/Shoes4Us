import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const API_BASE_URL =
  process.env.E2E_API_URL || "http://localhost:8080/api";

export const SEEDED_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || "admin@shoes4us.com",
  password: process.env.E2E_ADMIN_PASSWORD || "admin123",
};

export const SEEDED_USER = {
  email: process.env.E2E_USER_EMAIL || "user@shoes4us.com",
  password: process.env.E2E_USER_PASSWORD || "user1234",
};

export type SeededProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sizes?: Array<{ id: string; size: string; stock: number }>;
};

export function uniqueEmail(prefix = "e2e-buyer"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}@shoes4us.test`;
}

export async function registerUserViaAPI(
  request: APIRequestContext,
  input: { name: string; email: string; password: string }
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const res = await request.post(`${API_BASE_URL}/auth/register`, {
    data: input,
  });
  expect(res.ok(), `Register API failed with status ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as {
    data: { token: string; user: { id: string; email: string; name: string } };
  };
  return body.data;
}

export async function loginViaAPI(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok(), `Login API failed with status ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as {
    data: { token: string; user: { id: string; email: string; role: string } };
  };
  return body.data;
}

export async function getInStockProduct(
  request: APIRequestContext
): Promise<SeededProduct> {
  const res = await request.get(`${API_BASE_URL}/products?limit=20`);
  expect(res.ok(), `List products API failed with status ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as {
    data?: { products?: SeededProduct[] };
  };
  const products = body.data?.products ?? [];
  const preferred =
    products.find(
      (p) =>
        p.stock > 0 &&
        p.price >= 100_000 &&
        p.name.toLowerCase().includes("pegasus")
    ) ||
    products.find((p) => p.stock > 0 && p.price >= 100_000) ||
    products.find((p) => p.stock > 0);

  if (!preferred) {
    throw new Error(
      "No in-stock seeded product found. Run `go run ./cmd/seed` before E2E tests."
    );
  }
  return preferred;
}

export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
  loginPath = "/login"
): Promise<void> {
  await page.goto(loginPath);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: /^Login$/i }).click();
}
