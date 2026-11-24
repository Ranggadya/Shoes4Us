import { expect, test } from "@playwright/test";
import { loginViaUI, SEEDED_USER, uniqueEmail } from "./helpers/auth";

test.describe("Authentication & Protected Routes", () => {
  test("allows registering a new account, persists session on reload, and logs out", async ({
    page,
  }) => {
    const email = uniqueEmail("e2e-reg");

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /Buat Akun Shoes4Us/i })
    ).toBeVisible();

    await page.locator("#register-name").fill("E2E New Customer");
    await page.locator("#register-email").fill(email);
    await page.locator("#register-password").fill("Shoes4UsE2E!2026");
    await page.getByRole("button", { name: /^Daftar$/i }).click();

    await expect(page).toHaveURL(/\/$/);

    // Verify session survives a full page reload via /api/auth/me
    await page.reload();
    await page.getByRole("button", { name: /Menu profil pengguna/i }).click();
    await expect(page.getByRole("button", { name: /^Logout$/i })).toBeVisible();

    // Log out and verify unauthenticated menu state returns
    await page.getByRole("button", { name: /^Logout$/i }).click();
    await page.getByRole("button", { name: /Menu profil pengguna/i }).click();
    await expect(page.getByRole("link", { name: /^Login$/i })).toBeVisible();
  });

  test("guards checkout and admin pages from unauthenticated visitors", async ({
    page,
  }) => {
    await page.goto("/payment");
    await expect(
      page.getByRole("heading", { name: /Butuh Login/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Masuk Sekarang/i })
    ).toBeVisible();

    await page.goto("/admin/product/add");
    await expect(page).toHaveURL(/\/$/);
  });

  test("allows seeded customer to log in and open order history", async ({
    page,
  }) => {
    await loginViaUI(page, SEEDED_USER.email, SEEDED_USER.password);
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/order");
    await expect(page).toHaveURL(/\/order$/);
    await expect(
      page.getByRole("heading", { name: /Pesanan/i }).first()
    ).toBeVisible();
  });
});
