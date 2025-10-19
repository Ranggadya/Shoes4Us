"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface WishlistItem {
  id: number;
  productId: string;
}

interface WishlistResponse {
  data?: {
    items?: WishlistItem[];
  };
}

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({
  productId,
  className = "",
}: WishlistButtonProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistId, setWishlistId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Cek status wishlist
  useEffect(() => {
    void checkWishlistStatus();
  }, [productId]);

  const checkWishlistStatus = async (): Promise<void> => {
    try {
      const res = await fetch("/api/wishlist");

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!res.ok) return;

      setIsAuthenticated(true);
      const data: WishlistResponse = await res.json();

      const items = data?.data?.items ?? []; // ✅ aman walau undefined
      const item = items.find((item) => item.productId === productId);

      if (item) {
        setIsWishlisted(true);
        setWishlistId(item.id);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  // ✅ Toggle add/remove wishlist
  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      if (isWishlisted && wishlistId) {
        // Remove from wishlist
        const res = await fetch(`/api/wishlist/${wishlistId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || "Gagal menghapus wishlist");
        }

        setIsWishlisted(false);
        setWishlistId(null);
        toast.success("Dihapus dari wishlist");
      } else {
        // Add to wishlist
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message || "Gagal menambahkan wishlist");
        }

        const wishlistItem = data?.data?.wishlist;
        setIsWishlisted(true);
        setWishlistId(wishlistItem?.id ?? null);
        toast.success("Ditambahkan ke wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-full transition-all duration-200
        ${
          isWishlisted
            ? "bg-red-50 text-red-500 hover:bg-red-100"
            : "bg-white text-gray-400 hover:text-red-500 hover:bg-red-50"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
        shadow-md hover:shadow-lg
        ${className}
      `}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          isWishlisted ? "fill-current" : ""
        }`}
      />
    </button>
  );
}
