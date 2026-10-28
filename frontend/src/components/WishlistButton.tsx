import { useState } from "react";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({
  productId,
  className = "",
}: WishlistButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, toggleProduct } = useWishlist();
  const [loading, setLoading] = useState(false);
  const active = isWishlisted(productId);

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const result = await toggleProduct(productId);
      toast.success(
        result === "removed" ? "Dihapus dari wishlist" : "Ditambahkan ke wishlist"
      );
    } catch (error) {
      if (error instanceof Error) {
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
          active
            ? "bg-red-50 text-red-500 hover:bg-red-100"
            : "bg-white text-gray-400 hover:text-red-500 hover:bg-red-50"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
        shadow-md hover:shadow-lg
        ${className}
      `}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          active ? "fill-current" : ""
        }`}
      />
    </button>
  );
}
