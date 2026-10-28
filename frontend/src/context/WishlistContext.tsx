import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/services/api";

type WishlistContextValue = {
  isLoading: boolean;
  productIds: Set<string>;
  isWishlisted: (productId: string) => boolean;
  toggleProduct: (productId: string) => Promise<"added" | "removed">;
  refresh: () => Promise<void>;
};

type WishlistItem = {
  productId: string;
};

type WishlistResponse = {
  success: boolean;
  data: {
    items: WishlistItem[];
  };
};

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, token, isLoading: authLoading } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const productIdsRef = useRef<Set<string>>(productIds);
  productIdsRef.current = productIds;
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !token) {
      setProductIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.get<WishlistResponse>("/wishlist?fields=ids");
      setProductIds(
        new Set((data.data?.items ?? []).map((item) => item.productId))
      );
    } catch (e) {
      console.error("Failed to fetch wishlist ids", e);
      setProductIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  const isWishlisted = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds]
  );

  const toggleProduct = useCallback(
    async (productId: string) => {
      if (!user || !token) {
        throw new Error("Silakan login terlebih dahulu");
      }

      const wasWishlisted = productIdsRef.current.has(productId);
      setProductIds((current) => {
        const next = new Set(current);
        if (wasWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasWishlisted) {
          await api.delete(`/wishlist/${productId}`);
        } else {
          await api.post("/wishlist", { productId });
        }
        return wasWishlisted ? "removed" : "added";
      } catch (error) {
        setProductIds((current) => {
          const next = new Set(current);
          if (wasWishlisted) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw error;
      }
    },
    [token, user]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      isLoading,
      productIds,
      isWishlisted,
      toggleProduct,
      refresh,
    }),
    [isLoading, productIds, isWishlisted, toggleProduct, refresh]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
