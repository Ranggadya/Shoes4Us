import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import CartPage from "../CartPage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { SAVED_COUPON_STORAGE_KEY } from "@/components/CouponInput";

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

vi.mock("@/context/CartContext", () => ({
  useCart: vi.fn(),
}));

vi.mock("react-hot-toast", () => {
  const fn = vi.fn();
  return {
    default: Object.assign(fn, {
      success: vi.fn(),
      error: vi.fn(),
      dismiss: vi.fn(),
    }),
  };
});

function createMockCartItem(overrides?: Partial<{ id: string; quantity: number; price: number; name: string; size: string; imageUrl: string | null }>) {
  const qty = overrides?.quantity ?? 2;
  const price = overrides?.price ?? 250000;
  return {
    id: overrides?.id ?? "item-1",
    product: {
      id: "prod-1",
      name: overrides?.name ?? "Nike Dunk Low Panda",
      price,
      imageUrl: overrides?.imageUrl === undefined ? "https://cdn.example.com/shoe.jpg" : overrides.imageUrl,
    },
    quantity: qty,
    lineTotal: price * qty,
    size: overrides?.size ?? "42",
  };
}

function mockCartState(overrides?: Partial<ReturnType<typeof useCart>>) {
  const defaultState: ReturnType<typeof useCart> = {
    cart: {
      id: "cart-1",
      items: [createMockCartItem()],
      totals: { subtotal: 500000, totalItems: 2 },
    },
    isLoading: false,
    error: null,
    addItem: vi.fn().mockResolvedValue(undefined),
    updateItemQuantity: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clearCart: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  vi.mocked(useCart).mockReturnValue(defaultState);
  return defaultState;
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    document.title = "";
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        name: "Budi",
        email: "budi@example.com",
        role: "CUSTOMER",
      },
      token: "token-123",
      isAdmin: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it("sets page title via SEO and renders error recovery with retry button calling refresh()", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    mockCartState({
      cart: { id: "", items: [], totals: { subtotal: 0, totalItems: 0 } },
      error: "Koneksi server terputus",
      refresh,
    });

    render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartPage />
      </MemoryRouter>
    );

    expect(document.title).toContain("Keranjang Belanja");
    expect(screen.getByRole("alert")).toHaveTextContent("Koneksi server terputus");

    const retryBtn = screen.getByRole("button", { name: /Muat Ulang Keranjang/i });
    expect(retryBtn).toHaveAttribute("type", "button");
    await userEvent.click(retryBtn);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders accessible semantics, product links, lazy images with error fallback, disabled decrement at qty 1, and per-item lock during update", async () => {
    let resolveUpdate!: () => void;
    const updateItemQuantity = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        })
    );
    mockCartState({
      cart: {
        id: "cart-1",
        items: [createMockCartItem({ id: "item-1", quantity: 1 })],
        totals: { subtotal: 250000, totalItems: 1 },
      },
      updateItemQuantity,
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartPage />
      </MemoryRouter>
    );

    // Semantic landmarks and list
    expect(container.querySelector("ul")).toBeInTheDocument();
    expect(container.querySelector("li")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /Ringkasan Pesanan/i })).toBeInTheDocument();

    // Product detail link
    const productLink = screen.getByRole("link", { name: /Nike Dunk Low Panda/i });
    expect(productLink).toHaveAttribute("href", "/product/prod-1");

    // Image attributes & fallback
    const img = screen.getByAltText("Nike Dunk Low Panda") as HTMLImageElement;
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe("/sepatu1.jpeg");

    // Stepper controls have product-specific aria-label, type="button", and minus disabled at qty 1
    const decBtn = screen.getByRole("button", {
      name: /Kurangi jumlah Nike Dunk Low Panda ukuran 42/i,
    });
    const incBtn = screen.getByRole("button", {
      name: /Tambah jumlah Nike Dunk Low Panda ukuran 42/i,
    });
    expect(decBtn).toHaveAttribute("type", "button");
    expect(incBtn).toHaveAttribute("type", "button");
    expect(decBtn).toBeDisabled();

    // Concurrent request lock when incrementing
    await userEvent.click(incBtn);
    expect(updateItemQuantity).toHaveBeenCalledTimes(1);
    expect(incBtn).toBeDisabled();

    resolveUpdate();
    await waitFor(() => expect(incBtn).not.toBeDisabled());
  });

  it("uses undo toast on single-item removal and in-app alertdialog on clearCart without window.confirm()", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockImplementation(() => true);
    const removeItem = vi.fn().mockResolvedValue(undefined);
    const addItem = vi.fn().mockResolvedValue(undefined);
    const clearCart = vi.fn().mockResolvedValue(undefined);
    mockCartState({ removeItem, addItem, clearCart });

    render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartPage />
      </MemoryRouter>
    );

    // Remove item directly with undo toast (no window.confirm)
    const removeBtn = screen.getByRole("button", {
      name: /Hapus Nike Dunk Low Panda ukuran 42/i,
    });
    expect(removeBtn).toHaveAttribute("type", "button");
    expect(removeBtn.className).toContain("min-h-[44px]");
    await userEvent.click(removeBtn);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalledWith("item-1");
    expect(toast).toHaveBeenCalled();

    // Verify Undo toast callback restores the removed item via addItem
    const toastRenderer = vi.mocked(toast).mock.calls[0]?.[0];
    expect(typeof toastRenderer).toBe("function");
    if (typeof toastRenderer === "function") {
      const undoView = render(
        toastRenderer({ id: "toast-undo-1" } as never)
      );
      const undoBtn = undoView.getByRole("button", { name: /Urungkan/i });
      await userEvent.click(undoBtn);
      expect(toast.dismiss).toHaveBeenCalledWith("toast-undo-1");
      expect(addItem).toHaveBeenCalledWith({
        productId: "prod-1",
        quantity: 2,
        size: "42",
        productSnapshot: {
          id: "prod-1",
          name: "Nike Dunk Low Panda",
          price: 250000,
          imageUrl: "https://cdn.example.com/shoe.jpg",
        },
      });
      undoView.unmount();
    }

    // Clear cart opens accessible in-app alertdialog (no window.confirm)
    const clearTrigger = screen.getByRole("button", { name: /Kosongkan Keranjang/i });
    expect(clearTrigger.className).toContain("min-h-[44px]");
    await userEvent.click(clearTrigger);

    expect(confirmSpy).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Ya, Kosongkan Keranjang/i })
    );
    expect(clearCart).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it("clarifies FREE_SHIPPING coupon without subtracting shipping maxDiscount from shoe subtotal, and notifies when coupon drops below minOrderAmount", async () => {
    sessionStorage.setItem(
      SAVED_COUPON_STORAGE_KEY,
      JSON.stringify({
        code: "GRATISONGKIR",
        description: "Gratis Ongkir hingga Rp 25.000 (Min. belanja Rp 150.000)",
        discountType: "FREE_SHIPPING",
        discountAmount: 25000,
        minOrderAmount: 150000,
      })
    );

    mockCartState({
      cart: {
        id: "cart-1",
        items: [createMockCartItem({ quantity: 1, price: 200000 })],
        totals: { subtotal: 200000, totalItems: 1 },
      },
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartPage />
      </MemoryRouter>
    );

    // Should explain shipping discount applies at checkout and keep Estimasi Total at Rp 200.000 (not Rp 175.000)
    expect(screen.getByText(/Subsidi Ongkir \(GRATISONGKIR\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/dihitung di checkout/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Rp\s*175\.000/)).not.toBeInTheDocument();

    // Drop subtotal below minOrderAmount -> coupon removed with toast notification
    mockCartState({
      cart: {
        id: "cart-1",
        items: [createMockCartItem({ quantity: 1, price: 100000 })],
        totals: { subtotal: 100000, totalItems: 1 },
      },
    });

    rerender(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("GRATISONGKIR")
      );
    });
  });

  it("preserves saved coupon in sessionStorage while cart is still loading", () => {
    const saved = JSON.stringify({
      code: "DISKON10",
      description: "Diskon 10%",
      discountType: "PERCENTAGE",
      discountAmount: 25000,
      minOrderAmount: 100000,
    });
    sessionStorage.setItem(SAVED_COUPON_STORAGE_KEY, saved);

    mockCartState({
      isLoading: true,
      cart: { id: "", items: [], totals: { subtotal: 0, totalItems: 0 } },
    });

    render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("status", { name: /Memuat keranjang belanja/i })).toBeInTheDocument();
    expect(sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY)).toBe(saved);
  });
});
