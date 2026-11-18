import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WishlistPage from "../WishlistPage";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  ApiError: class extends Error {
    status: number;
    constructor(msg: string, status: number) {
      super(msg);
      this.status = status;
    }
  },
  api: {
    get: vi.fn(),
  },
}));

const stableUser = {
  id: "u1",
  name: "Budi",
  email: "budi@shoes4us.com",
  role: "USER",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: stableUser,
    isLoading: false,
  }),
}));

vi.mock("@/context/WishlistContext", () => ({
  useWishlist: () => ({
    toggleProduct: vi.fn(),
  }),
}));

describe("WishlistPage stock display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides 'Sisa X' stock counts for low-stock products while keeping HABIS status at 0", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [
          {
            id: "w1",
            productId: "p1",
            createdAt: "2026-11-18T00:00:00Z",
            product: {
              id: "p1",
              name: "Nike Dunk Low",
              price: 1900000,
              imageUrl: "/sepatu1.jpeg",
              category: { id: "c1", name: "Sneakers", slug: "sneakers" },
              stock: 3,
              slug: "nike-dunk-low",
            },
          },
          {
            id: "w2",
            productId: "p2",
            createdAt: "2026-11-18T00:00:00Z",
            product: {
              id: "p2",
              name: "ASICS Gel-1130",
              price: 1700000,
              imageUrl: "/sepatu2.jpeg",
              category: { id: "c2", name: "Running", slug: "running" },
              stock: 0,
              slug: "asics-gel-1130",
            },
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Nike Dunk Low")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Sisa 3/i)).not.toBeInTheDocument();
    expect(screen.getByText("HABIS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pilih Ukuran/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Habis/i })).toBeDisabled();
  });
});
