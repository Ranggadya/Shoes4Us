import { expect, test } from "@playwright/test";
import {
  getInStockProduct,
  loginViaUI,
  registerUserViaAPI,
  uniqueEmail,
} from "./helpers/auth";

test.describe("Complete E-Commerce Checkout Flow", () => {
  test("completes add-to-cart, DISKON10 voucher, shipping, simulated payment, and order tracking", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-checkout");
    const password = "Checkout123!";
    await registerUserViaAPI(request, {
      name: "E2E Buyer",
      email,
      password,
    });

    const product = await getInStockProduct(request);

    // 1. Log in as fresh customer
    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/\/$/);

    // 2. Open product detail and add to cart
    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();

    await page
      .getByRole("button", { name: /TAMBAH KE KERANJANG/i })
      .click();

    const drawer = page.getByRole("dialog", { name: /Keranjang Belanja/i });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: /Lihat Keranjang/i }).click();
    await expect(page).toHaveURL(/\/cart$/);

    // 3. Apply DISKON10 promotional coupon on /cart
    const voucherToggle = page.getByRole("button", {
      name: /Punya kode voucher\?/i,
    });
    if (await voucherToggle.isVisible()) {
      await voucherToggle.click();
    }

    await page
      .getByPlaceholder(/Masukkan kode \(cth: DISKON10\)/i)
      .fill("DISKON10");
    await page.getByRole("button", { name: /^Pakai$/i }).click();

    await expect(page.getByText(/Diskon \(DISKON10\)/i)).toBeVisible();

    // 4. Proceed to shipping & payment page
    await page
      .getByRole("button", { name: /Lanjut ke Pengiriman/i })
      .click();
    await expect(page).toHaveURL(/\/(payment|checkout)$/);
    await expect(
      page.getByRole("heading", { name: /Pembayaran & Pengiriman/i })
    ).toBeVisible();

    // Verify voucher carried over to checkout summary
    await expect(page.getByText(/Diskon Voucher \(DISKON10\)/i)).toBeVisible();

    // 5. Fill shipping details
    await page.getByPlaceholder("Masukkan nama lengkap").fill("E2E Buyer");
    await page
      .getByPlaceholder("Masukkan alamat lengkap")
      .fill("Jl. Jend. Sudirman No. 45, Kebayoran Baru");
    await page.getByPlaceholder("Contoh: Bandung").fill("Jakarta Selatan");
    await page.getByPlaceholder("40115").fill("12190");
    await page.getByPlaceholder("08xxxxxxxxxx").fill("081234567890");

    // 6. Open payment confirmation dialog and confirm simulated payment
    await page.getByRole("button", { name: /Bayar Sekarang/i }).click();

    const modal = page.getByRole("dialog", { name: /Detail Pembayaran/i });
    await expect(modal).toBeVisible();
    await modal
      .getByRole("button", { name: /Konfirmasi Pembayaran/i })
      .click();

    // 7. Verify redirect to /status-pesanan with paid order record
    await expect(page).toHaveURL(/\/status-pesanan$/);
    await expect(
      page.getByRole("heading", { name: /Status Pesanan/i })
    ).toBeVisible();
    await expect(page.getByText(/Pesanan #ORD-/i).first()).toBeVisible();
    await expect(page.getByText(product.name).first()).toBeVisible();
    await expect(page.getByText(/Pembayaran Berhasil/i).first()).toBeVisible();

    // 8. Verify cart has been cleared after checkout
    await page.goto("/cart");
    await expect(page.getByText(/Keranjang Belanja Kosong|kosong/i).first()).toBeVisible();
  });
});
