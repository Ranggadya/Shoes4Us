import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CartDrawer from "../CartDrawer";
import { CartDrawerProvider, useCartDrawer } from "@/context/CartDrawerContext";

const mockNavigate = vi.fn();
const mockUpdateQty = vi.fn().mockResolvedValue(undefined);
const mockRemoveItem = vi.fn().mockResolvedValue(undefined);

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockCartState: {
  id: string;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl?: string | null;
    };
    quantity: number;
    lineTotal: number;
    size?: string | null;
  }>;
  totals: { subtotal: number; totalItems: number };
};

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    cart: mockCartState,
    updateItemQuantity: mockUpdateQty,
    removeItem: mockRemoveItem,
  }),
}));

function TriggerHarness() {
  const { openDrawer } = useCartDrawer();
  return (
    <button type="button" onClick={openDrawer}>
      Buka Keranjang
    </button>
  );
}

describe("CartDrawer slide-over mini cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartState = {
      id: "cart-1",
      items: [
        {
          id: "item-1",
          product: {
            id: "shoe-1",
            name: "New Balance 1000",
            price: 2299000,
            imageUrl: "/NB 1000 WHITE.webp",
          },
          quantity: 2,
          lineTotal: 4598000,
          size: "42",
        },
      ],
      totals: { subtotal: 4598000, totalItems: 2 },
    };
  });

  it("opens on trigger, updates item quantity, removes item, navigates checkout, and closes on Escape", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter>
        <CartDrawerProvider>
          <TriggerHarness />
          <CartDrawer />
        </CartDrawerProvider>
      </MemoryRouter>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Buka Keranjang" }));
    const dialog = screen.getByRole("dialog", { name: /Keranjang Belanja/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("New Balance 1000")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-qty-item-1")).toHaveTextContent("2");

    await user.click(
      screen.getByRole("button", { name: /Tambah jumlah New Balance 1000/i })
    );
    expect(mockUpdateQty).toHaveBeenCalledWith("item-1", 3);

    await user.click(
      screen.getByRole("button", { name: /Kurangi jumlah New Balance 1000/i })
    );
    expect(mockUpdateQty).toHaveBeenCalledWith("item-1", 1);

    await user.click(
      screen.getByRole("button", { name: /Hapus New Balance 1000 dari keranjang/i })
    );
    expect(mockRemoveItem).toHaveBeenCalledWith("item-1");

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen and navigate straight to checkout
    await user.click(screen.getByRole("button", { name: "Buka Keranjang" }));
    await user.click(screen.getByRole("button", { name: /^Checkout$/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/payment");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders honest empty state when cart has no items", async () => {
    const user = userEvent.setup({ delay: null });
    mockCartState = { id: "cart-empty", items: [], totals: { subtotal: 0, totalItems: 0 } };

    render(
      <MemoryRouter>
        <CartDrawerProvider>
          <TriggerHarness />
          <CartDrawer />
        </CartDrawerProvider>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Buka Keranjang" }));
    expect(screen.getByText(/Keranjang Anda Masih Kosong/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat Katalog/i })).toHaveAttribute(
      "href",
      "/product"
    );
  });
});
