"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";

type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type CartItem = {
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

type CartContextValue = {
  cart: CartSummary | null;
  isLoading: boolean;
  error: string | null;
  addItem: (payload: { productId: string; quantity: number }) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const emptyCart: CartSummary = {
  id: "",
  items: [],
  totals: { subtotal: 0, totalItems: 0 },
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const loadCart = useCallback(async () => {
    if (!user || !token) {
      setCart(emptyCart);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCart(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat keranjang");
      setCart(emptyCart);
    } finally {
      setIsLoading(false);
    }
  }, [user, token, headers]);

  useEffect(() => {
    if (!authLoading && user) loadCart();
  }, [authLoading, user, loadCart]);

  const ensureAuth = useCallback(() => {
    if (!token || !user) throw new Error("Silakan login untuk mengakses keranjang.");
  }, [token, user]);

  const addItem = useCallback(
    async (payload: { productId: string; quantity: number }) => {
      ensureAuth();
      const res = await fetch("/api/cart", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await loadCart();
    },
    [ensureAuth, headers, loadCart]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      ensureAuth();
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await loadCart();
    },
    [ensureAuth, headers, loadCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      ensureAuth();
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await loadCart();
    },
    [ensureAuth, headers, loadCart]
  );

  const clearCart = useCallback(async () => {
    ensureAuth();
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    await loadCart();
  }, [ensureAuth, headers, loadCart]);

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
    [cart, isLoading, error, addItem, updateItemQuantity, removeItem, clearCart, loadCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
