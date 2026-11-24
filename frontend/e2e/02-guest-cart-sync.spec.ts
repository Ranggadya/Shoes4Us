import { expect, test } from "@playwright/test";
import {
  getInStockProduct,
  getInStockProducts,
  registerUserViaAPI,
  uniqueEmail,
} from "./helpers/auth";

test.describe("Guest-to-Member Cart Synchronization", () => {
  test("preserves guest cart items and syncs them to PostgreSQL after login", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-sync");
    const password = "SyncUser123!";
    await registerUserViaAPI(request, {
      name: "E2E Sync Shopper",
      email,
      password,
    });

    const product = await getInStockProduct(request);

    // 1. Add shoe as an unauthenticated guest
    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();

    await page
      .getByRole("button", { name: /TAMBAH KE KERANJANG/i })
      .click();

    // 2. Verify slide-over Cart Drawer opens with the added shoe
    const drawer = page.getByRole("dialog", { name: /Keranjang Belanja/i });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(product.name);

    // 3. Go to /cart and trigger Login & Checkout CTA
    await drawer.getByRole("link", { name: /Lihat Keranjang/i }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText(product.name).first()).toBeVisible();

    await page
      .getByRole("button", { name: /Login & Lanjut ke Pengiriman/i })
      .click();
    await expect(page).toHaveURL(/\/login\?redirect=/);

    // 4. Log in with the newly registered empty-cart account
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: /^Login$/i }).click();

    // 5. Wait for navigation away from /login and verify synced cart persists after reload
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto("/cart");
    await expect(page.getByText(product.name).first()).toBeVisible();

    // Confirm item survives full reload from backend DB
    await page.reload();
    await expect(page.getByText(product.name).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Lanjut ke Pengiriman/i })
    ).toBeVisible();
  });

  test("persists multiple guest cart items across reloads and syncs all of them on login", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-multi-sync");
    const password = "SyncUser123!";
    await registerUserViaAPI(request, {
      name: "E2E Multi Sync Shopper",
      email,
      password,
    });

    const products = await getInStockProducts(request, 2);
    const [firstProduct, secondProduct] = products;

    // Add first shoe as guest
    await page.goto(`/product/${firstProduct.id}`);
    await expect(
      page.getByRole("heading", { name: firstProduct.name })
    ).toBeVisible();
    await page.getByRole("button", { name: /TAMBAH KE KERANJANG/i }).click();
    await page
      .getByRole("button", { name: /Tutup keranjang samping/i })
      .click();

    // Add second shoe as guest
    await page.goto(`/product/${secondProduct.id}`);
    await expect(
      page.getByRole("heading", { name: secondProduct.name })
    ).toBeVisible();
    await page.getByRole("button", { name: /TAMBAH KE KERANJANG/i }).click();

    // Reload while still a guest — both items must remain in localStorage cart
    await page.goto("/cart");
    await page.reload();
    await expect(page.getByText(firstProduct.name).first()).toBeVisible();
    await expect(page.getByText(secondProduct.name).first()).toBeVisible();

    // Log in and confirm both items synced to the backend account
    await page.goto("/login?redirect=%2Fcart");
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: /^Login$/i }).click();

    await expect(page).toHaveURL(/\/cart$/);
    await page.reload();
    await expect(page.getByText(firstProduct.name).first()).toBeVisible();
    await expect(page.getByText(secondProduct.name).first()).toBeVisible();
  });
});
