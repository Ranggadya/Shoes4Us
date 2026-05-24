"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";

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
  const [isLoading, setIsLoading] = useState(false);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const refresh = useCallback(async () => {
    if (!user || !token) {
      setProductIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        headers,
        cache: "no-store",
      });

      if (!res.ok) {
        setProductIds(new Set());
        return;
      }

      const data = (await res.json()) as WishlistResponse;
      setProductIds(new Set(data.data.items.map((item) => item.productId)));
    } finally {
      setIsLoading(false);
    }
  }, [headers, token, user]);

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

      const wasWishlisted = productIds.has(productId);
      setProductIds((current) => {
        const next = new Set(current);
        if (wasWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        const res = await fetch(
          wasWishlisted ? `/api/wishlist/${productId}` : "/api/wishlist",
          {
            method: wasWishlisted ? "DELETE" : "POST",
            headers,
            cache: "no-store",
            body: wasWishlisted ? undefined : JSON.stringify({ productId }),
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.message ?? body?.error?.message ?? "Gagal mengubah wishlist"
          );
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
    [headers, productIds, token, user]
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
