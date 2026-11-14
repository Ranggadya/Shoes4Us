import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CartProvider, useCart } from "../CartContext";
import { api } from "@/services/api";
import toast from "react-hot-toast";

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: {
    user: null as { id: string; email: string } | null,
    token: null as string | null,
    isLoading: false,
  },
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function CartTestHarness() {
  const {
    cart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    syncWarnings,
    clearSyncWarnings,
  } = useCart();
  const [lastError, setLastError] = useState("");

  return (
    <div>
      <div data-testid="total-items">{cart?.totals?.totalItems ?? 0}</div>
      <div data-testid="subtotal">{cart?.totals?.subtotal ?? 0}</div>
      <div data-testid="sync-warnings">{syncWarnings.join(" | ")}</div>
      <div data-testid="last-error">{lastError}</div>
      <ul>
        {cart?.items.map((it) => (
          <li key={it.id} data-testid={`item-${it.id}`}>
            {it.product.name} ({it.size}) x{it.quantity} = {it.lineTotal}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          void addItem({
            productId: "shoe-1",
            quantity: 1,
            size: "42",
            productSnapshot: {
              id: "shoe-1",
              name: "Nike Air Zoom",
              price: 2000000,
            },
          })
        }
      >
        Add Shoe 42
      </button>
      <button
        type="button"
        onClick={() => {
          setLastError("");
          void addItem({
            productId: "shoe-limited",
            quantity: 2,
            size: "42",
            productSnapshot: {
              id: "shoe-limited",
              name: "Limited Dunk",
              price: 1800000,
              maxStock: 2,
            },
          }).catch((err: unknown) => {
            setLastError(err instanceof Error ? err.message : String(err));
          });
        }}
      >
        Add Limited Max2
      </button>
      <button
        type="button"
        onClick={() => {
          setLastError("");
          void updateItemQuantity("shoe-limited__42", 5).catch((err: unknown) => {
            setLastError(err instanceof Error ? err.message : String(err));
          });
        }}
      >
        Exceed Limited Qty
      </button>
      <button type="button" onClick={clearSyncWarnings}>
        Clear Sync Warnings
      </button>
      <button
        type="button"
        onClick={() => void updateItemQuantity("shoe-1__42", 3)}
      >
        Set Qty 3
      </button>
      <button
        type="button"
        onClick={() => void removeItem("shoe-1__42")}
      >
        Remove Shoe
      </button>
      <button type="button" onClick={() => void clearCart()}>
        Clear Cart
      </button>
    </div>
  );
}

describe("CartContext guest cart management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthState.user = null;
    mockAuthState.token = null;
    mockAuthState.isLoading = false;
  });

  it("adds items, updates quantity, removes items, and clears guest cart", async () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("total-items")).toHaveTextContent("0");

    await userEvent.click(screen.getByRole("button", { name: "Add Shoe 42" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("1");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("2000000");

    await userEvent.click(screen.getByRole("button", { name: "Set Qty 3" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("3");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("6000000");

    await userEvent.click(screen.getByRole("button", { name: "Remove Shoe" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("0");

    await userEvent.click(screen.getByRole("button", { name: "Add Shoe 42" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear Cart" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("0");
  });

  it("ignores corrupted or malformed entries in localStorage without producing NaN subtotal", async () => {
    localStorage.setItem(
      "shoes4us_guest_cart_v1",
      JSON.stringify([
        { id: "corrupt-1", product: { id: "x", name: "Broken" }, quantity: 2 },
        {
          id: "valid-1__41",
          product: { id: "valid-1", name: "Adidas Ultraboost", price: 1500000 },
          quantity: 2,
          size: "41",
        },
      ])
    );

    render(
      <MemoryRouter>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("total-items")).toHaveTextContent("2");
      expect(screen.getByTestId("subtotal")).toHaveTextContent("3000000");
    });
  });

  it("enforces maxStock ceiling in guest cart on addItem and updateItemQuantity", async () => {
    render(
      <MemoryRouter>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: "Add Limited Max2" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("2");
    expect(screen.getByTestId("last-error")).toHaveTextContent("");

    // Adding again exceeds maxStock (2)
    await userEvent.click(screen.getByRole("button", { name: "Add Limited Max2" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("2");
    expect(screen.getByTestId("last-error").textContent).not.toBe("");

    // Updating quantity above maxStock (5 > 2) also fails without changing qty
    await userEvent.click(screen.getByRole("button", { name: "Exceed Limited Qty" }));
    expect(screen.getByTestId("total-items")).toHaveTextContent("2");
    expect(screen.getByTestId("last-error").textContent).not.toBe("");
  });

  it("surfaces syncWarnings and toast.error when guest cart items fail backend stock sync on login", async () => {
    localStorage.setItem(
      "shoes4us_guest_cart_v1",
      JSON.stringify([
        {
          id: "shoe-oof__42",
          productId: "shoe-oof",
          size: "42",
          quantity: 4,
          product: {
            id: "shoe-oof",
            name: "Adidas Samba OG",
            price: 1900000,
            imageUrl: null,
            maxStock: 4,
          },
        },
      ])
    );

    mockAuthState.user = { id: "user-1", email: "user@shoes4us.id" };
    mockAuthState.token = "jwt-token";

    vi.mocked(api.post).mockRejectedValueOnce(new Error("Stok ukuran 42 tidak mencukupi"));
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: {
        id: "cart-1",
        items: [],
        totals: { subtotal: 0, totalItems: 0 },
      },
    });

    render(
      <MemoryRouter>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("sync-warnings")).toHaveTextContent(/Adidas Samba OG/i);
    });
    expect(toast.error).toHaveBeenCalled();
    expect(localStorage.getItem("shoes4us_guest_cart_v1")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Clear Sync Warnings" }));
    expect(screen.getByTestId("sync-warnings")).toHaveTextContent("");
  });
});

