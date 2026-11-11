import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
import { ImageUploadDropzone } from "@/components/admin/ImageUploadDropzone";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { getCategoryName } from "@/utils/format";
import {
  PRODUCT_AUDIENCES,
  PRODUCT_CATEGORIES,
  PRODUCT_SEGMENTS,
  createDefaultSizeStocks,
} from "@/constants/product";
import type { Product, ProductAudience, ProductSegment } from "@/types";

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc" | "name-asc" | "stock-asc";

const CATEGORIES = PRODUCT_CATEGORIES;
const DEFAULT_SIZE_STOCKS = createDefaultSizeStocks();

export default function AdminProductPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState<ProductAudience>("UNISEX");
  const [segment, setSegment] = useState<ProductSegment>("SHOES");
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [isSale, setIsSale] = useState(false);
  const [sizeStocks, setSizeStocks] = useState(DEFAULT_SIZE_STOCKS);
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
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{
        data?: { items?: Product[]; products?: Product[] };
      }>("/products?limit=100&includeDetails=true");
      setProducts(data.data?.items || data.data?.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products from API
  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          getCategoryName(p.category).toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (p) => getCategoryName(p.category) === categoryFilter
      );
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
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        );
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

    return filtered;
  }, [products, searchQuery, categoryFilter, stockFilter, sortBy]);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
    setDescription("");
    setImageUrl("");
    setBrand("");
    setAudience("UNISEX");
    setSegment("SHOES");
    setIsNewArrival(true);
    setIsExclusive(false);
    setIsComingSoon(false);
    setIsSale(false);
    setSizeStocks(DEFAULT_SIZE_STOCKS);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditId(product.id);
      setName(product.name);
      setCategory(getCategoryName(product.category, ""));
      setPrice(product.price.toString());
      setStock(product.stock?.toString() ?? "");
      setDescription(product.description ?? "");
      setImageUrl(product.imageUrl ?? "");
      setBrand(product.brand ?? "");
      setAudience(product.audience ?? "UNISEX");
      setSegment(product.segment ?? "SHOES");
      setIsNewArrival(product.isNewArrival ?? true);
      setIsExclusive(product.isExclusive ?? false);
      setIsComingSoon(product.isComingSoon ?? false);
      setIsSale(product.isSale ?? false);
      setSizeStocks(
        DEFAULT_SIZE_STOCKS.map((defaultItem) => {
          const existing = product.sizes?.find((item) => item.size === defaultItem.size);
          return {
            size: defaultItem.size,
            stock: existing?.stock ?? 0,
          };
        })
      );
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
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
        .reduce((sum, val) => sum + val, 0)
        .toString()
    );
  };

  const totalSizeStock = sizeStocks.reduce((sum, item) => sum + item.stock, 0);

  const handleSave = async () => {
    if (!name.trim() || !category || !price) {
      toast.error("Nama, kategori, dan harga wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("stock", String(totalSizeStock || Number(stock) || 0));
      formData.append("description", description);
      formData.append("imageUrl", imageUrl);
      formData.append("brand", brand.trim());
      formData.append("audience", audience);
      formData.append("segment", segment);
      formData.append("isNewArrival", String(isNewArrival));
      formData.append("isExclusive", String(isExclusive));
      formData.append("isComingSoon", String(isComingSoon));
      formData.append("isSale", String(isSale));
      formData.append("sizes", JSON.stringify(sizeStocks));

      if (editId) {
        await api.put(`/products/${editId}`, formData);
      } else {
        await api.post("/products", formData);
      }

      toast.success(editId ? "Produk diperbarui!" : "Produk ditambahkan!");
      closeModal();
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    setLoading(true);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Produk berhasil dihapus!");
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus produk");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from ALL products (not filtered)
  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock !== null && p.stock > 0 && p.stock < 10
  ).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
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
    <AdminLayout>
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Products Catalog
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tambah, edit, atau kelola inventaris ukuran sepatu di toko Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-full text-xs font-semibold hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <Edit2 size={15} />
            <span>Quick Add</span>
          </button>
          <button
            onClick={() => navigate("/admin/product/add")}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-950 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
          >
            <Plus size={16} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Produk</p>
                <p className="text-2xl font-bold text-gray-950 mt-2">
                  {totalProducts}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-gray-800" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Stok Rendah</p>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  {lowStockProducts}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Stok Habis</p>
                <p className="text-2xl font-bold text-rose-600 mt-2">
                  {outOfStockProducts}
                </p>
              </div>
              <div className="bg-rose-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Nilai Inventaris</p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  Rp {(totalValue / 1000000).toFixed(1)} jt
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl shadow-sm p-5 mb-6 border border-gray-100">
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
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
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
                className="bg-white rounded-3xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute top-3 right-3 bg-rose-500 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
                      HABIS
                    </div>
                  )}
                  {product.stock !== null &&
                    product.stock > 0 &&
                    product.stock < 10 && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
                        RENDAH
                      </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {getCategoryName(product.category)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.brand && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
                          {product.brand}
                        </span>
                      )}
                      {product.audience && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                          {product.audience}
                        </span>
                      )}
                      {product.isExclusive && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          Eksklusif
                        </span>
                      )}
                      {product.isSale && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600">
                          Sale
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-950 mt-2 line-clamp-2 text-sm">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-base font-extrabold text-gray-950">
                        Rp {product.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        Stok: {product.stock ?? "N/A"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => openModal(product)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition text-xs font-semibold min-h-[40px] disabled:opacity-50"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={loading}
                        className="flex items-center justify-center px-3 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition min-h-[40px] disabled:opacity-50"
                        aria-label="Hapus produk"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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

                  {/* Catalog Classification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Nike, Adidas"
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target
                      </label>
                      <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value as ProductAudience)}
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        onChange={(e) => setSegment(e.target.value as ProductSegment)}
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {PRODUCT_SEGMENTS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-lg border border-gray-200 p-3">
                    {[
                      { label: "New Arrival", checked: isNewArrival, onChange: setIsNewArrival },
                      { label: "Eksklusif", checked: isExclusive, onChange: setIsExclusive },
                      { label: "Coming Soon", checked: isComingSoon, onChange: setIsComingSoon },
                      { label: "Sale", checked: isSale, onChange: setIsSale },
                    ].map((item) => (
                      <label key={item.label} className="flex items-center gap-2 text-sm text-gray-700">
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
                        Total Stok
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="50"
                        min="0"
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Stok Per Ukuran
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-gray-200 p-3">
                      {sizeStocks.map((item) => (
                        <label key={item.size}>
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

                  {/* Image Upload Dropzone */}
                  <div>
                    <ImageUploadDropzone
                      value={imageUrl}
                      onChange={(url) => setImageUrl(url)}
                      disabled={loading}
                    />
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
    </AdminLayout>
  );
}

