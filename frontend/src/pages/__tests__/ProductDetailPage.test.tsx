import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProductDetailPage from "../ProductDetailPage";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addItem: vi.fn(),
  }),
}));

vi.mock("@/context/WishlistContext", () => ({
  useWishlist: () => ({
    isWishlisted: () => false,
    toggleProduct: vi.fn(),
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock("@/components/SEO", () => ({
  default: () => null,
}));

vi.mock("@/components/StarRating", () => ({
  default: () => null,
}));

vi.mock("@/components/ReviewForm", () => ({
  default: () => null,
}));

vi.mock("@/components/ReviewList", () => ({
  default: () => null,
}));

vi.mock("@/components/RelatedProducts", () => ({
  default: () => null,
}));

vi.mock("@/components/SizeGuideModal", () => ({
  default: () => null,
}));

function renderProductDetail(productId = "shoe-1") {
  return render(
    <MemoryRouter initialEntries={[`/product/${productId}`]}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProductDetailPage user stock visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("hides numeric stock counts and store 'Stok Terbatas' copy while disabling 0-stock sizes", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith("/reviews")) {
        return { success: true, data: { summary: { averageRating: 4.8, total: 5 } } };
      }
      return {
        success: true,
        data: {
          product: {
            id: "shoe-1",
            name: "Nike Vomero 5",
            price: 2499000,
            description: "Sepatu lari harian.",
            imageUrl: "/sepatu1.jpeg",
            brand: "Nike",
            audience: "MEN",
            category: { id: "c1", name: "Running", slug: "running" },
            stock: 4,
            sizes: [
              { id: "s1", size: "41", stock: 0 },
              { id: "s2", size: "42", stock: 3 },
            ],
          },
        },
      };
    });

    renderProductDetail("shoe-1");

    expect(await screen.findByRole("heading", { name: "Nike Vomero 5" })).toBeInTheDocument();

    // Exact stock text must not be exposed
    expect(screen.queryByText(/Stok tersedia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/3 pasang/i)).not.toBeInTheDocument();

    // 0-stock size button remains disabled; in-stock size works
    const size41Btn = screen.getByRole("button", { name: /US 8(?!\.5)/i });
    const size42Btn = screen.getByRole("button", { name: /US 8\.5/i });
    expect(size41Btn).toBeDisabled();
    expect(size42Btn).toBeEnabled();

    // Store availability modal must not show "Stok Terbatas"
    await user.click(screen.getByRole("button", { name: /Periksa ketersediaan di toko/i }));
    expect(screen.queryByText(/Stok Terbatas/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Tersedia").length).toBe(4);
  });

  it("shows HABIS badge (without STOK) and disables purchase actions when total stock is 0", async () => {
    vi.mocked(api.get).mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith("/reviews")) {
        return { success: true, data: { summary: { averageRating: 0, total: 0 } } };
      }
      return {
        success: true,
        data: {
          product: {
            id: "shoe-out",
            name: "Adidas Gazelle",
            price: 1800000,
            description: "Klasik.",
            imageUrl: "/sepatu2.jpeg",
            brand: "Adidas",
            category: { id: "c2", name: "Lifestyle", slug: "lifestyle" },
            stock: 0,
            sizes: [{ id: "s1", size: "42", stock: 0 }],
          },
        },
      };
    });

    renderProductDetail("shoe-out");

    await waitFor(() => {
      expect(screen.getByText("HABIS")).toBeInTheDocument();
    });
    expect(screen.queryByText(/STOK HABIS/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /BELI SEKARANG/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /TAMBAH KE KERANJANG/i })).toBeDisabled();
  });
});
