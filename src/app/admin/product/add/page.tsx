"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Package,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Save,
  X,
  Plus,
  Minus,
  ArrowLeft,
  Tag,
  Box,
} from "lucide-react";

const CATALOG_CATEGORIES = [
  { value: "Sneakers", label: "Sneakers", icon: "S", description: "Sneakers dan lifestyle" },
  { value: "Sport", label: "Sport", icon: "P", description: "Sepatu olahraga & basket" },
  { value: "Running", label: "Running", icon: "R", description: "Sepatu lari dan training" },
  { value: "Casual", label: "Casual", icon: "C", description: "Sepatu kasual sehari-hari" },
  { value: "Formal", label: "Formal", icon: "F", description: "Sepatu formal & kerja" },
];

const PRODUCT_AUDIENCES = [
  { value: "UNISEX", label: "Unisex" },
  { value: "MEN", label: "Pria" },
  { value: "WOMEN", label: "Wanita" },
  { value: "KIDS", label: "Anak-Anak" },
];

const PRODUCT_SEGMENTS = [
  { value: "SHOES", label: "Sepatu" },
  { value: "APPAREL", label: "Pakaian" },
  { value: "ACCESSORIES", label: "Aksesoris" },
];

const DEFAULT_SIZE_STOCKS = ["38", "39", "40", "41", "42", "43", "44", "45"].map((size) => ({
  size,
  stock: 0,
}));

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("UNISEX");
  const [segment, setSegment] = useState("SHOES");
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [sizeStocks, setSizeStocks] = useState(DEFAULT_SIZE_STOCKS);

  // UI state
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handlePriceChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, "");
    setPrice(numericValue);
  };

  const formatPrice = (value: string) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(value));
  };

  const handleStockChange = (delta: number) => {
    const currentStock = parseInt(stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    setStock(newStock.toString());
  };

  const handleSizeStockChange = (size: string, value: string) => {
    const nextStock = Math.max(0, Number(value) || 0);
    setSizeStocks((current) =>
      current.map((item) =>
        item.size === size ? { ...item, stock: nextStock } : item
      )
    );
    setStock(
      sizeStocks
        .map((item) => (item.size === size ? nextStock : item.stock))
        .reduce((sum, value) => sum + value, 0)
        .toString()
    );
  };

  const totalSizeStock = sizeStocks.reduce((sum, item) => sum + item.stock, 0);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validasi dasar
    if (!name.trim() || !category || !price) {
      toast.error("Nama, kategori, dan harga wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("price", price);
      formData.append("stock", String(totalSizeStock || Number(stock) || 0));
      formData.append("description", description || "");
      formData.append("brand", brand.trim());
      formData.append("audience", audience);
      formData.append("segment", segment);
      formData.append("isNewArrival", String(isNewArrival));
      formData.append("isExclusive", String(isExclusive));
      formData.append("isComingSoon", String(isComingSoon));
      formData.append("isSale", String(isSale));
      formData.append("sizes", JSON.stringify(sizeStocks));
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }

      const response = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || "Gagal menambahkan produk");
      }

      const result = await response.json();

      toast.success("Produk berhasil ditambahkan!");
      console.log("✅ Produk berhasil disimpan:", result);
      router.push("/admin/product");
    } catch (err) {
      console.error("❌ Gagal menambahkan produk:", err);
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATALOG_CATEGORIES.find((c) => c.value === category);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/product"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kelola Produk</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-gray-600 mt-2">
            Isi form di bawah untuk menambahkan produk baru ke katalog
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                1
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">Info Dasar</p>
                <p className="text-xs">Nama & kategori</p>
              </div>
            </div>

            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full transition-all ${currentStep >= 2 ? "bg-blue-600 w-full" : "w-0"}`}></div>
            </div>

            <div className={`flex items-center gap-3 ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                2
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">Harga & Stok</p>
                <p className="text-xs">Pricing info</p>
              </div>
            </div>

            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full transition-all ${currentStep >= 3 ? "bg-blue-600 w-full" : "w-0"}`}></div>
            </div>

            <div className={`flex items-center gap-3 ${currentStep >= 3 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                3
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold">Detail</p>
                <p className="text-xs">Gambar & deskripsi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Informasi Dasar</h2>
                <p className="text-sm text-gray-600">Nama produk dan kategori</p>
              </div>
            </div>

            {/* Product Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Produk <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (currentStep < 1) setCurrentStep(1);
                  }}
                  onFocus={() => setCurrentStep(1)}
                  placeholder="Contoh: Nike Air Max 270"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Nama yang jelas dan menarik akan membantu pelanggan
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Kategori Produk <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATALOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setCategory(cat.value);
                      if (currentStep < 2) setCurrentStep(2);
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${category === cat.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{cat.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{cat.label}</p>
                        <p className="text-xs text-gray-600 mt-1">{cat.description}</p>
                      </div>
                      {category === cat.value && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Box className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Klasifikasi Katalog</h2>
                <p className="text-sm text-gray-600">Dipakai oleh filter navbar dan mega menu</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Nike, Adidas, New Balance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segment
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                  className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {selectedCategory && (
              <p className="mt-4 text-xs text-gray-500">
                Kategori aktif: {selectedCategory.label}
              </p>
            )}
          </div>

          {/* Step 2: Price & Stock */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Harga & Stok</h2>
                <p className="text-sm text-gray-600">Tentukan harga dan ketersediaan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga (Rp) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={formatPrice(price)}
                    onChange={(e) => {
                      handlePriceChange(e.target.value);
                      if (currentStep < 2) setCurrentStep(2);
                    }}
                    onFocus={() => setCurrentStep(2)}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-semibold"
                    disabled={loading}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {price && parseInt(price) > 0
                    ? `= ${formatPrice(price)} Rupiah`
                    : "Masukkan harga dalam Rupiah"}
                </p>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Stok
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStockChange(-1)}
                    disabled
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || parseInt(value) >= 0) {
                        setStock(value);
                      }
                    }}
                    onFocus={() => setCurrentStep(2)}
                    min="0"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold disabled:bg-gray-100"
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => handleStockChange(1)}
                    disabled
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Total dihitung otomatis dari stok per ukuran
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stok Per Ukuran
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sizeStocks.map((item) => (
                  <label key={item.size} className="rounded-lg border border-gray-200 p-3">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">
                      EU {item.size}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={item.stock}
                      onChange={(e) => handleSizeStockChange(item.size, e.target.value)}
                      disabled={loading}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Total stok dari ukuran: {totalSizeStock} unit
              </p>
            </div>

            {/* Price Preview */}
            {price && parseInt(price) > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Preview Harga</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      Rp {formatPrice(price)}
                    </p>
                  </div>
                  {stock && parseInt(stock) > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-green-800">Stok tersedia</p>
                      <p className="text-xl font-bold text-green-900">{stock} unit</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-50 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Detail Produk</h2>
                <p className="text-sm text-gray-600">Gambar dan deskripsi (opsional)</p>
              </div>
            </div>

            {/* Image URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Gambar
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreviewError(false);
                    if (currentStep < 3) setCurrentStep(3);
                  }}
                  onFocus={() => setCurrentStep(3)}
                  placeholder="/sepatu1.jpeg atau https://example.com/image.jpg"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Gunakan path lokal (contoh: /sepatu1.jpeg) atau URL lengkap
              </p>

              {/* Image Preview */}
              {imageUrl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Preview Gambar:</p>
                  <div className="flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
                    {!imagePreviewError ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="max-h-48 object-contain"
                        onError={() => setImagePreviewError(true)}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Gagal memuat gambar</p>
                        <p className="text-xs text-gray-400 mt-1">Periksa URL gambar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Produk
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (currentStep < 3) setCurrentStep(3);
                }}
                onFocus={() => setCurrentStep(3)}
                placeholder="Deskripsi detail produk, fitur, material, dll..."
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                disabled={loading}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Tips: Jelaskan keunggulan dan detail produk
                </p>
                <p className={`text-xs ${description.length > 450 ? "text-red-600 font-medium" : "text-gray-500"}`}>
                  {description.length}/500 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/admin/product"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <X className="w-5 h-5" />
                <span>Batal</span>
              </Link>
              <button
                type="submit"
                disabled={loading || !name || !category || !price}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Simpan Produk</span>
                  </>
                )}
              </button>
            </div>

            {/* Validation Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Status Form:</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${name ? "text-green-600" : "text-gray-400"}`}>
                  {name ? "✓" : "○"} Nama produk
                </div>
                <div className={`flex items-center gap-1 ${category ? "text-green-600" : "text-gray-400"}`}>
                  {category ? "✓" : "○"} Kategori
                </div>
                <div className={`flex items-center gap-1 ${price && parseInt(price) > 0 ? "text-green-600" : "text-gray-400"}`}>
                  {price && parseInt(price) > 0 ? "✓" : "○"} Harga
                </div>
                <div className={`flex items-center gap-1 ${stock ? "text-green-600" : "text-gray-400"}`}>
                  {stock ? "✓" : "○"} Stok
                </div>
                <div className={`flex items-center gap-1 ${imageUrl ? "text-green-600" : "text-gray-400"}`}>
                  {imageUrl ? "✓" : "○"} Gambar
                </div>
                <div className={`flex items-center gap-1 ${description ? "text-green-600" : "text-gray-400"}`}>
                  {description ? "✓" : "○"} Deskripsi
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
