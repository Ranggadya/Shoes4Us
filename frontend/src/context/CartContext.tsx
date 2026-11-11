import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { api } from "@/services/api";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

export type CartItem = {
  id: string;
  product: CartProduct;
  quantity: number;
  lineTotal: number;
  size?: string | null;
};

type CartTotals = {
  subtotal: number;
  totalItems: number;
};

type CartSummary = {
  id: string;
  items: CartItem[];
  totals: CartTotals;
};

type AddCartPayload = {
  productId: string;
  quantity: number;
  size?: string | null;
  productSnapshot?: CartProduct;
};

type CartContextValue = {
  cart: CartSummary | null;
  isLoading: boolean;
  error: string | null;
  addItem: (payload: AddCartPayload) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const GUEST_CART_STORAGE_KEY = "shoes4us_guest_cart_v1";

const emptyCart: CartSummary = {
  id: "",
  items: [],
  totals: { subtotal: 0, totalItems: 0 },
};

function computeTotals(items: CartItem[]): CartTotals {
  let subtotal = 0;
  let totalItems = 0;
  for (const item of items) {
    subtotal += item.product.price * item.quantity;
    totalItems += item.quantity;
  }
  return { subtotal, totalItems };
}

function loadGuestCart(): CartSummary {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return emptyCart;
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return emptyCart;
    const validItems = parsed.filter(
      (item) =>
        item &&
        item.product &&
        typeof item.product.id === "string" &&
        typeof item.product.name === "string" &&
        typeof item.product.price === "number" &&
        Number.isFinite(item.product.price) &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
    const items = validItems.map((item) => ({
      ...item,
      lineTotal: item.product.price * item.quantity,
    }));
    return {
      id: "guest-cart",
      items,
      totals: computeTotals(items),
    };
  } catch {
    return emptyCart;
  }
}

function saveGuestCartItems(items: CartItem[]): CartSummary {
  const normalized = items.map((item) => ({
    ...item,
    lineTotal: item.product.price * item.quantity,
  }));
  try {
    if (normalized.length === 0) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } else {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // Ignore storage errors
  }
  return {
    id: "guest-cart",
    items: normalized,
    totals: computeTotals(normalized),
  };
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [cart, setCart] = useState<CartSummary | null>(() => loadGuestCart());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncGuestCartToBackend = useCallback(async () => {
    const guest = loadGuestCart();
    if (guest.items.length === 0) return;

    for (const item of guest.items) {
      try {
        await api.post("/cart", {
          productId: item.product.id,
          quantity: item.quantity,
          size: item.size ?? undefined,
        });
      } catch {
        // Continue syncing remaining items even if one fails stock check
      }
    }

    try {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const loadCart = useCallback(
    async (silent = false) => {
      if (!user || !token) {
        setCart(loadGuestCart());
        setError(null);
        setIsLoading(false);
        return;
      }

      if (user.role === "ADMIN") {
        setCart(emptyCart);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!silent) setIsLoading(true);
      setError(null);
      try {
        await syncGuestCartToBackend();
        const data = await api.get<{ data: CartSummary }>("/cart");
        setCart(data.data ?? emptyCart);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat keranjang"
        );
        setCart(emptyCart);
      } finally {
        setIsLoading(false);
      }
    },
    [user, token, syncGuestCartToBackend]
  );

  useEffect(() => {
    if (authLoading) return;
    void loadCart();
  }, [authLoading, user, token, loadCart]);

  useEffect(() => {
    const pathname = location.pathname;
    const shouldRefreshCart =
      pathname === "/cart" ||
      pathname === "/payment" ||
      pathname === "/checkout";

    if (authLoading) return;
    if (shouldRefreshCart) {
      void loadCart(true);
    }
  }, [authLoading, user, token, location.pathname, loadCart]);

  const addItem = useCallback(
    async (payload: AddCartPayload) => {
      const { productId, quantity, size, productSnapshot } = payload;

      if (!token || !user) {
        let resolvedProduct: CartProduct | undefined = productSnapshot;
        if (!resolvedProduct) {
          const res = await api.get<{
            data?: {
              product?: {
                id: string;
                name: string;
                price: number;
                imageUrl?: string | null;
              };
            };
          }>(`/products/${encodeURIComponent(productId)}`);
          const p = res.data?.product;
          if (!p) {
            throw new Error("Produk tidak ditemukan.");
          }
          resolvedProduct = {
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl ?? null,
          };
        }

        const currentGuest = loadGuestCart();
        const normalizedSize = size || null;
        const itemKey = `${productId}__${normalizedSize ?? "nosize"}`;
        const existingIndex = currentGuest.items.findIndex(
          (it) =>
            it.product.id === productId && (it.size || null) === normalizedSize
        );

        const nextItems = [...currentGuest.items];
        if (existingIndex >= 0) {
          const existing = nextItems[existingIndex];
          const updatedQty = existing.quantity + quantity;
          nextItems[existingIndex] = {
            ...existing,
            quantity: updatedQty,
            lineTotal: existing.product.price * updatedQty,
          };
        } else {
          nextItems.push({
            id: itemKey,
            product: resolvedProduct,
            quantity,
            size: normalizedSize,
            lineTotal: resolvedProduct.price * quantity,
          });
        }

        setCart(saveGuestCartItems(nextItems));
        return;
      }

      await api.post("/cart", { productId, quantity, size });
      await loadCart(true);
    },
    [token, user, loadCart]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!token || !user) {
        const currentGuest = loadGuestCart();
        const nextItems = currentGuest.items
          .map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  lineTotal: item.product.price * quantity,
                }
              : item
          )
          .filter((item) => item.quantity > 0);
        setCart(saveGuestCartItems(nextItems));
        return;
      }

      await api.patch(`/cart/${itemId}`, { quantity });
      await loadCart(true);
    },
    [token, user, loadCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!token || !user) {
        const currentGuest = loadGuestCart();
        const nextItems = currentGuest.items.filter(
          (item) => item.id !== itemId
        );
        setCart(saveGuestCartItems(nextItems));
        return;
      }

      await api.delete(`/cart/${itemId}`);
      await loadCart(true);
    },
    [token, user, loadCart]
  );

  const clearCart = useCallback(async () => {
    if (!token || !user) {
      setCart(saveGuestCartItems([]));
      return;
    }

    await api.delete("/cart");
    await loadCart(true);
  }, [token, user, loadCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      error,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      refresh: loadCart,
    }),
    [
      cart,
      isLoading,
      error,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
      loadCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
