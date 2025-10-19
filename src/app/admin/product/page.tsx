"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Package,
  Filter,
  ChevronDown,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number | null;
  description: string | null;
  imageUrl?: string;
  slug: string;
}

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc" | "name-asc" | "stock-asc";

const CATEGORIES = [
  "Running",
  "Sneakers",
  "Casual",
  "Formal",
  "Sports",
  "Basketball",
  "Football",
  "Training",
  "Lifestyle",
  "Other",
];

export default function AdminProductPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Load products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  // Apply filters whenever search/filter/sort changes
  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, categoryFilter, stockFilter, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/products?limit=100", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Gagal memuat produk");
      const data = await response.json();
      // API returns { data: { products } } for limit query
      setProducts(data.data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === "low") {
      filtered = filtered.filter(
        (p) => p.stock !== null && p.stock > 0 && p.stock < 10
      );
    } else if (stockFilter === "out") {
      filtered = filtered.filter((p) => p.stock === 0);
    }

    // Sorting
    switch (sortBy) {
      case "oldest":
        filtered.reverse();
        break;
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "stock-asc":
        filtered.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditId(product.id);
      setName(product.name);
      setCategory(product.category);
      setPrice(product.price.toString());
      setStock(product.stock?.toString() ?? "");
      setDescription(product.description ?? "");
      setImageUrl(product.imageUrl ?? "");
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
    setDescription("");
    setImageUrl("");
  };

  const handleSave = async () => {
    if (!name.trim() || !category || !price) {
      toast.error("Nama, kategori, dan harga wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const url = editId ? `/api/products/${editId}` : "/api/products";
      const method = editId ? "PUT" : "POST";

      // Gunakan FormData agar sesuai dengan backend
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("stock", stock || "0");
      formData.append("description", description);
      formData.append("imageUrl", imageUrl);

      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formData, // ⬅️ ubah ini
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Gagal menyimpan produk");
      }

      toast.success(editId ? "Produk diperbarui!" : "Produk ditambahkan!");
      closeModal();
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Gagal menghapus produk");
      }

      toast.success("Produk berhasil dihapus!");
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from ALL products (not filtered)
  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock !== null && p.stock > 0 && p.stock < 10
  ).length;
  const outOfStockProducts = products.filter(
    (p) => p.stock === 0
  ).length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.price * (p.stock ?? 0),
    0
  );

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Kembali ke Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Kelola Produk
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Tambah, edit, atau hapus produk
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => openModal()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 size={18} />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
              <button
                onClick={() => router.push("/admin/product/add")}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                <span>Tambah Produk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Produk</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalProducts}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stok Rendah</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {lowStockProducts}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Habis</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {outOfStockProducts}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Nilai</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  Rp {(totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 border border-gray-200">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama, kategori, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
            >
              <Filter size={20} />
              <span>Filter</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showFilters ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) =>
                    setStockFilter(e.target.value as "all" | "low" | "out")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua</option>
                  <option value="low">Stok Rendah (&lt;10)</option>
                  <option value="out">Habis</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urutkan
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="price-asc">Harga: Rendah ke Tinggi</option>
                  <option value="price-desc">Harga: Tinggi ke Rendah</option>
                  <option value="name-asc">Nama: A-Z</option>
                  <option value="stock-asc">Stok: Rendah ke Tinggi</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!error && filteredProducts.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{filteredProducts.length}</span> dari{" "}
              <span className="font-semibold">{totalProducts}</span> produk
            </p>
          </div>
        )}

        {/* Product Grid */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        ) : loading && products.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Memuat produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery || categoryFilter || stockFilter !== "all"
                ? "Tidak ada produk yang sesuai dengan filter"
                : "Belum ada produk"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-200 overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      HABIS
                    </div>
                  )}
                  {product.stock !== null &&
                    product.stock > 0 &&
                    product.stock < 10 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        RENDAH
                      </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {product.category}
                  </p>
                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    Rp {product.price.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Stok: {product.stock ?? "N/A"}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openModal(product)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={loading}
                      className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editId ? "Edit Produk" : "Tambah Produk"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nike Air Max 2024"
                      required
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Kategori</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga (Rp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="1500000"
                        min="1"
                        step="1000"
                        required
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok <span className="text-xs text-gray-500">(opsional, default: 0)</span>
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="50"
                        min="0"
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi <span className="text-xs text-gray-500">(opsional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Deskripsi produk, fitur, material, dll..."
                      rows={4}
                      disabled={loading}
                      maxLength={500}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/500 karakter
                    </p>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Gambar <span className="text-xs text-gray-500">(opsional)</span>
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {imageUrl && (
                      <div className="mt-3 relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={imageUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "";
                            toast.error("Gagal memuat gambar. Periksa URL gambar.");
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t">
                  <button
                    onClick={closeModal}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 min-h-[44px]"
                  >
                    <Save size={20} />
                    <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
