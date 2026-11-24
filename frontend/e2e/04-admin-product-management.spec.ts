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
      await loginViaUI(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
      await expect(page).toHaveURL(/\/$/);
      await expect(
        page.getByRole("link", { name: /Dashboard Admin/i })
      ).toBeVisible();

      await page.goto("/admin/product/add");
      await expect(
        page.getByRole("heading", { name: /Tambah Produk Baru/i })
      ).toBeVisible();

      await page.getByPlaceholder("Contoh: Nike Air Max 270").fill(productName);
      await page.getByRole("button", { name: /Running/i }).first().click();
      await page
        .getByPlaceholder("Nike, Adidas, New Balance")
        .fill("Shoes4Us Lab");
      await page.getByPlaceholder("0", { exact: true }).fill("1450000");
      await page.getByLabel(/EU 42/i).fill("5");
      await page
        .getByPlaceholder(/Deskripsi detail produk/i)
        .fill("Sepatu uji otomatis Playwright E2E untuk verifikasi katalog.");

      const createResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/products") &&
          res.request().method() === "POST"
      );

      await page.getByRole("button", { name: /Simpan Produk/i }).click();

      const createRes = await createResponsePromise;
      expect(
        createRes.ok(),
        `POST /api/products returned ${createRes.status()}`
      ).toBeTruthy();
      const createBody = (await createRes.json()) as {
        data?: { product?: { id?: string } };
      };
      createdProductId = createBody.data?.product?.id ?? null;

      await expect(page).toHaveURL(/\/admin\/product$/);
      await expect(page.getByText(productName).first()).toBeVisible();

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

  test("edits a product in admin catalog and deletes it via confirmation dialog", async ({
    page,
    request,
  }) => {
    const initialName = `E2E Editable ${Date.now()}`;
    const updatedName = `${initialName} Pro`;
    const { token } = await loginViaAPI(
      request,
      SEEDED_ADMIN.email,
      SEEDED_ADMIN.password
    );

    // Seed a disposable product via admin API
    const createRes = await request.post(`${API_BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        name: initialName,
        category: "Running",
        price: "1200000",
        stock: "4",
        brand: "Shoes4Us Lab",
        audience: "UNISEX",
        segment: "SHOES",
        sizes: JSON.stringify([{ size: "42", stock: 4 }]),
      },
    });
    expect(
      createRes.ok(),
      `Setup product API failed (${createRes.status()})`
    ).toBeTruthy();
    const createdBody = (await createRes.json()) as {
      data?: { product?: { id?: string } };
    };
    const productId = createdBody.data?.product?.id ?? null;
    let deletedViaUI = false;

    try {
      await loginViaUI(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
      await expect(page).toHaveURL(/\/$/);

      await page.goto("/admin/product");
      await expect(page.getByText(initialName).first()).toBeVisible();

      // Open Edit modal on the target product card
      const card = page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: initialName }) })
        .filter({ has: page.getByRole("button", { name: /^Edit$/i }) })
        .last();
      await card.getByRole("button", { name: /^Edit$/i }).click();

      const modal = page.getByRole("dialog", { name: /Edit Produk/i });
      await expect(modal).toBeVisible();
      await modal.getByLabel(/Nama Produk/i).fill(updatedName);
      await modal.getByRole("button", { name: /^Simpan$/i }).click();

      await expect(modal).not.toBeVisible();
      await expect(page.getByText(updatedName).first()).toBeVisible();

      // Confirm updated title is reflected on public catalog
      await page.goto(`/product?search=${encodeURIComponent(updatedName)}`);
      await expect(page.getByText(updatedName).first()).toBeVisible();

      // Delete the test product via Admin UI ConfirmDialog
      await page.goto("/admin/product");
      await page
        .getByRole("button", { name: `Hapus produk ${updatedName}` })
        .click();

      const confirmDialog = page.getByRole("alertdialog", {
        name: /Hapus Produk\?/i,
      });
      await expect(confirmDialog).toBeVisible();
      await confirmDialog
        .getByRole("button", { name: /Ya, Hapus Produk/i })
        .click();

      await expect(confirmDialog).not.toBeVisible();
      await expect(page.getByText(updatedName)).toHaveCount(0);
      deletedViaUI = true;
    } finally {
      if (productId && !deletedViaUI) {
        await request.delete(`${API_BASE_URL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  });
});
