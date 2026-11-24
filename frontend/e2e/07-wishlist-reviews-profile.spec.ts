import { expect, test } from "@playwright/test";
import {
  getInStockProduct,
  loginViaUI,
  registerUserViaAPI,
  uniqueEmail,
} from "./helpers/auth";

test.describe("Wishlist, Product Reviews & Profile", () => {
  test("adds a shoe to wishlist, persists across reloads, and removes it", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-wishlist");
    const password = "Wishlist123!";
    await registerUserViaAPI(request, {
      name: "Wishlist User",
      email,
      password,
    });
    const product = await getInStockProduct(request);

    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();

    await page.getByRole("button", { name: /^Wishlist$/i }).click();
    await expect(
      page.getByRole("button", { name: /^Tersimpan$/i })
    ).toBeVisible();

    // Verify persistence on /wishlist after reload
    await page.goto("/wishlist");
    await expect(page.getByText(product.name).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(product.name).first()).toBeVisible();

    // Remove item from wishlist
    await page.getByRole("button", { name: /Remove from wishlist/i }).click();
    await expect(
      page.getByRole("heading", { name: /Wishlist Masih Kosong/i })
    ).toBeVisible();
  });

  test("submits a 5-star product review and persists it in PostgreSQL", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-review");
    const password = "ReviewUser123!";
    await registerUserViaAPI(request, {
      name: "Reviewer E2E",
      email,
      password,
    });
    const product = await getInStockProduct(request);
    const reviewTitle = `Nyaman Dipakai ${Date.now()}`;
    const reviewBody =
      "Bantalan sepatu sangat empuk dan ukuran EU 42 pas di kaki untuk lari harian.";

    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();

    // Open Ulasan tab
    await page.getByRole("button", { name: /Ulasan \(/i }).click();
    await expect(
      page.getByRole("heading", { name: /Tulis Review/i })
    ).toBeVisible();

    // Select 5 stars and submit review
    await page.getByRole("button", { name: "5 stars" }).last().click();
    await page.getByPlaceholder("Ringkasan review Anda").fill(reviewTitle);
    await page
      .getByPlaceholder("Bagikan pengalaman Anda dengan produk ini...")
      .fill(reviewBody);
    await page.getByRole("button", { name: /Kirim Review/i }).click();

    await expect(page.getByText(reviewTitle).first()).toBeVisible();
    await expect(page.getByText(reviewBody).first()).toBeVisible();

    // Reload and confirm review persisted in database
    await page.reload();
    await page.getByRole("button", { name: /Ulasan \(/i }).click();
    await expect(page.getByText(reviewTitle).first()).toBeVisible();
  });

  test("updates user profile display name and persists after reload", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-profile");
    const password = "ProfileUser123!";
    const updatedName = `Rangga Updated ${Date.now().toString().slice(-4)}`;

    await registerUserViaAPI(request, {
      name: "Initial Name",
      email,
      password,
    });

    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: /^Profile$/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /Edit Account/i }).click();

    // First input in the Account form is "Nama Akun"
    const nameInput = page.locator("form").first().locator("input").first();
    await nameInput.fill(updatedName);
    await page.getByRole("button", { name: /Simpan Account/i }).click();

    await expect(page.getByText(updatedName).first()).toBeVisible();

    // Confirm persistence on full reload
    await page.reload();
    await expect(page.getByText(updatedName).first()).toBeVisible();
  });
});
