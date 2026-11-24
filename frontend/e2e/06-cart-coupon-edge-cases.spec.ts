import { expect, test } from "@playwright/test";
import { getInStockProduct, openCouponInput } from "./helpers/auth";

test.describe("Cart Mutations & Coupon Edge Cases", () => {
  test("updates item quantity inside Slide-Over Cart Drawer and closes on Escape", async ({
    page,
    request,
  }) => {
    const product = await getInStockProduct(request);

    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();

    await page.getByRole("button", { name: /TAMBAH KE KERANJANG/i }).click();

    const drawer = page.getByRole("dialog", { name: /Keranjang Belanja/i });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/Subtotal \(1 item\)/i);

    // Increment quantity to 2
    await drawer
      .getByRole("button", { name: `Tambah jumlah ${product.name}` })
      .click();
    await expect(drawer).toContainText(/Subtotal \(2 item\)/i);

    // Decrement quantity back to 1
    await drawer
      .getByRole("button", { name: `Kurangi jumlah ${product.name}` })
      .click();
    await expect(drawer).toContainText(/Subtotal \(1 item\)/i);

    // Escape key must close drawer
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
  });

  test("supports Undo toast after removing an item and alertdialog confirmation to clear cart", async ({
    page,
    request,
  }) => {
    const product = await getInStockProduct(request);

    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();
    await page.getByRole("button", { name: /TAMBAH KE KERANJANG/i }).click();

    await page.goto("/cart");
    await expect(page.getByText(product.name).first()).toBeVisible();

    // Remove single item and click "Urungkan" (Undo)
    const escapedName = product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await page
      .getByRole("button", { name: new RegExp(`Hapus ${escapedName}`, "i") })
      .click();

    const undoBtn = page.getByRole("button", { name: /Urungkan/i });
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();

    await expect(page.getByText(product.name).first()).toBeVisible();

    // Clear entire cart through accessible alertdialog
    await page.getByRole("button", { name: /Kosongkan Keranjang/i }).click();

    const confirmDialog = page.getByRole("alertdialog", {
      name: /Kosongkan Seluruh Keranjang\?/i,
    });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog
      .getByRole("button", { name: /Ya, Kosongkan Keranjang/i })
      .click();

    await expect(confirmDialog).not.toBeVisible();
    await expect(
      page.getByText(/Keranjang Belanja Kosong|kosong/i).first()
    ).toBeVisible();
  });

  test("rejects invalid coupon code and allows switching between HEMAT50RB and GRATISONGKIR", async ({
    page,
    request,
  }) => {
    const product = await getInStockProduct(request);

    await page.goto(`/product/${product.id}`);
    await expect(
      page.getByRole("heading", { name: product.name })
    ).toBeVisible();
    await page.getByRole("button", { name: /TAMBAH KE KERANJANG/i }).click();

    await page.goto("/cart");

    let couponInput = await openCouponInput(page);
    const applyBtn = page.getByRole("button", { name: /^Pakai$/i });

    // 1. Invalid code must show error alert
    await couponInput.fill("INVALID99");
    await applyBtn.click();
    await expect(page.getByRole("alert").filter({ hasText: /tidak valid/i })).toBeVisible();

    // 2. Apply HEMAT50RB fixed discount
    await couponInput.fill("HEMAT50RB");
    await applyBtn.click();
    await expect(page.getByText(/Diskon \(HEMAT50RB\)/i)).toBeVisible();

    // 3. Remove HEMAT50RB and switch to GRATISONGKIR
    await page.getByRole("button", { name: /Hapus voucher HEMAT50RB/i }).click();
    couponInput = await openCouponInput(page);

    await couponInput.fill("GRATISONGKIR");
    await page.getByRole("button", { name: /^Pakai$/i }).click();
    await expect(page.getByText(/Subsidi Ongkir \(GRATISONGKIR\)/i)).toBeVisible();
  });
});
