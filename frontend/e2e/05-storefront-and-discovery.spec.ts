import { expect, test } from "@playwright/test";
import { getInStockProducts } from "./helpers/auth";

test.describe("Storefront, Discovery & Privacy", () => {
  test("supports Quick Size Finder and Tabbed Product Showcase on the homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Tabbed Product Showcase switching
    await expect(
      page.getByRole("heading", { name: /Kurasi Koleksi Pilihan/i })
    ).toBeVisible();

    const saleTab = page.getByRole("tab", { name: /Sedang Diskon/i });
    await saleTab.click();
    await expect(saleTab).toHaveAttribute("aria-selected", "true");

    const exclusiveTab = page.getByRole("tab", { name: /Exclusive/i });
    await exclusiveTab.click();
    await expect(exclusiveTab).toHaveAttribute("aria-selected", "true");

    // 2. Quick Size Finder navigates directly to filtered catalog
    const sizeFinder = page.getByRole("region", {
      name: /Cari Langsung Berdasarkan Ukuranmu/i,
    });
    await expect(sizeFinder).toBeVisible();
    await sizeFinder.getByRole("link", { name: /EU 42/i }).click();

    await expect(page).toHaveURL(/\/product\?size=42$/);
  });

  test("filters catalog by search query and recovers cleanly from empty search results", async ({
    page,
  }) => {
    await page.goto("/product?search=Pegasus");
    await expect(page.getByText(/Nike Air Pegasus 40/i).first()).toBeVisible();

    // Unknown search term should render empty state with Reset Filter action
    await page.goto("/product?search=sepatu-tidak-ada-e2e-999");
    await expect(
      page.getByRole("heading", { name: /Tidak Ada Hasil/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /Reset Filter/i }).click();
    await expect(page).toHaveURL(/\/product$/);
    await expect(page.getByText(/Nike Air/i).first()).toBeVisible();
  });

  test("tracks Recently Viewed shoes across visits, clears history, and hides numeric stock counts", async ({
    page,
    request,
  }) => {
    const [firstProduct, secondProduct] = await getInStockProducts(request, 2);

    // Visit first product and confirm numeric stock counts are hidden from shoppers
    await page.goto(`/product/${firstProduct.id}`);
    await expect(
      page.getByRole("heading", { name: firstProduct.name })
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/Sisa\s+\d+/i);

    // Visit second product
    await page.goto(`/product/${secondProduct.id}`);
    await expect(
      page.getByRole("heading", { name: secondProduct.name })
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/Sisa\s+\d+/i);

    // Homepage Recently Viewed section must list both visited shoes
    await page.goto("/");
    const recentlyViewed = page.getByRole("region", {
      name: /Terakhir Dilihat/i,
    });
    await expect(recentlyViewed).toBeVisible();
    await expect(recentlyViewed).toContainText(firstProduct.name);
    await expect(recentlyViewed).toContainText(secondProduct.name);

    // Clearing history removes the section
    await recentlyViewed
      .getByRole("button", { name: /Hapus Riwayat/i })
      .click();
    await expect(recentlyViewed).not.toBeVisible();
  });
});
