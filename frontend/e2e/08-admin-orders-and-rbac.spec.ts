import { expect, test } from "@playwright/test";
import {
  API_BASE_URL,
  createPaidOrderViaAPI,
  getInStockProduct,
  loginViaUI,
  registerUserViaAPI,
  SEEDED_ADMIN,
  uniqueEmail,
} from "./helpers/auth";

test.describe("Admin Order Lifecycle & RBAC Security", () => {
  test("updates a paid order to SHIPPED in Admin Dashboard and reflects tracking on buyer Order Status page", async ({
    browser,
    page,
    request,
  }) => {
    const buyerEmail = uniqueEmail("e2e-lifecycle");
    const buyerPassword = "Lifecycle123!";
    const { token: buyerToken } = await registerUserViaAPI(request, {
      name: "Lifecycle Buyer",
      email: buyerEmail,
      password: buyerPassword,
    });

    const product = await getInStockProduct(request);
    const order = await createPaidOrderViaAPI(request, buyerToken, product);

    // 1. Admin logs in and updates the order status from PAID -> SHIPPED
    await loginViaUI(page, SEEDED_ADMIN.email, SEEDED_ADMIN.password);
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/admin/dashboard?tab=orders");
    await expect(
      page.getByRole("heading", { name: /Manajemen Pesanan/i })
    ).toBeVisible();

    await page
      .getByPlaceholder(/Cari ID pesanan, nama pelanggan, atau email/i)
      .fill(order.orderNumber);

    const statusSelect = page.getByLabel(
      `Ubah status pesanan ${order.orderNumber}`
    );
    await expect(statusSelect).toBeVisible();

    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/orders/${order.id}/status`) &&
        res.request().method() === "PATCH"
    );
    await statusSelect.selectOption("SHIPPED");
    const patchRes = await patchPromise;
    expect(
      patchRes.ok(),
      `PATCH order status returned ${patchRes.status()}`
    ).toBeTruthy();

    // 2. Open isolated buyer context and verify SHIPPED status + auto-generated resi
    const buyerContext = await browser.newContext();
    try {
      const buyerPage = await buyerContext.newPage();
      await loginViaUI(buyerPage, buyerEmail, buyerPassword);
      await expect(buyerPage).toHaveURL(/\/$/);

      await buyerPage.goto("/status-pesanan");
      await expect(
        buyerPage.getByText(new RegExp(`Pesanan #${order.orderNumber}`, "i"))
      ).toBeVisible();
      await expect(buyerPage.getByText(/Sedang Dikirim/i).first()).toBeVisible();
      await expect(buyerPage.getByText(/No\. Resi:/i).first()).toBeVisible();
    } finally {
      await buyerContext.close();
    }
  });

  test("enforces RBAC by blocking regular USER accounts from admin routes and admin APIs", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-rbac");
    const password = "RbacUser123!";
    const { token: userToken } = await registerUserViaAPI(request, {
      name: "Regular Shopper",
      email,
      password,
    });

    // 1. API-level RBAC enforcement (must return 403 Forbidden)
    const usersRes = await request.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(usersRes.status()).toBe(403);

    const createProductRes = await request.post(`${API_BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${userToken}` },
      multipart: {
        name: "Unauthorized Shoe",
        category: "Running",
        price: "999000",
        stock: "1",
      },
    });
    expect(createProductRes.status()).toBe(403);

    // 2. Frontend route-level RBAC enforcement (redirects away from /admin/*)
    await loginViaUI(page, email, password);
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/admin/product");
    await expect(page).toHaveURL(/\/$/);
  });
});
