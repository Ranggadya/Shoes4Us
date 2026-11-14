import { useId, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Package,
  DollarSign,
  FileText,
  Save,
  X,
  ArrowLeft,
  Tag,
  Box,
} from "lucide-react";
import { ImageUploadDropzone } from "@/components/admin/ImageUploadDropzone";
import AdminLayout from "@/components/admin/AdminLayout";
import SizeStockEditor from "@/components/admin/SizeStockEditor";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import {
  CATALOG_CATEGORIES,
  PRODUCT_AUDIENCES,
  PRODUCT_SEGMENTS,
  buildEditableSizeStocks,
  createDefaultSizeStocks,
} from "@/constants/product";
import type { ProductAudience, ProductSegment, ProductSizeStock } from "@/types";

export default function AdminAddProductPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState<ProductAudience>("UNISEX");
  const [segment, setSegment] = useState<ProductSegment>("SHOES");
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [sizeStocks, setSizeStocks] = useState<ProductSizeStock[]>(() =>
    createDefaultSizeStocks("SHOES")
  );

  // UI state
  const [currentStep, setCurrentStep] = useState(1);

  const nameId = useId();
  const brandId = useId();
  const audienceId = useId();
  const segmentId = useId();
  const priceId = useId();
  const totalStockId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setPrice(numericValue);
  };

  const formatPrice = (value: string) => {
    if (!value) return "";
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return "";
    return new Intl.NumberFormat("id-ID").format(parsed);
  };

  const handleSegmentChange = (nextSegment: ProductSegment) => {
    setSegment(nextSegment);
    setSizeStocks((prev) =>
      buildEditableSizeStocks(
        nextSegment,
        prev.filter((item) => item.stock > 0)
      )
    );
  };

  const totalSizeStock = sizeStocks.reduce(
    (sum, item) => sum + Math.max(0, Number(item.stock) || 0),
    0
  );
  const parsedPrice = price ? parseInt(price, 10) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !category) {
      toast.error("Nama dan kategori wajib diisi");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Harga produk harus lebih dari Rp 0");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("price", String(parsedPrice));
      formData.append("stock", String(totalSizeStock));
      formData.append("description", description || "");
      formData.append("brand", brand.trim());
      formData.append("audience", audience);
      formData.append("segment", segment);
      formData.append("isNewArrival", String(isNewArrival));
      formData.append("isExclusive", String(isExclusive));
      formData.append("isComingSoon", String(isComingSoon));
      formData.append("isSale", String(isSale));
      formData.append("sizes", JSON.stringify(sizeStocks));
      if (imageUrl.trim()) {
        formData.append("imageUrl", imageUrl.trim());
      }

      await api.post("/products", formData);

      toast.success("Produk berhasil ditambahkan!");
      navigate("/admin/product");
    } catch (err) {
      console.error("Gagal menambahkan produk:", err);
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan produk");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATALOG_CATEGORIES.find((c) => c.value === category);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/product"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-950 mb-3 min-h-[36px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Kembali ke Katalog Produk</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Tambah Produk Baru
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Isi form di bawah untuk menambahkan sepatu atau koleksi baru ke katalog.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-3 ${
                currentStep >= 1 ? "text-gray-950" : "text-gray-500"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 1
                    ? "bg-gray-950 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                1
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">Info Dasar</p>
                <p className="text-xs text-gray-600">Nama & kategori</p>
              </div>
            </div>

            <div className="flex-1 h-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentStep >= 2 ? "bg-gray-950 w-full" : "w-0"
                }`}
              />
            </div>

            <div
              className={`flex items-center gap-3 ${
                currentStep >= 2 ? "text-gray-950" : "text-gray-500"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 2
                    ? "bg-gray-950 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                2
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">Harga & Stok</p>
                <p className="text-xs text-gray-600">Pricing info</p>
              </div>
            </div>

            <div className="flex-1 h-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentStep >= 3 ? "bg-gray-950 w-full" : "w-0"
                }`}
              />
            </div>

            <div
              className={`flex items-center gap-3 ${
                currentStep >= 3 ? "text-gray-950" : "text-gray-500"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 3
                    ? "bg-gray-950 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                3
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">Detail</p>
                <p className="text-xs text-gray-600">Gambar & deskripsi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Step 1: Basic Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Package className="w-6 h-6 text-gray-950" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Informasi Dasar
                </h2>
                <p className="text-sm text-gray-600">Nama produk dan kategori</p>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor={nameId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nama Produk <span className="text-rose-700">*</span>
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  id={nameId}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (currentStep < 1) setCurrentStep(1);
                  }}
                  onFocus={() => setCurrentStep(1)}
                  placeholder="Contoh: Nike Air Max 270"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Nama yang jelas dan menarik akan membantu pelanggan
              </p>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-3">
                Kategori Produk <span className="text-rose-700">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATALOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    aria-pressed={category === cat.value}
                    onClick={() => {
                      setCategory(cat.value);
                      if (currentStep < 2) setCurrentStep(2);
                    }}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      category === cat.value
                        ? "border-gray-950 bg-gray-50"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 font-bold text-sm text-gray-900 shrink-0"
                      >
                        {cat.icon}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-950">{cat.label}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {cat.description}
                        </p>
                      </div>
                      {category === cat.value && (
                        <div
                          aria-hidden="true"
                          className="w-5 h-5 bg-gray-950 rounded-full flex items-center justify-center shrink-0"
                        >
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                <Box className="w-6 h-6 text-gray-950" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-950">
                  Klasifikasi Katalog
                </h2>
                <p className="text-sm text-gray-600">
                  Dipakai oleh filter navbar dan mega menu
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor={brandId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Brand
                </label>
                <input
                  id={brandId}
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Nike, Adidas, New Balance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor={audienceId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Target
                </label>
                <select
                  id={audienceId}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as ProductAudience)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100"
                  disabled={loading}
                >
                  {PRODUCT_AUDIENCES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={segmentId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Segment
                </label>
                <select
                  id={segmentId}
                  value={segment}
                  onChange={(e) =>
                    handleSegmentChange(e.target.value as ProductSegment)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100"
                  disabled={loading}
                >
                  {PRODUCT_SEGMENTS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              {[
                { label: "New Arrival", checked: isNewArrival, onChange: setIsNewArrival },
                { label: "Eksklusif", checked: isExclusive, onChange: setIsExclusive },
                { label: "Coming Soon", checked: isComingSoon, onChange: setIsComingSoon },
                { label: "Sale", checked: isSale, onChange: setIsSale },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 min-h-[44px]"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300 accent-black"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {selectedCategory && (
              <p className="mt-4 text-xs text-gray-600">
                Kategori aktif: {selectedCategory.label}
              </p>
            )}
          </div>

          {/* Step 2: Price & Stock */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-gray-950" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Harga & Stok</h2>
                <p className="text-sm text-gray-600">
                  Tentukan harga dan ketersediaan
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor={priceId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Harga (Rp) <span className="text-rose-700">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                    Rp
                  </span>
                  <input
                    id={priceId}
                    type="text"
                    inputMode="numeric"
                    value={formatPrice(price)}
                    onChange={(e) => {
                      handlePriceChange(e.target.value);
                      if (currentStep < 2) setCurrentStep(2);
                    }}
                    onFocus={() => setCurrentStep(2)}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-semibold tabular-nums"
                    disabled={loading}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {parsedPrice > 0
                    ? `= Rp ${formatPrice(price)} Rupiah`
                    : "Masukkan harga lebih dari Rp 0"}
                </p>
              </div>

              <div>
                <label
                  htmlFor={totalStockId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Total Stok Otomatis
                </label>
                <input
                  id={totalStockId}
                  type="number"
                  value={totalSizeStock}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-700 rounded-xl text-center text-lg font-semibold tabular-nums cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Total dihitung otomatis dari stok per ukuran
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="block text-sm font-medium text-gray-700 mb-3">
                Stok Per Ukuran
              </p>
              <SizeStockEditor
                segment={segment}
                sizeStocks={sizeStocks}
                onChange={setSizeStocks}
                disabled={loading}
              />
            </div>

            {parsedPrice > 0 && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                      Preview Harga
                    </p>
                    <p className="text-2xl font-bold text-gray-950 mt-1 tabular-nums">
                      Rp {formatPrice(price)}
                    </p>
                  </div>
                  {totalSizeStock > 0 && (
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-gray-600 font-semibold">
                        Stok tersedia
                      </p>
                      <p className="text-xl font-bold text-gray-950 tabular-nums">
                        {totalSizeStock} unit
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Details */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                <FileText className="w-6 h-6 text-gray-950" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Detail Produk</h2>
                <p className="text-sm text-gray-600">
                  Gambar dan deskripsi (opsional)
                </p>
              </div>
            </div>

            <div className="mb-6">
              <ImageUploadDropzone
                value={imageUrl}
                onChange={(url) => {
                  setImageUrl(url);
                  if (currentStep < 3) setCurrentStep(3);
                }}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor={descriptionId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Deskripsi Produk
              </label>
              <textarea
                id={descriptionId}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (currentStep < 3) setCurrentStep(3);
                }}
                onFocus={() => setCurrentStep(3)}
                placeholder="Deskripsi detail produk, fitur, material, dll..."
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 resize-none"
                disabled={loading}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Tips: Jelaskan keunggulan dan detail produk
                </p>
                <p
                  className={`text-xs tabular-nums ${
                    description.length > 450
                      ? "text-rose-700 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {description.length}/500 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/admin/product"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] border border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition font-semibold text-sm"
              >
                <X className="w-5 h-5" aria-hidden="true" />
                <span>Batal</span>
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim() || !category || parsedPrice <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-gray-950 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm"
              >
                {loading ? (
                  <>
                    <div
                      aria-hidden="true"
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" aria-hidden="true" />
                    <span>Simpan Produk</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Status Form:</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div
                  className={`flex items-center gap-1 ${
                    name.trim() ? "text-emerald-700 font-medium" : "text-gray-500"
                  }`}
                >
                  {name.trim() ? "✓" : "○"} Nama produk
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    category ? "text-emerald-700 font-medium" : "text-gray-500"
                  }`}
                >
                  {category ? "✓" : "○"} Kategori
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    parsedPrice > 0
                      ? "text-emerald-700 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {parsedPrice > 0 ? "✓" : "○"} Harga (&gt; 0)
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    totalSizeStock > 0
                      ? "text-emerald-700 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {totalSizeStock > 0 ? "✓" : "○"} Stok
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    imageUrl.trim()
                      ? "text-emerald-700 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {imageUrl.trim() ? "✓" : "○"} Gambar
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    description.trim()
                      ? "text-emerald-700 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {description.trim() ? "✓" : "○"} Deskripsi
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
