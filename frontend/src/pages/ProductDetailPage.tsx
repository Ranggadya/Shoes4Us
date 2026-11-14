import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import {
  formatCurrency,
  getCategoryName,
  resolveProductBrand,
} from "@/utils/format";
import { EU_TO_US_MAP, formatShoeSizeLabel } from "@/utils/size-converter";
import { api } from "@/services/api";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import RelatedProducts from "@/components/RelatedProducts";
import SEO from "@/components/SEO";
import SizeGuideModal from "@/components/SizeGuideModal";
import toast from "react-hot-toast";
import {
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Store,
  Check,
  X,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  brand?: string | null;
  audience?: string | null;
  isExclusive?: boolean;
  isNewArrival?: boolean;
  isSale?: boolean;
  category: { id: string; name: string; slug: string } | string;
  stock: number;
  sizes?: Array<{ id: string; size: string; stock: number }>;
};

type ProductResponse = {
  success: boolean;
  data: { product: Product };
};

const AVAILABLE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];

function resolveAudienceBreadcrumb(audience?: string | null): {
  label: string;
  categoryLabel: string;
  href: string;
} {
  const upper = (audience || "").toUpperCase();
  if (upper === "MEN") {
    return {
      label: "PRIA",
      categoryLabel: "SEPATU PRIA",
      href: "/product?audience=MEN",
    };
  }
  if (upper === "WOMEN") {
    return {
      label: "WANITA",
      categoryLabel: "SEPATU WANITA",
      href: "/product?audience=WOMEN",
    };
  }
  if (upper === "KIDS") {
    return {
      label: "ANAK",
      categoryLabel: "SEPATU ANAK",
      href: "/product?audience=KIDS",
    };
  }
  return {
    label: "UNISEX",
    categoryLabel: "SEPATU UNISEX",
    href: "/product?audience=UNISEX",
  };
}

function generateSKU(product: Product): string {
  const brandCode = resolveProductBrand(
    product.name,
    product.brand,
    product.category,
    "SHOES4US"
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  const modelMatch = product.name.toUpperCase().match(/[A-Z0-9]{3,6}/g);
  const modelCode =
    modelMatch && modelMatch.length > 1
      ? modelMatch[1]
      : (modelMatch?.[0] || "SHOE").slice(0, 5);
  const idSuffix = product.id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
  return `0888-${brandCode}${modelCode}${idSuffix}`;
}

type GalleryView = {
  label: string;
  src: string;
  transformClass: string;
};

const buildGalleryViews = (mainImage: string | null): GalleryView[] => {
  const baseSrc =
    mainImage && (mainImage.startsWith("http") || mainImage.startsWith("/"))
      ? mainImage
      : "/sepatu1.jpeg";

  return [
    { label: "Tampak Samping Kanan", src: baseSrc, transformClass: "" },
    { label: "Tampak Samping Kiri", src: baseSrc, transformClass: "-scale-x-100" },
    { label: "Detail 3/4 Depan", src: baseSrc, transformClass: "scale-110" },
    { label: "Detail Upper & Logo", src: baseSrc, transformClass: "scale-125 object-center" },
    { label: "Detail Tumit Belakang", src: baseSrc, transformClass: "scale-110 -rotate-3" },
    { label: "Detail Outsole", src: baseSrc, transformClass: "scale-105 rotate-2" },
  ];
};

type TabType = "description" | "reviews" | "shipping" | "sizeguide";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id || "";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted: checkIsWishlisted, toggleProduct: toggleWishlist } =
    useWishlist();
  const isWishlisted = checkIsWishlisted(productId);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [submittingAction, setSubmittingAction] = useState<
    "cart" | "buy" | null
  >(null);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showSizeCalculator, setShowSizeCalculator] = useState(false);

  useEffect(() => {
    setSize("");
    setQuantity(1);
    setSelectedImageIndex(0);
    setActiveTab("description");
    setAverageRating(0);
    setTotalReviews(0);

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productData, reviewData] = await Promise.all([
          api.get<ProductResponse>(`/products/${productId}`),
          api
            .get<{
              success?: boolean;
              data?: { summary?: { averageRating: number; total: number } };
            }>(
              `/reviews?productId=${encodeURIComponent(
                productId
              )}&summaryOnly=true`
            )
            .catch(() => null),
        ]);

        if (!productData?.data?.product) {
          throw new Error("Produk tidak ditemukan");
        }

        const fetched = productData.data.product;
        setProduct(fetched);

        // Preselect first available size if present
        const sizesList =
          fetched.sizes && fetched.sizes.length > 0
            ? fetched.sizes
            : AVAILABLE_SIZES.map((s) => ({
                id: s,
                size: s,
                stock: fetched.stock,
              }));
        const firstInStock = sizesList.find((s) => s.stock > 0);
        if (firstInStock) {
          setSize(firstInStock.size);
        }

        if (reviewData?.data?.summary) {
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

    if (productId) {
      void fetchProduct();
    } else {
      setError("ID produk tidak valid");
      setLoading(false);
    }
  }, [productId]);

  const submitCartSelection = async (
    action: "cart" | "buy"
  ): Promise<boolean> => {
    if (!product || submittingAction) return false;

    if (!size) {
      toast.error("Pilih ukuran terlebih dahulu");
      return false;
    }

    const currentSizeStock =
      product.sizes?.find((item) => item.size === size)?.stock ?? product.stock;
    if (currentSizeStock < quantity) {
      toast.error("Stok ukuran yang dipilih tidak mencukupi");
      return false;
    }

    setSubmittingAction(action);
    try {
      await addItem({
        productId: String(product.id),
        quantity,
        size,
        productSnapshot: {
          id: String(product.id),
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          brand: product.brand ?? null,
          maxStock: currentSizeStock,
        },
      });
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menambahkan produk"
      );
      return false;
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleAddToCart = async () => {
    const added = await submitCartSelection("cart");
    if (added) {
      toast.success("Produk berhasil ditambahkan ke keranjang!");
    }
  };

  const handleBuyNow = async () => {
    const added = await submitCartSelection("buy");
    if (added) {
      navigate("/cart");
    }
  };

  const handleWishlist = async () => {
    if (togglingWishlist) return;
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      navigate("/login");
      return;
    }

    setTogglingWishlist(true);
    try {
      const result = await toggleWishlist(productId);
      if (result === "added") {
        toast.success("Ditambahkan ke wishlist");
      } else {
        toast.success("Dihapus dari wishlist");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setTogglingWishlist(false);
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
      void navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan produk berhasil disalin!");
    }
  };

  const handleReviewSuccess = () => {
    setReviewRefresh((prev) => prev + 1);
    setActiveTab("reviews");
    void api
      .get<{
        success?: boolean;
        data?: { summary?: { averageRating: number; total: number } };
      }>(`/reviews?productId=${encodeURIComponent(productId)}&summaryOnly=true`)
      .then((reviewData) => {
        if (reviewData?.data?.summary) {
          setAverageRating(reviewData.data.summary.averageRating);
          setTotalReviews(reviewData.data.summary.total);
        }
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-gray-600 mt-4">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {error ?? "Produk tidak ditemukan."}
          </p>
          <button
            onClick={() => navigate("/product")}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Kembali ke Produk
          </button>
        </div>
      </div>
    );
  }

  const galleryViews = buildGalleryViews(product.imageUrl);
  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : AVAILABLE_SIZES.map((option) => ({
          id: option,
          size: option,
          stock: product.stock,
        }));
  const selectedSizeStock =
    availableSizes.find((option) => option.size === size)?.stock ??
    product.stock;
  const hasStock = product.stock > 0;
  const maxSelectableQuantity = Math.max(1, Math.min(10, selectedSizeStock));
  const brandName = resolveProductBrand(
    product.name,
    product.brand,
    product.category,
    "SHOES4US"
  ).toUpperCase();
  const audienceBreadcrumb = resolveAudienceBreadcrumb(product.audience);
  const skuCode = generateSKU(product);
  const originalPrice = Math.round(product.price / 0.8);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev > 0 ? prev - 1 : galleryViews.length - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev < galleryViews.length - 1 ? prev + 1 : 0
    );
  };

  const openSizeGuide = () => {
    setShowSizeCalculator(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SEO
        title={`${product.name} - ${brandName}`}
        description={
          product.description ||
          `Beli ${product.name} (${brandName}) orisinal seharga ${formatCurrency(product.price)} di Shoes4Us.`
        }
        image={product.imageUrl}
        type="product"
        priceAmount={product.price}
      />
      {/* Uppercase Slash Breadcrumb matching reference */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs tracking-wide uppercase text-gray-600">
            <Link to="/" className="hover:text-black transition">
              HOME
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              to={audienceBreadcrumb.href}
              className="hover:text-black transition"
            >
              {audienceBreadcrumb.label}
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              to={audienceBreadcrumb.href}
              className="hover:text-black transition"
            >
              {audienceBreadcrumb.categoryLabel}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate max-w-md sm:max-w-xl">
              {product.name.toUpperCase()}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Retail Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Left Column (7 cols): Vertical Thumbnails + Main White Studio Canvas */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 items-start">
            {/* Vertical Thumbnail Strip */}
            <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-20 flex-shrink-0">
              <button
                type="button"
                onClick={handlePrevImage}
                className="hidden sm:flex items-center justify-center w-full py-1 text-gray-400 hover:text-gray-800 transition"
                aria-label="Gambar sebelumnya"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible w-full">
                {galleryViews.map((view, idx) => (
                  <button
                    key={view.label}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 bg-white border transition flex items-center justify-center p-2 flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? "border-gray-900 ring-1 ring-gray-900"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    title={view.label}
                  >
                    <img
                      src={view.src}
                      alt={`${product.name} - ${view.label}`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.endsWith("/sepatu1.jpeg")) {
                          target.src = "/sepatu1.jpeg";
                        }
                      }}
                      className={`w-full h-full object-contain ${view.transformClass}`}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextImage}
                className="hidden sm:flex items-center justify-center w-full py-1 text-gray-400 hover:text-gray-800 transition"
                aria-label="Gambar berikutnya"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Main Studio Image Canvas with EXCLUSIVE / BEST SELLER Badges */}
            <div className="relative flex-1 w-full bg-white border border-gray-100 aspect-square flex items-center justify-center p-8 sm:p-14 overflow-hidden">
              {/* Top-Left Badge: EXCLUSIVE */}
              <div className="absolute top-3 left-0 z-10">
                <span className="inline-block bg-[#3c3c3b] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-2 rounded-br-lg shadow-sm">
                  {product.isExclusive === false && product.isNewArrival
                    ? "NEW ARRIVAL"
                    : "EXCLUSIVE"}
                </span>
              </div>

              {/* Top-Right Badge: BEST SELLER / SALE */}
              <div className="absolute top-0 right-0 z-10">
                <span className="inline-block bg-[#3c3c3b] text-white text-sm sm:text-base font-extrabold uppercase tracking-wider px-6 py-2.5 rounded-bl-xl shadow-sm">
                  {product.isSale ? "SPECIAL OFFER" : "BEST SELLER"}
                </span>
              </div>

              <img
                src={galleryViews[selectedImageIndex]?.src}
                alt={product.name}
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith("/sepatu1.jpeg")) {
                    target.src = "/sepatu1.jpeg";
                  }
                }}
                className={`w-full h-full object-contain transition-all duration-300 ${
                  galleryViews[selectedImageIndex]?.transformClass || ""
                }`}
              />

              {!hasStock && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                  <span className="bg-red-600 text-white px-6 py-3 text-base font-bold uppercase tracking-wider">
                    STOK HABIS
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Product Details & Purchase Controls */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Brand Header in Red Uppercase */}
            <Link
              to={`/product?brand=${encodeURIComponent(brandName)}`}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#d91e2a] hover:underline w-fit"
            >
              {brandName}
            </Link>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-[28px] font-normal text-gray-900 leading-snug mt-1">
              {product.name}
            </h1>

            {/* SKU Line */}
            <p className="text-xs text-gray-400 mt-1.5 tracking-wide">
              SKU#: {skuCode}
            </p>

            {/* Rating summary if available */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={averageRating} size="sm" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("reviews");
                    document
                      .getElementById("product-detail-tabs")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  {averageRating.toFixed(1)} ({totalReviews} ulasan)
                </button>
              </div>
            )}

            {/* Price Block */}
            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span
                className={`text-2xl sm:text-[26px] font-bold tabular-nums ${
                  product.isSale ? "text-[#d91e2a]" : "text-gray-900"
                }`}
              >
                {formatCurrency(product.price)}
              </span>
              {product.isSale && (
                <>
                  <span className="text-sm text-gray-400 line-through tabular-nums">
                    {formatCurrency(originalPrice)}
                  </span>
                  <span className="bg-red-50 text-[#d91e2a] text-xs font-bold px-2 py-0.5">
                    20% OFF
                  </span>
                </>
              )}
            </div>

            {/* Size Selector Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900">Size</span>
              </div>
              <div className="flex justify-end mb-2.5">
                <button
                  type="button"
                  onClick={openSizeGuide}
                  className="text-xs font-bold text-[#005691] underline hover:text-blue-900 transition"
                >
                  Panduan Ukuran & Kalkulator CM
                </button>
              </div>
              <SizeGuideModal
                isOpen={showSizeCalculator}
                onClose={() => setShowSizeCalculator(false)}
                onSelectSize={(recommendedEu) => {
                  const found = availableSizes.find(
                    (s) => s.size === recommendedEu && s.stock > 0
                  );
                  if (found) {
                    setSize(recommendedEu);
                    toast.success(`Ukuran EU ${recommendedEu} dipilih!`);
                  } else {
                    toast.error(
                      `Ukuran EU ${recommendedEu} saat ini belum tersedia untuk produk ini.`
                    );
                  }
                }}
              />

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {availableSizes.map((option) => {
                  const isSelected = size === option.size;
                  const isOut = option.stock === 0;
                  const usLabel =
                    EU_TO_US_MAP[option.size.trim()] || `EU ${option.size}`;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSize(option.size);
                        setQuantity(1);
                      }}
                      disabled={isOut}
                      title={formatShoeSizeLabel(option.size)}
                      className={`h-11 px-2 border text-xs font-bold transition flex flex-col items-center justify-center ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : isOut
                          ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                          : "border-gray-300 bg-white text-gray-900 hover:border-gray-900"
                      }`}
                    >
                      <span>{usLabel}</span>
                    </button>
                  );
                })}
              </div>
              {size && (
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Ukuran dipilih:{" "}
                  <strong className="text-gray-800">
                    {formatShoeSizeLabel(size)}
                  </strong>{" "}
                  • Stok tersedia: {selectedSizeStock} pasang
                </p>
              )}
            </div>

            {/* KUANTITAS Dropdown */}
            <div className="mt-6">
              <label
                htmlFor="product-quantity-select"
                className="block text-xs font-medium uppercase tracking-wider text-gray-800 mb-2"
              >
                KUANTITAS
              </label>
              <div className="relative w-32">
                <select
                  id="product-quantity-select"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={!hasStock || selectedSizeStock === 0}
                  className="w-full h-11 px-3.5 pr-8 border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:border-gray-900 disabled:bg-gray-100"
                >
                  {Array.from(
                    { length: maxSelectableQuantity },
                    (_, idx) => idx + 1
                  ).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Full-Width Stacked CTA Buttons matching reference */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={
                  !hasStock ||
                  (size ? selectedSizeStock === 0 : false) ||
                  submittingAction !== null
                }
                className="w-full h-12 bg-[#d91e2a] hover:bg-[#b81722] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAction === "buy" ? "MEMPROSES..." : "BELI SEKARANG"}
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  !hasStock ||
                  (size ? selectedSizeStock === 0 : false) ||
                  submittingAction !== null
                }
                className="w-full h-12 bg-[#ed8b93] hover:bg-[#e4717b] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAction === "cart"
                  ? "MENAMBAHKAN..."
                  : "TAMBAH KE KERANJANG"}
              </button>
            </div>

            {/* Store Availability Check & Secondary Wishlist/Share Row */}
            <div className="mt-4 pt-3 flex items-center justify-between gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setShowStoreModal(true)}
                className="inline-flex items-center gap-2 text-xs text-[#b5383f] hover:underline font-medium"
              >
                <Store className="w-4 h-4" />
                <span>Periksa ketersediaan di toko</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleWishlist}
                  disabled={togglingWishlist}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${
                    isWishlisted
                      ? "text-[#d91e2a]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? "fill-[#d91e2a] text-[#d91e2a]" : ""
                    }`}
                  />
                  <span>{isWishlisted ? "Tersimpan" : "Wishlist"}</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Store Availability Modal */}
        {showStoreModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 border border-gray-200 shadow-xl relative">
              <button
                type="button"
                onClick={() => setShowStoreModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Ketersediaan di Toko
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {product.name} {size ? `(${formatShoeSizeLabel(size)})` : ""}
              </p>
              <div className="space-y-3 text-sm">
                {[
                  {
                    store: "Shoes4Us Grand Indonesia, Jakarta",
                    status: hasStock ? "Tersedia" : "Habis",
                  },
                  {
                    store: "Shoes4Us Senayan City, Jakarta",
                    status: hasStock ? "Tersedia" : "Habis",
                  },
                  {
                    store: "Shoes4Us Paris Van Java, Bandung",
                    status: hasStock ? "Stok Terbatas" : "Habis",
                  },
                  {
                    store: "Shoes4Us Tunjungan Plaza, Surabaya",
                    status: hasStock ? "Tersedia" : "Habis",
                  },
                ].map((item) => (
                  <div
                    key={item.store}
                    className="flex items-center justify-between p-3 border border-gray-200"
                  >
                    <span className="font-medium text-gray-800">
                      {item.store}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 ${
                        item.status === "Tersedia"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.status === "Stok Terbatas"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        <div
          id="product-detail-tabs"
          className="bg-white border border-gray-200 overflow-hidden"
        >
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("description")}
                className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                  activeTab === "description"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Deskripsi Produk
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Ulasan ({totalReviews})
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                  activeTab === "shipping"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pengiriman & Pengembalian
              </button>
              <button
                onClick={() => setActiveTab("sizeguide")}
                className={`px-6 py-4 text-sm font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                  activeTab === "sizeguide"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Panduan Ukuran
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4">Detail Produk</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {product.description ||
                    "Sepatu berkualitas tinggi yang dirancang untuk kenyamanan dan gaya maksimal sepanjang hari."}
                </p>

                <h4 className="text-base font-bold mb-3">Keunggulan Utama:</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Material upper berkualitas tinggi yang tahan lama</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Bantalan midsole empuk untuk kenyamanan sepanjang hari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sirkulasi udara optimal (breathable mesh lining)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Outsole karet anti-slip dengan daya cengkeram kuat</span>
                  </li>
                </ul>

                <div className="mt-8 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Brand</span>
                    <span className="font-semibold">{brandName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Kategori</span>
                    <span className="font-semibold">
                      {getCategoryName(product.category)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">SKU</span>
                    <span className="font-semibold">{skuCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Jaminan</span>
                    <span className="font-semibold">100% Original</span>
                  </div>
                </div>

                {/* Horizontal Features Section */}
                <div className="mt-10 pt-8 border-t grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200">
                    <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-gray-800" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        Pengiriman Cepat
                      </p>
                      <p className="text-xs text-gray-500">
                        Tersedia JNE, SiCepat & J&T ke seluruh Indonesia
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200">
                    <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-gray-800" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        Jaminan 100% Original
                      </p>
                      <p className="text-xs text-gray-500">
                        Produk resmi bergaransi keaslian
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200">
                    <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-5 h-5 text-gray-800" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        7 Hari Penukaran Ukuran
                      </p>
                      <p className="text-xs text-gray-500">
                        Bebas tukar ukuran jika kurang pas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-6">Ulasan Pelanggan</h3>
                  <ReviewList
                    productId={productId}
                    refreshTrigger={reviewRefresh}
                  />
                </div>

                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold mb-6">Tulis Ulasan</h3>
                  <ReviewForm
                    productId={productId}
                    onSuccess={handleReviewSuccess}
                  />
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="prose max-w-none text-sm text-gray-700 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Informasi Pengiriman & Pengembalian
                </h3>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Estimasi Waktu Pengiriman:
                  </h4>
                  <ul className="space-y-1">
                    <li>• Jabodetabek & Bandung: 1 - 2 hari kerja</li>
                    <li>• Pulau Jawa: 2 - 3 hari kerja</li>
                    <li>• Luar Pulau Jawa: 3 - 5 hari kerja</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Kebijakan Penukaran & Pengembalian:
                  </h4>
                  <ul className="space-y-1">
                    <li>• Pengajuan maksimal 7 hari setelah pesanan diterima</li>
                    <li>• Sepatu belum pernah digunakan di luar ruangan</li>
                    <li>• Kotak sepatu dan label tag asli masih lengkap</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "sizeguide" && (
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4">
                  Panduan Ukuran Sepatu (US / EU / CM)
                </h3>

                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full border-collapse border border-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold">
                          US Size
                        </th>
                        <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold">
                          EU Size
                        </th>
                        <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold">
                          UK Size
                        </th>
                        <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold">
                          Panjang Kaki (CM)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 7</td>
                        <td className="border border-gray-200 px-4 py-2">38</td>
                        <td className="border border-gray-200 px-4 py-2">5.5</td>
                        <td className="border border-gray-200 px-4 py-2">24.0</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 7.5</td>
                        <td className="border border-gray-200 px-4 py-2">39</td>
                        <td className="border border-gray-200 px-4 py-2">6.5</td>
                        <td className="border border-gray-200 px-4 py-2">24.5</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 8</td>
                        <td className="border border-gray-200 px-4 py-2">40</td>
                        <td className="border border-gray-200 px-4 py-2">7.0</td>
                        <td className="border border-gray-200 px-4 py-2">25.0</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 8.5</td>
                        <td className="border border-gray-200 px-4 py-2">41</td>
                        <td className="border border-gray-200 px-4 py-2">7.5</td>
                        <td className="border border-gray-200 px-4 py-2">25.5</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 9.5</td>
                        <td className="border border-gray-200 px-4 py-2">42</td>
                        <td className="border border-gray-200 px-4 py-2">8.5</td>
                        <td className="border border-gray-200 px-4 py-2">26.5</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 10</td>
                        <td className="border border-gray-200 px-4 py-2">43</td>
                        <td className="border border-gray-200 px-4 py-2">9.0</td>
                        <td className="border border-gray-200 px-4 py-2">27.0</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 10.5</td>
                        <td className="border border-gray-200 px-4 py-2">44</td>
                        <td className="border border-gray-200 px-4 py-2">9.5</td>
                        <td className="border border-gray-200 px-4 py-2">27.5</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-2">US 11</td>
                        <td className="border border-gray-200 px-4 py-2">45</td>
                        <td className="border border-gray-200 px-4 py-2">10.5</td>
                        <td className="border border-gray-200 px-4 py-2">28.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Recommendation */}
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  );
}
