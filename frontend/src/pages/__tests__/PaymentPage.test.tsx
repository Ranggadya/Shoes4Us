import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import PaymentPage from "../PaymentPage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/services/api";
import {
  SAVED_COUPON_META_KEY,
  SAVED_COUPON_STORAGE_KEY,
} from "@/hooks/useCartCouponSync";

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

vi.mock("@/services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

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

function mockAuthenticatedUser() {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: "user-1",
      name: "Budi Santoso",
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
}

function mockPaymentCartState(overrides?: Partial<ReturnType<typeof useCart>>) {
  const defaultState: ReturnType<typeof useCart> = {
    cart: {
      id: "cart-1",
      items: [
        {
          id: "item-1",
          product: {
            id: "prod-1",
            name: "Nike Dunk Low Panda",
            price: 200000,
            imageUrl: null,
          },
          quantity: 2,
          lineTotal: 400000,
          size: "42",
        },
      ],
      totals: { subtotal: 400000, totalItems: 2 },
    },
    isLoading: false,
    error: null,
    syncWarnings: [],
    clearSyncWarnings: vi.fn(),
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

function fillShippingForm() {
  fireEvent.change(screen.getByPlaceholderText("Masukkan nama lengkap"), {
    target: { value: "Budi Santoso" },
  });
  fireEvent.change(screen.getByPlaceholderText("Masukkan alamat lengkap"), {
    target: { value: "Jl. Braga No. 10" },
  });
  fireEvent.change(screen.getByPlaceholderText("Contoh: Bandung"), {
    target: { value: "Bandung" },
  });
  fireEvent.change(screen.getByPlaceholderText("40115"), {
    target: { value: "40111" },
  });
  fireEvent.change(screen.getByPlaceholderText("08xxxxxxxxxx"), {
    target: { value: "081234567890" },
  });
}

describe("PaymentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    mockAuthenticatedUser();
    vi.mocked(api.get).mockRejectedValue(new Error("use fallback couriers"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders and dismisses cart sync warnings banner on /payment", async () => {
    const clearSyncWarnings = vi.fn();
    mockPaymentCartState({
      syncWarnings: ["Adidas Samba OG (42): Stok tidak mencukupi"],
      clearSyncWarnings,
    });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <PaymentPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Adidas Samba OG \(42\): Stok tidak mencukupi/
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Tutup peringatan sinkronisasi/i })
    );
    expect(clearSyncWarnings).toHaveBeenCalledTimes(1);
  });

  it("revalidates stale sessionStorage coupon on mount and when courier shipping fee changes", async () => {
    vi.useFakeTimers();
    sessionStorage.setItem(
      SAVED_COUPON_STORAGE_KEY,
      JSON.stringify({
        code: "GRATISONGKIR",
        description: "Gratis Ongkir hingga Rp 35.000",
        discountType: "FREE_SHIPPING",
        discountAmount: 18000,
        minOrderAmount: 150000,
      })
    );
    sessionStorage.setItem(
      SAVED_COUPON_META_KEY,
      JSON.stringify({
        code: "GRATISONGKIR",
        subtotal: 200000,
        shippingFee: 18000,
      })
    );

    vi.mocked(api.post)
      .mockResolvedValueOnce({
        success: true,
        data: {
          code: "GRATISONGKIR",
          description: "Gratis Ongkir hingga Rp 35.000",
          discountType: "FREE_SHIPPING",
          discountAmount: 18000,
          minOrderAmount: 150000,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          code: "GRATISONGKIR",
          description: "Gratis Ongkir hingga Rp 35.000",
          discountType: "FREE_SHIPPING",
          discountAmount: 32000,
          minOrderAmount: 150000,
        },
      });

    mockPaymentCartState();

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <PaymentPage />
      </MemoryRouter>
    );

    // Mount-time revalidation triggered because saved subtotal (200000) !== 400000
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(api.post).toHaveBeenCalledWith("/coupons/validate", {
      code: "GRATISONGKIR",
      subtotal: 400000,
      shippingFee: 18000,
    });

    // Switch courier to JNE YES (cost 32000) -> triggers debounced revalidation with new shippingFee
    fireEvent.click(screen.getByRole("button", { name: /JNE YES/i }));

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(api.post).toHaveBeenCalledWith("/coupons/validate", {
      code: "GRATISONGKIR",
      subtotal: 400000,
      shippingFee: 32000,
    });
    expect(screen.getByText(/-Rp\s*32\.000/)).toBeInTheDocument();
  });

  it("drops ineligible coupon below minOrderAmount, sends empty couponCode to /orders, and clears valid coupons after payment", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    sessionStorage.setItem(
      SAVED_COUPON_STORAGE_KEY,
      JSON.stringify({
        code: "HEMAT50RB",
        description: "Potongan Rp 50.000 (Min. belanja Rp 300.000)",
        discountType: "FIXED",
        discountAmount: 50000,
        minOrderAmount: 300000,
      })
    );

    mockPaymentCartState({
      cart: {
        id: "cart-1",
        items: [
          {
            id: "item-1",
            product: {
              id: "prod-1",
              name: "Adidas Samba OG",
              price: 200000,
              imageUrl: null,
            },
            quantity: 1,
            lineTotal: 200000,
            size: "42",
          },
        ],
        totals: { subtotal: 200000, totalItems: 1 },
      },
      refresh,
    });

    vi.mocked(api.post).mockImplementation(async (url: string) => {
      if (url === "/orders") {
        return { success: true, data: { order: { id: "ord-123" } } };
      }
      if (url === "/payment") {
        return { success: true, data: {} };
      }
      return { success: true, data: null };
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={["/payment"]}>
        <PaymentPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("HEMAT50RB")
      );
    });
    expect(sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY)).toBeNull();

    fillShippingForm();
    await userEvent.click(screen.getByRole("button", { name: /Bayar Sekarang/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Konfirmasi Pembayaran/i })
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders",
        expect.objectContaining({ couponCode: "" }),
        expect.any(Object)
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/status-pesanan");
    });
    unmount();

    // Now test eligible coupon is sent to /orders and cleared on payment completion
    vi.clearAllMocks();
    mockAuthenticatedUser();
    vi.mocked(api.get).mockRejectedValue(new Error("use fallback couriers"));
    vi.mocked(api.post).mockImplementation(async (url: string) => {
      if (url === "/orders") {
        return { success: true, data: { order: { id: "ord-456" } } };
      }
      if (url === "/payment") {
        return { success: true, data: {} };
      }
      return { success: true, data: null };
    });

    sessionStorage.setItem(
      SAVED_COUPON_STORAGE_KEY,
      JSON.stringify({
        code: "DISKON10",
        description: "Diskon 10%",
        discountType: "PERCENTAGE",
        discountAmount: 40000,
        minOrderAmount: 100000,
      })
    );
    sessionStorage.setItem(
      SAVED_COUPON_META_KEY,
      JSON.stringify({
        code: "DISKON10",
        subtotal: 400000,
        shippingFee: 18000,
      })
    );
    mockPaymentCartState({ refresh });

    render(
      <MemoryRouter initialEntries={["/payment"]}>
        <PaymentPage />
      </MemoryRouter>
    );

    fillShippingForm();
    await userEvent.click(screen.getByRole("button", { name: /Bayar Sekarang/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /Konfirmasi Pembayaran/i })
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/orders",
        expect.objectContaining({ couponCode: "DISKON10" }),
        expect.any(Object)
      );
    });
    await waitFor(() => {
      expect(sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(SAVED_COUPON_META_KEY)).toBeNull();
    });
  });
});
