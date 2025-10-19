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
  data: {
    items: WishlistItem[];
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

  useEffect(() => {
    void checkWishlistStatus(); // void untuk suppress warning async tanpa await
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

      const item = data.data.items.find(
        (item) => item.productId === productId
      );

      if (item) {
        setIsWishlisted(true);
        setWishlistId(item.id);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

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
          throw new Error(data.error?.message || "Failed to remove from wishlist");
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

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || "Failed to add to wishlist");
        }

        const data: { data: { wishlist: WishlistItem } } = await res.json();
        setIsWishlisted(true);
        setWishlistId(data.data.wishlist.id);
        toast.success("Ditambahkan ke wishlist");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error toggling wishlist:", error.message);
        toast.error(error.message || "Terjadi kesalahan");
      } else {
        toast.error("Terjadi kesalahan tak terduga");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        flex items-center justify-center 
        min-w-[44px] min-h-[44px] 
        p-2 rounded-full 
        transition-all duration-200
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
