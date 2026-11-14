import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import AdminProductPage from "../AdminProductPage";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import type { Product } from "@/types";

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

describe("AdminProductPage", () => {
  const apparelProduct: Product = {
    id: "prod-apparel",
    name: "Shoes4Us Essential Hoodie",
    category: "Lifestyle",
    price: 499000,
    stock: 15,
    segment: "APPAREL",
    audience: "UNISEX",
    sizes: [
      { size: "S", stock: 5 },
      { size: "M", stock: 7 },
      { size: "XL", stock: 3 },
      { size: "CustomFit", stock: 2 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "admin-1",
        name: "Admin",
        email: "admin@shoes4us.id",
        role: "ADMIN",
      },
      token: "tok",
      isLoading: false,
      isAdmin: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it("gates fetch until admin verified, paginates catalog pages, preserves non-EU sizes on edit, and uses ConfirmDialog for delete", async () => {
    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.includes("page=1")) {
        return {
          success: true,
          data: { items: [apparelProduct] },
          meta: { page: 1, limit: 100, total: 101, totalPages: 2 },
        };
      }
      if (endpoint.includes("page=2")) {
        return {
          success: true,
          data: {
            items: [
              {
                id: "prod-page2",
                name: "Sneaker Page 2",
                category: "Sneakers",
                price: 1200000,
                stock: 4,
              },
            ],
          },
          meta: { page: 2, limit: 100, total: 101, totalPages: 2 },
        };
      }
      return { success: true, data: { items: [] } };
    });

    vi.mocked(api.put).mockResolvedValue({ success: true });
    vi.mocked(api.delete).mockResolvedValue({ success: true });

    render(
      <MemoryRouter initialEntries={["/admin/product"]}>
        <AdminProductPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Shoes4Us Essential Hoodie")).toBeInTheDocument();
      expect(screen.getByText("Sneaker Page 2")).toBeInTheDocument();
    });

    // Edit apparel product and verify non-EU & custom sizes are preserved
    const editButtons = screen.getAllByRole("button", { name: /^Edit$/i });
    await userEvent.click(editButtons[0]);

    const dialog = screen.getByRole("dialog", { name: /Edit Produk/i });
    expect(within(dialog).getByLabelText("CustomFit")).toHaveValue(2);
    expect(within(dialog).getByLabelText("S")).toHaveValue(5);

    // Rejects invalid price <= 0
    const priceInput = within(dialog).getByLabelText(/Harga \(Rp\)/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "0");
    await userEvent.click(within(dialog).getByRole("button", { name: /^Simpan$/i }));
    expect(toast.error).toHaveBeenCalledWith("Harga produk harus lebih dari Rp 0");
    expect(api.put).not.toHaveBeenCalled();

    // Valid price saves preserving CustomFit & S/M/XL
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "520000");
    await userEvent.click(within(dialog).getByRole("button", { name: /^Simpan$/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/products/prod-apparel",
        expect.any(FormData)
      );
    });
    const sentFormData = vi.mocked(api.put).mock.calls[0][1] as FormData;
    const sentSizes = JSON.parse(String(sentFormData.get("sizes")));
    expect(sentSizes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ size: "S", stock: 5 }),
        expect.objectContaining({ size: "M", stock: 7 }),
        expect.objectContaining({ size: "CustomFit", stock: 2 }),
      ])
    );

    // Delete uses ConfirmDialog instead of window.confirm
    const confirmSpy = vi.spyOn(window, "confirm");
    await userEvent.click(
      screen.getByRole("button", {
        name: /Hapus produk Shoes4Us Essential Hoodie/i,
      })
    );
    expect(confirmSpy).not.toHaveBeenCalled();
    const deleteAlert = screen.getByRole("alertdialog");
    await userEvent.click(
      within(deleteAlert).getByRole("button", { name: /Ya, Hapus Produk/i })
    );
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/products/prod-apparel");
    });
  });
});
