/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency } from "@/lib/utils/format";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import toast from "react-hot-toast";
import {
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Package,
  Ruler,
  Check,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string;
  stock: number;
};

type ProductResponse = {
  success: boolean;
  data: { product: Product };
};

const AVAILABLE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];

// Mock product images for gallery (in real app, would come from backend)
const getProductImages = (mainImage: string | null) => {
  return [
    mainImage ?? "/sepatu1.jpeg",
    "/sepatu2.jpeg",
    "/sepatu3.jpeg",
    "/sepatu4.jpeg",
  ];
};

type TabType = "description" | "reviews" | "shipping" | "sizeguide";

export default function ProductDetailClient({
  productId,
}: {
  productId: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${productId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Produk tidak ditemukan");
        }

        const data = (await response.json()) as ProductResponse;
        setProduct(data.data.product);

        // Fetch review summary
        const reviewRes = await fetch(`/api/reviews?productId=${productId}`);
        const reviewData = await reviewRes.json();
        if (reviewData.success && reviewData.data.summary) {
          setAverageRating(reviewData.data.summary.averageRating);
          setTotalReviews(reviewData.data.summary.total);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail produk"
        );
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(productId)) {
      fetchProduct();
    } else {
      setError("ID produk tidak valid");
      setLoading(false);
    }
  }, [productId]);

  // Check wishlist status
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user) return;

      try {
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
         type WishlistItem = {
          id: string;
          productId: string | number;
        };

        const item = (data.data.items as WishlistItem[]).find(
          (item) => item.productId === productId
        );
          if (item) {
            setIsWishlisted(true);
            setWishlistId(item.id);
          }
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [productId, user]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }

    if (!size) {
      toast.error("Pilih ukuran terlebih dahulu");
      return;
    }

    try {
      await addItem({ productId: String(product.id), quantity, size });
      toast.success("Produk berhasil ditambahkan ke keranjang!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan produk"
      );
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }

    if (!size) {
      toast.error("Pilih ukuran terlebih dahulu");
      return;
    }

    try {
      await addItem({ productId: String(product.id), quantity, size });
      router.push("/cart");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan produk"
      );
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }

    try {
      if (isWishlisted && wishlistId) {
        // Remove from wishlist
        const res = await fetch(`/api/wishlist/${wishlistId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to remove from wishlist");
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
          throw new Error("Failed to add to wishlist");
        }

        const data = await res.json();
        setIsWishlisted(true);
        setWishlistId(data.data.wishlist.id);
        toast.success("Ditambahkan ke wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.name,
          text: `Check out ${product?.name} on Shoes4Us`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleReviewSuccess = () => {
    setReviewRefresh((prev) => prev + 1);
    setActiveTab("reviews");
    toast.success("Review berhasil disubmit!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-gray-600 mt-4">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {error ?? "Produk tidak ditemukan."}
          </p>
          <button
            onClick={() => router.push("/product")}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Kembali ke Produk
          </button>
        </div>
      </div>
    );
  }

  const productImages = getProductImages(product.imageUrl);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/product" className="text-gray-500 hover:text-gray-700">
              Products
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500 hover:text-gray-700">
              {product.category}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg aspect-square">
              <Image
                src={productImages[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
              {product.stock < 10 && product.stock > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Only {product.stock} left!
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-bold">
                    OUT OF STOCK
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                    selectedImageIndex === idx
                      ? "border-black"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 12vw, 25vw"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Name */}
            <div>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider rounded-full">
                {product.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mt-3">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={averageRating} size="md" />
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({totalReviews}{" "}
                  {totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
              {/* Could add discount price here */}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed text-lg border-t pt-6">
                {product.description}
              </p>
            )}

            {/* Size Selection */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Pilih Ukuran
                </h2>
                <button
                  onClick={() => setActiveTab("sizeguide")}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Ruler className="w-4 h-4" />
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_SIZES.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSize(option)}
                    disabled={product.stock === 0}
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                      size === option
                        ? "bg-black text-white border-black"
                        : "border-gray-300 text-gray-700 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                Jumlah
              </h2>
              <div className="inline-flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  className="px-4 py-3 hover:bg-gray-100 transition disabled:opacity-30"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={product.stock === 0}
                >
                  −
                </button>
                <span className="px-6 py-3 font-semibold border-x-2 border-gray-300">
                  {quantity}
                </span>
                <button
                  className="px-4 py-3 hover:bg-gray-100 transition disabled:opacity-30"
                  onClick={() =>
                    setQuantity((prev) => Math.min(product.stock, prev + 1))
                  }
                  disabled={product.stock === 0}
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <Package className="w-4 h-4 inline mr-1" />
                {product.stock > 0 ? (
                  <span>
                    {product.stock} items available in stock
                  </span>
                ) : (
                  <span className="text-red-500 font-semibold">
                    Out of stock
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
              >
                Buy Now
              </button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex gap-3">
              <button
                onClick={handleWishlist}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-semibold transition ${
                  isWishlisted
                    ? "bg-red-50 border-red-500 text-red-600"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-red-600" : ""}`}
                />
                {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 font-semibold transition"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Free Shipping</p>
                  <p className="text-sm text-gray-500">
                    On orders over Rp 500,000
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Authentic Guarantee</p>
                  <p className="text-sm text-gray-500">
                    100% original products
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Easy Returns</p>
                  <p className="text-sm text-gray-500">
                    7 days return policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("description")}
                className={`px-6 py-4 font-semibold transition border-b-2 whitespace-nowrap ${
                  activeTab === "description"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-4 font-semibold transition border-b-2 whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Reviews ({totalReviews})
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`px-6 py-4 font-semibold transition border-b-2 whitespace-nowrap ${
                  activeTab === "shipping"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Shipping & Returns
              </button>
              <button
                onClick={() => setActiveTab("sizeguide")}
                className={`px-6 py-4 font-semibold transition border-b-2 whitespace-nowrap ${
                  activeTab === "sizeguide"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Size Guide
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <h3 className="text-2xl font-bold mb-4">Product Details</h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  {product.description ||
                    "Premium quality shoes designed for comfort and style. Perfect for everyday wear and special occasions."}
                </p>

                <h4 className="text-xl font-bold mb-3">Features:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>High-quality materials for durability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Comfortable cushioned insole</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Breathable lining for all-day comfort</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Non-slip rubber outsole</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Available in multiple sizes</span>
                  </li>
                </ul>

                <h4 className="text-xl font-bold mb-3 mt-6">
                  Specifications:
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Category:</span>{" "}
                    {product.category}
                  </div>
                  <div>
                    <span className="font-semibold">Available Sizes:</span> 38
                    - 45
                  </div>
                  <div>
                    <span className="font-semibold">Material:</span> Premium
                    Leather
                  </div>
                  <div>
                    <span className="font-semibold">Country:</span> Indonesia
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>
                  <ReviewList
                    productId={productId}
                    refreshTrigger={reviewRefresh}
                  />
                </div>

                <div className="border-t pt-8">
                  <h3 className="text-2xl font-bold mb-6">Write a Review</h3>
                  <ReviewForm
                    productId={productId}
                    onSuccess={handleReviewSuccess}
                  />
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="prose max-w-none">
                <h3 className="text-2xl font-bold mb-4">Shipping Information</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Delivery Times:
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Jakarta & surrounding areas: 1-2 business days</li>
                      <li>• Java Island: 2-3 business days</li>
                      <li>• Other islands: 3-5 business days</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Shipping Costs:
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• FREE shipping for orders over Rp 500,000</li>
                      <li>• Standard shipping: Rp 25,000 - Rp 50,000</li>
                      <li>• Express shipping: Rp 50,000 - Rp 100,000</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Return Policy:
                    </h4>
                    <p className="text-gray-700 mb-2">
                      We offer a 7-day return policy for unworn items in
                      original condition with tags attached.
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Item must be in original packaging</li>
                      <li>• Tags must be attached</li>
                      <li>• Shoes must be unworn and clean</li>
                      <li>• Return shipping is customer's responsibility</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2">Exchange:</h4>
                    <p className="text-gray-700">
                      Size exchange is available within 7 days. Contact
                      customer service for assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sizeguide" && (
              <div className="prose max-w-none">
                <h3 className="text-2xl font-bold mb-4">Size Guide</h3>

                <div className="overflow-x-auto mb-8">
                  <table className="min-w-full border-collapse border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left font-semibold">
                          EU Size
                        </th>
                        <th className="border px-4 py-2 text-left font-semibold">
                          US Size
                        </th>
                        <th className="border px-4 py-2 text-left font-semibold">
                          UK Size
                        </th>
                        <th className="border px-4 py-2 text-left font-semibold">
                          CM
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-4 py-2">38</td>
                        <td className="border px-4 py-2">6</td>
                        <td className="border px-4 py-2">5.5</td>
                        <td className="border px-4 py-2">24.0</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">39</td>
                        <td className="border px-4 py-2">6.5</td>
                        <td className="border px-4 py-2">6</td>
                        <td className="border px-4 py-2">24.5</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">40</td>
                        <td className="border px-4 py-2">7</td>
                        <td className="border px-4 py-2">6.5</td>
                        <td className="border px-4 py-2">25.0</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">41</td>
                        <td className="border px-4 py-2">8</td>
                        <td className="border px-4 py-2">7</td>
                        <td className="border px-4 py-2">25.5</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">42</td>
                        <td className="border px-4 py-2">8.5</td>
                        <td className="border px-4 py-2">8</td>
                        <td className="border px-4 py-2">26.0</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">43</td>
                        <td className="border px-4 py-2">9.5</td>
                        <td className="border px-4 py-2">9</td>
                        <td className="border px-4 py-2">27.0</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">44</td>
                        <td className="border px-4 py-2">10</td>
                        <td className="border px-4 py-2">9.5</td>
                        <td className="border px-4 py-2">27.5</td>
                      </tr>
                      <tr>
                        <td className="border px-4 py-2">45</td>
                        <td className="border px-4 py-2">11</td>
                        <td className="border px-4 py-2">10.5</td>
                        <td className="border px-4 py-2">28.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold">How to Measure:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Place your foot on a flat surface against a wall</li>
                    <li>
                      Mark the longest part of your foot on a piece of paper
                    </li>
                    <li>Measure the distance from the wall to the mark</li>
                    <li>Compare your measurement with the size chart above</li>
                    <li>
                      If between sizes, we recommend ordering the larger size
                    </li>
                  </ol>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-blue-800 font-semibold">
                      💡 Pro Tip: Measure your feet in the afternoon as they
                      tend to expand slightly during the day.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
