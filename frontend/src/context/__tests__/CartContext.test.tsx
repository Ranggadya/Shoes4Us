import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      <button type="button" onClick={() => navigate("/payment")}>
        Go Payment
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

  it("deduplicates concurrent guest cart sync on /cart mount and rapid /login -> /payment navigation", async () => {
    localStorage.setItem(
      "shoes4us_guest_cart_v1",
      JSON.stringify([
        {
          id: "shoe-a__41",
          productId: "shoe-a",
          size: "41",
          quantity: 1,
          product: {
            id: "shoe-a",
            name: "Nike Vomero 5",
            price: 2100000,
            imageUrl: null,
            maxStock: 5,
          },
        },
        {
          id: "shoe-b__42",
          productId: "shoe-b",
          size: "42",
          quantity: 2,
          product: {
            id: "shoe-b",
            name: "ASICS Gel-Kayano",
            price: 2400000,
            imageUrl: null,
            maxStock: 5,
          },
        },
      ])
    );

    let resolveFirstPost!: () => void;
    const firstPostGate = new Promise<void>((resolve) => {
      resolveFirstPost = resolve;
    });

    vi.mocked(api.post).mockImplementationOnce(async () => {
      await firstPostGate;
      return { success: true, data: {} };
    });
    vi.mocked(api.post).mockResolvedValue({ success: true, data: {} });
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: {
        id: "cart-1",
        items: [],
        totals: { subtotal: 0, totalItems: 0 },
      },
    });

    mockAuthState.user = { id: "user-1", email: "user@shoes4us.id" };
    mockAuthState.token = "jwt-token";

    const { rerender } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    // Wait until first guest item sync starts and stays in-flight
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    // Navigate rapidly to /payment while the initial sync is still in-flight
    await userEvent.click(screen.getByRole("button", { name: "Go Payment" }));
    rerender(
      <MemoryRouter initialEntries={["/payment"]}>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    // Release first POST so remaining items finish syncing
    resolveFirstPost();

    await waitFor(() => {
      expect(localStorage.getItem("shoes4us_guest_cart_v1")).toBeNull();
    });

    // Only 1 POST per guest item despite mount + /payment navigation
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post).toHaveBeenNthCalledWith(1, "/cart", {
      productId: "shoe-a",
      quantity: 1,
      size: "41",
    });
    expect(api.post).toHaveBeenNthCalledWith(2, "/cart", {
      productId: "shoe-b",
      quantity: 2,
      size: "42",
    });
  });

  it("triggers guest cart sync only once per item on /cart initial auth hydration", async () => {
    localStorage.setItem(
      "shoes4us_guest_cart_v1",
      JSON.stringify([
        {
          id: "shoe-c__42",
          productId: "shoe-c",
          size: "42",
          quantity: 1,
          product: {
            id: "shoe-c",
            name: "New Balance 990v6",
            price: 3200000,
            imageUrl: null,
            maxStock: 4,
          },
        },
      ])
    );

    vi.mocked(api.post).mockResolvedValue({ success: true, data: {} });
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: {
        id: "cart-1",
        items: [
          {
            id: "server-1",
            product: {
              id: "shoe-c",
              name: "New Balance 990v6",
              price: 3200000,
              imageUrl: null,
            },
            quantity: 1,
            lineTotal: 3200000,
            size: "42",
          },
        ],
        totals: { subtotal: 3200000, totalItems: 1 },
      },
    });

    mockAuthState.user = { id: "user-1", email: "user@shoes4us.id" };
    mockAuthState.token = "jwt-token";

    render(
      <MemoryRouter initialEntries={["/cart"]}>
        <CartProvider>
          <CartTestHarness />
        </CartProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("total-items")).toHaveTextContent("1");
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith("/cart", {
      productId: "shoe-c",
      quantity: 1,
      size: "42",
    });
  });
});

