import { expect, test } from "@playwright/test";
import {
  API_BASE_URL,
  loginViaAPI,
  loginViaUI,
  SEEDED_ADMIN,
} from "./helpers/auth";

test.describe("Admin Product Management", () => {
  test("creates a new shoe in admin portal and exposes it on the public catalog", async ({
    page,
    request,
  }) => {
    const productName = `E2E Runner ${Date.now()}`;
    let createdProductId: string | null = null;

    try {
      // 1. Log in as seeded Admin via UI
      await loginViaUI(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
      await expect(page).toHaveURL(/\/$/);
      await expect(
        page.getByRole("link", { name: /Dashboard Admin/i })
      ).toBeVisible();

      // 2. Open Add Product page
      await page.goto("/admin/product/add");
      await expect(
        page.getByRole("heading", { name: /Tambah Produk Baru/i })
      ).toBeVisible();

      // 3. Fill product details
      await page.getByPlaceholder("Contoh: Nike Air Max 270").fill(productName);
      await page.getByRole("button", { name: /Running/i }).first().click();
      await page
        .getByPlaceholder("Nike, Adidas, New Balance")
        .fill("Shoes4Us Lab");
      await page.getByPlaceholder("0", { exact: true }).fill("1450000");

      // Set stock for EU 42
      await page.getByLabel(/EU 42/i).fill("5");

      await page
        .getByPlaceholder(/Deskripsi detail produk/i)
        .fill("Sepatu uji otomatis Playwright E2E untuk verifikasi katalog.");

      // 4. Submit and wait for creation API response to capture ID for cleanup
      const createResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/products") &&
          res.request().method() === "POST"
      );

      await page.getByRole("button", { name: /Simpan Produk/i }).click();

      const createRes = await createResponsePromise;
      expect(createRes.ok(), `POST /api/products returned ${createRes.status()}`).toBeTruthy();
      const createBody = (await createRes.json()) as {
        data?: { product?: { id?: string } };
      };
      createdProductId = createBody.data?.product?.id ?? null;

      // 5. Verify redirect to admin catalog list
      await expect(page).toHaveURL(/\/admin\/product$/);
      await expect(page.getByText(productName).first()).toBeVisible();

      // 6. Verify product is immediately searchable on public storefront
      await page.goto(`/product?search=${encodeURIComponent(productName)}`);
      await expect(page.getByText(productName).first()).toBeVisible();
    } finally {
      if (createdProductId) {
        const { token } = await loginViaAPI(
          request,
          SEEDED_ADMIN.email,
          SEEDED_ADMIN.password
        );
        await request.delete(`${API_BASE_URL}/products/${createdProductId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  });
});
