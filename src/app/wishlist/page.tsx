"use client";

import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Trash2, PackageX } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";

interface WishlistItem {
  id: number;
  productId: number;
  createdAt: string;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
    category: string;
    stock: number;
    slug: string;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");

      if (res.status === 401) {
        toast.error("Silakan login terlebih dahulu");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch wishlist");
      }

      const data = await res.json();
      setWishlistItems(data.data.items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Gagal memuat wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wishlistId: number) => {
    setRemovingId(wishlistId);

    try {
      const res = await fetch(`/api/wishlist/${wishlistId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove item");
      }

      setWishlistItems((prev) => prev.filter((item) => item.id !== wishlistId));
      toast.success("Dihapus dari wishlist");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Gagal menghapus item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (item.product.stock <= 0) {
      toast.error("Produk sedang habis");
      return;
    }

    try {
      await addItem({ productId: item.productId, quantity: 1 });
      toast.success(`${item.product.name} ditambahkan ke keranjang`);
      
      // Optional: Remove from wishlist after adding to cart
      // await handleRemove(item.id);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Gagal menambahkan ke keranjang");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Wishlist Saya</h1>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded flex-1" />
                    <div className="h-10 bg-gray-200 rounded w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Wishlist Saya</h1>
          </div>

          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-red-50 rounded-full p-8 mb-6">
              <Heart className="w-24 h-24 text-red-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Wishlist Masih Kosong
            </h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              Tambahkan produk favorit Anda ke wishlist untuk memudahkan
              pembelian di kemudian hari
            </p>
            <Link
              href="/product"
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Jelajahi Produk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Wishlist Saya
            </h1>
          </div>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <Link href={`/product/${item.product.slug}`} className="block">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageX className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Stock badge */}
                  {item.product.stock <= 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      HABIS
                    </div>
                  )}
                  {item.product.stock > 0 && item.product.stock <= 5 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Sisa {item.product.stock}
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4 space-y-3">
                <Link href={`/product/${item.product.slug}`}>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {item.product.category}
                    </p>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                      {item.product.name}
                    </h3>
                  </div>
                </Link>

                <p className="text-2xl font-bold text-gray-900">
                  Rp {item.product.price.toLocaleString("id-ID")}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.product.stock <= 0}
                    className={`
                      flex-1 flex items-center justify-center gap-2
                      px-4 py-2.5 rounded-lg font-medium
                      transition-all duration-200
                      min-h-[44px]
                      ${
                        item.product.stock > 0
                          ? "bg-black text-white hover:bg-gray-800 active:scale-95"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {item.product.stock > 0 ? "Tambah" : "Habis"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    className="
                      flex items-center justify-center
                      min-w-[44px] min-h-[44px]
                      px-3 py-2.5 rounded-lg
                      bg-red-50 text-red-500
                      hover:bg-red-100 active:scale-95
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
