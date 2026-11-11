import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CartProvider, useCart } from "../CartContext";

vi.mock("../AuthContext", () => ({
  useAuth: () => ({
    user: null,
    token: null,
    isLoading: false,
  }),
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
  const { cart, addItem, updateItemQuantity, removeItem, clearCart } = useCart();

  return (
    <div>
      <div data-testid="total-items">{cart?.totals.totalItems ?? 0}</div>
      <div data-testid="subtotal">{cart?.totals.subtotal ?? 0}</div>
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
});

