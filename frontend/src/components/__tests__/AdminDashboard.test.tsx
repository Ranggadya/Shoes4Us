import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import AdminDashboard from "../AdminDashboard";
import {
  buildCsvContent,
  sanitizeCsvCell,
} from "../admin/dashboard-utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import type { Order, Product } from "@/types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: overrides.id ?? "ord-1",
    orderNumber: overrides.orderNumber ?? "S4U-001",
    userId: overrides.userId ?? "usr-1",
    status: overrides.status ?? "PENDING",
    totalAmount: overrides.totalAmount ?? 500000,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    items: overrides.items ?? [
      {
        id: "oi-1",
        productId: "prod-1",
        quantity: 2,
        price: 250000,
        size: "42",
        product: { id: "prod-1", name: "Nike Dunk Low", price: 250000 },
      },
    ],
    user: overrides.user ?? { name: "Andi Pembeli", email: "andi@example.com" },
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? "prod-1",
    name: overrides.name ?? "Nike Dunk Low",
    price: overrides.price ?? 250000,
    stock: overrides.stock ?? 15,
    category: overrides.category ?? "Sneakers",
  };
}

function mockAdminAuth(isLoading = false, role: "ADMIN" | "USER" = "ADMIN") {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: "admin-1",
      name: "Admin Shoes4Us",
      email: "admin@shoes4us.id",
      role,
    },
    token: "tok",
    isLoading,
    isAdmin: role === "ADMIN",
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn(),
  });
}

describe("AdminDashboard & dashboard-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminAuth(false, "ADMIN");
  });

  it("gates fetching on auth completion and redirects non-admin users", () => {
    mockAdminAuth(true, "USER");
    const { rerender } = render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(api.get).not.toHaveBeenCalled();

    mockAdminAuth(false, "USER");
    rerender(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(api.get).not.toHaveBeenCalled();
  });

  it("shows honest empty states with zero fabricated KPI numbers when no orders exist", async () => {
    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith("/orders")) {
        return {
          success: true,
          data: { orders: [] },
          meta: { page: 1, limit: 100, total: 0, totalPages: 1 },
        };
      }
      if (endpoint.startsWith("/products")) {
        return {
          success: true,
          data: { items: [makeProduct()] },
          meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
        };
      }
      if (endpoint === "/users") {
        return { success: true, data: [] };
      }
      return { success: true, data: {} };
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Belum ada pesanan dalam 7 hari terakhir/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Belum ada transaksi penjualan per kategori/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Belum ada produk terjual pada pesanan aktif/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/\+14%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+45%/)).not.toBeInTheDocument();
  });

  it("paginates through multiple pages for orders and products and survives order.items = null", async () => {
    const nullItemsOrder = {
      ...makeOrder({ id: "ord-p1", orderNumber: "S4U-P1", totalAmount: 300000 }),
      items: null as unknown as Order["items"],
    };
    const page2Order = makeOrder({
      id: "ord-p2",
      orderNumber: "S4U-P2",
      totalAmount: 700000,
      user: { name: "Rina Halaman 2", email: "rina@example.com" },
    });

    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith("/orders") && endpoint.includes("page=1")) {
        return {
          success: true,
          data: { orders: [nullItemsOrder] },
          meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
        };
      }
      if (endpoint.startsWith("/orders") && endpoint.includes("page=2")) {
        return {
          success: true,
          data: { orders: [page2Order] },
          meta: { page: 2, limit: 100, total: 101, totalPages: 2 },
        };
      }
      if (endpoint.startsWith("/products") && endpoint.includes("page=1")) {
        return {
          success: true,
          data: { items: [makeProduct({ id: "prod-1", name: "Page1 Shoe" })] },
          meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
        };
      }
      if (endpoint.startsWith("/products") && endpoint.includes("page=2")) {
        return {
          success: true,
          data: {
            items: [makeProduct({ id: "prod-2", name: "Page2 Shoe", stock: 2 })],
          },
          meta: { page: 2, limit: 100, total: 101, totalPages: 2 },
        };
      }
      if (endpoint === "/users") {
        return {
          success: true,
          data: [
            {
              id: "usr-only-reg",
              name: "Belum Order User",
              email: "registered@example.com",
              role: "USER",
            },
          ],
        };
      }
      return { success: true, data: {} };
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Rina Halaman 2/i)).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith(
      "/orders?scope=all&page=2&limit=100",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(api.get).toHaveBeenCalledWith(
      "/products?page=2&limit=100&includeDetails=true",
      expect.objectContaining({ cache: "no-store" })
    );
    // Open order with items: null in OrderDetailModal safely
    await userEvent.click(
      screen.getByRole("button", { name: /Lihat detail pesanan S4U-P1/i })
    );
    expect(
      screen.getByText(/Tidak ada rincian produk pada pesanan ini/i)
    ).toBeInTheDocument();
  });

  it("enforces allowed order transitions, per-order locking, ConfirmDialog on CANCELLED, and keeps modal open on failure", async () => {
    const orderPending = makeOrder({
      id: "ord-pend",
      orderNumber: "S4U-100",
      status: "PENDING",
    });
    const orderPaid = makeOrder({
      id: "ord-paid",
      orderNumber: "S4U-101",
      status: "PAID",
    });

    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith("/orders")) {
        return {
          success: true,
          data: { orders: [orderPending, orderPaid] },
          meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
        };
      }
      if (endpoint.startsWith("/products")) {
        return {
          success: true,
          data: { items: [makeProduct()] },
          meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
        };
      }
      return { success: true, data: [] };
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard?tab=orders"]}>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("#S4U-100")).toBeInTheDocument();
    });

    // Separate PAID filter pill exists
    expect(screen.getByRole("button", { name: /Dibayar \(1\)/i })).toBeInTheDocument();

    const pendingSelect = screen.getByLabelText("Ubah status pesanan S4U-100");
    const optionValues = Array.from(pendingSelect.querySelectorAll("option")).map(
      (opt) => opt.getAttribute("value")
    );
    expect(optionValues).toEqual(["PENDING", "PROCESSING", "PAID", "CANCELLED"]);
    expect(optionValues).not.toContain("SHIPPED");
    expect(optionValues).not.toContain("DELIVERED");

    // Selecting CANCELLED shows ConfirmDialog before calling PATCH
    await userEvent.selectOptions(pendingSelect, "CANCELLED");
    const alertDialog = screen.getByRole("alertdialog");
    expect(within(alertDialog).getByText(/Batalkan Pesanan\?/i)).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();

    // Dismissing dialog leaves order untouched
    await userEvent.click(within(alertDialog).getByRole("button", { name: /^Kembali$/i }));
    expect(api.patch).not.toHaveBeenCalled();

    // Confirming calls PATCH
    let resolvePatch!: () => void;
    vi.mocked(api.patch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePatch = () => resolve({ success: true });
        })
    );

    await userEvent.selectOptions(pendingSelect, "PROCESSING");
    // Pending order row is locked, while PAID row remains enabled (per-order lock!)
    expect(pendingSelect).toBeDisabled();
    expect(screen.getByLabelText("Ubah status pesanan S4U-101")).toBeEnabled();

    resolvePatch();
    await waitFor(() => {
      expect(pendingSelect).toHaveValue("PROCESSING");
    });

    // Modal failure keeps modal open
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("Transisi gagal"));
    await userEvent.click(
      screen.getByRole("button", { name: /Lihat detail pesanan S4U-101/i })
    );
    const modal = screen.getByRole("dialog");
    const modalSelect = within(modal).getByLabelText(/Ubah status pesanan/i);
    await userEvent.selectOptions(modalSelect, "SHIPPED");
    await userEvent.click(within(modal).getByRole("button", { name: /Simpan Status/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Transisi gagal");
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("neutralizes CSV formula injection (including leading whitespace/tab) and prepends UTF-8 BOM", () => {
    expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe('"\'=CMD|\' /C calc\'!A0"');
    expect(sanitizeCsvCell("  +1+1")).toBe('"\'  +1+1"');
    expect(sanitizeCsvCell("\t-2")).toBe('"\'\t-2"');
    expect(sanitizeCsvCell('Nike "Panda"')).toBe('"Nike ""Panda"""');

    const csv = buildCsvContent(["Nama", "Total"], [[" =HYPERLINK()", 50000]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"\' =HYPERLINK()","50000"');
  });
});
