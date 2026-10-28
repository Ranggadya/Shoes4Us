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
  addItem: (payload: {
    productId: string;
    quantity: number;
    size?: string | null;
  }) => Promise<void>;
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
  const location = useLocation();
  const [cart, setCart] = useState<CartSummary | null>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(
    async (silent = false) => {
      if (!user || !token) {
        setCart(emptyCart);
        setIsLoading(false);
        return;
      }

      if (!silent) setIsLoading(true);
      setError(null);
      try {
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
    [user, token]
  );

  useEffect(() => {
    const pathname = location.pathname;
    const shouldLoadCart =
      pathname === "/cart" ||
      pathname === "/payment" ||
      pathname === "/checkout";

    if (authLoading) return;
    if (!user) {
      setCart(emptyCart);
      setIsLoading(false);
      return;
    }
    if (shouldLoadCart) {
      void loadCart();
      return;
    }

    setIsLoading(false);
  }, [authLoading, user, location.pathname, loadCart]);

  const ensureAuth = useCallback(() => {
    if (!token || !user) {
      throw new Error("Silakan login untuk mengakses keranjang.");
    }
  }, [token, user]);

  const addItem = useCallback(
    async (payload: {
      productId: string;
      quantity: number;
      size?: string | null;
    }) => {
      ensureAuth();
      await api.post("/cart", payload);
      await loadCart(true);
    },
    [ensureAuth, loadCart]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      ensureAuth();
      await api.patch(`/cart/${itemId}`, { quantity });
      await loadCart(true);
    },
    [ensureAuth, loadCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      ensureAuth();
      await api.delete(`/cart/${itemId}`);
      await loadCart(true);
    },
    [ensureAuth, loadCart]
  );

  const clearCart = useCallback(async () => {
    ensureAuth();
    await api.delete("/cart");
    await loadCart(true);
  }, [ensureAuth, loadCart]);

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
