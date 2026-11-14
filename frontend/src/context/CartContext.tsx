import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { api } from "@/services/api";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  brand?: string | null;
  maxStock?: number;
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
  syncWarnings: string[];
  clearSyncWarnings: () => void;
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
  const [syncWarnings, setSyncWarnings] = useState<string[]>([]);
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const lastAuthKeyRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>(location.pathname);

  const clearSyncWarnings = useCallback(() => {
    setSyncWarnings([]);
  }, []);

  const syncGuestCartToBackend = useCallback(async () => {
    if (syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    const guest = loadGuestCart();
    if (guest.items.length === 0) return;

    const promise = (async () => {
      const failedItems: string[] = [];

      for (const item of guest.items) {
        try {
          await api.post("/cart", {
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size ?? undefined,
          });
        } catch (err) {
          const reason =
            err instanceof Error && err.message
              ? err.message
              : "Stok tidak mencukupi";
          const sizeLabel = item.size ? ` (${item.size})` : "";
          failedItems.push(`${item.product.name}${sizeLabel}: ${reason}`);
        }
      }

      try {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }

      if (failedItems.length > 0) {
        setSyncWarnings(failedItems);
        toast.error(
          `${failedItems.length} item keranjang tamu gagal disinkronkan karena stok/ketersediaan.`,
          { duration: 6000 }
        );
      }
    })().finally(() => {
      syncPromiseRef.current = null;
    });

    syncPromiseRef.current = promise;
    return promise;
  }, []);

  const loadCart = useCallback(
    async (silent = false) => {
      if (!user || !token) {
        setCart(loadGuestCart());
        setError(null);
        setSyncWarnings([]);
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

    const authKey = user && token ? `${user.id}:${token}` : "guest";
    const authChanged = lastAuthKeyRef.current !== authKey;
    const pathChanged = lastPathRef.current !== location.pathname;

    lastAuthKeyRef.current = authKey;
    lastPathRef.current = location.pathname;

    if (authChanged) {
      void loadCart(false);
      return;
    }

    const shouldRefreshCart =
      location.pathname === "/cart" ||
      location.pathname === "/payment" ||
      location.pathname === "/checkout";

    if (pathChanged && shouldRefreshCart) {
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
                brand?: string | null;
                stock?: number;
                sizes?: Array<{ size: string; stock: number }>;
              };
            };
          }>(`/products/${encodeURIComponent(productId)}`);
          const p = res.data?.product;
          if (!p) {
            throw new Error("Produk tidak ditemukan.");
          }
          const matchedSizeStock =
            size && Array.isArray(p.sizes)
              ? p.sizes.find((entry) => entry.size === size)?.stock
              : undefined;
          const resolvedMaxStock =
            typeof matchedSizeStock === "number" ? matchedSizeStock : p.stock;

          resolvedProduct = {
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl ?? null,
            brand: p.brand ?? null,
            maxStock:
              typeof resolvedMaxStock === "number"
                ? resolvedMaxStock
                : undefined,
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
        const existing = existingIndex >= 0 ? nextItems[existingIndex] : undefined;
        const mergedProduct: CartProduct = existing
          ? { ...existing.product, ...resolvedProduct }
          : resolvedProduct;
        const updatedQty = existing ? existing.quantity + quantity : quantity;

        if (
          typeof mergedProduct.maxStock === "number" &&
          updatedQty > mergedProduct.maxStock
        ) {
          throw new Error(
            mergedProduct.maxStock <= 0
              ? `Stok ${mergedProduct.name} sudah habis.`
              : `Stok tersisa ${mergedProduct.maxStock} pasang untuk ukuran ini.`
          );
        }

        if (existing) {
          nextItems[existingIndex] = {
            ...existing,
            product: mergedProduct,
            quantity: updatedQty,
            lineTotal: mergedProduct.price * updatedQty,
          };
        } else {
          nextItems.push({
            id: itemKey,
            product: mergedProduct,
            quantity,
            size: normalizedSize,
            lineTotal: mergedProduct.price * quantity,
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
        const target = currentGuest.items.find((item) => item.id === itemId);
        if (
          target &&
          typeof target.product.maxStock === "number" &&
          quantity > target.product.maxStock
        ) {
          throw new Error(
            target.product.maxStock <= 0
              ? `Stok ${target.product.name} sudah habis.`
              : `Stok tersisa ${target.product.maxStock} pasang untuk ukuran ini.`
          );
        }

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
      syncWarnings,
      clearSyncWarnings,
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
      syncWarnings,
      clearSyncWarnings,
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
