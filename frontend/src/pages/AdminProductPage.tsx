import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
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
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import SizeStockEditor from "@/components/admin/SizeStockEditor";
import { useAuth } from "@/context/AuthContext";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { api } from "@/services/api";
import { fetchAllProducts, isAbortError } from "@/utils/admin-fetch";
import { formatCurrency, getCategoryName } from "@/utils/format";
import {
  PRODUCT_AUDIENCES,
  PRODUCT_CATEGORIES,
  PRODUCT_SEGMENTS,
  buildEditableSizeStocks,
  createDefaultSizeStocks,
} from "@/constants/product";
import type {
  Product,
  ProductAudience,
  ProductSegment,
  ProductSizeStock,
} from "@/types";

type SortOption =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "stock-asc";

export default function AdminProductPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
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
  const [editId, setEditId] = useState<string | null>(null);

  // UI states
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const modalTitleId = useId();
  const searchInputId = useId();
  const categoryFilterId = useId();
  const stockFilterId = useId();
  const sortFilterId = useId();
  const nameInputId = useId();
  const categoryInputId = useId();
  const brandInputId = useId();
  const audienceInputId = useId();
  const segmentInputId = useId();
  const priceInputId = useId();
  const stockDisplayId = useId();
  const descInputId = useId();

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const isAdmin = !authLoading && user?.role === "ADMIN";

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAllProducts(signal);
      if (!signal?.aborted) {
        setProducts(items);
        setInitialLoaded(true);
      }
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      toast.error("Gagal memuat produk");
      setInitialLoaded(true);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    void fetchProducts(controller.signal);
    return () => controller.abort();
  }, [isAdmin, fetchProducts]);

  const availableCategories = useMemo(() => {
    const merged = new Set<string>(PRODUCT_CATEGORIES);
    for (const p of products) {
      const cat = getCategoryName(p.category, "").trim();
      if (cat) merged.add(cat);
    }
    if (category.trim()) {
      merged.add(category.trim());
    }
    return Array.from(merged);
  }, [products, category]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

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

    if (categoryFilter) {
      filtered = filtered.filter(
        (p) => getCategoryName(p.category) === categoryFilter
      );
    }

    if (stockFilter === "low") {
      filtered = filtered.filter(
        (p) => p.stock !== null && p.stock > 0 && p.stock < 10
      );
    } else if (stockFilter === "out") {
      filtered = filtered.filter((p) => p.stock === 0);
    }

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

  const resetForm = useCallback(() => {
    setEditId(null);
    setName("");
    setCategory("");
    setPrice("");
    setDescription("");
    setImageUrl("");
    setBrand("");
    setAudience("UNISEX");
    setSegment("SHOES");
    setIsNewArrival(true);
    setIsExclusive(false);
    setIsComingSoon(false);
    setIsSale(false);
    setSizeStocks(createDefaultSizeStocks("SHOES"));
  }, []);

  const openModal = (product?: Product) => {
    if (product) {
      const productSegment = product.segment ?? "SHOES";
      setEditId(product.id);
      setName(product.name);
      setCategory(getCategoryName(product.category, ""));
      setPrice(product.price.toString());
      setDescription(product.description ?? "");
      setImageUrl(product.imageUrl ?? "");
      setBrand(product.brand ?? "");
      setAudience(product.audience ?? "UNISEX");
      setSegment(productSegment);
      setIsNewArrival(product.isNewArrival ?? true);
      setIsExclusive(product.isExclusive ?? false);
      setIsComingSoon(product.isComingSoon ?? false);
      setIsSale(product.isSale ?? false);
      setSizeStocks(buildEditableSizeStocks(productSegment, product.sizes));
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = useCallback(() => {
    if (saving) return;
    setShowModal(false);
    resetForm();
  }, [saving, resetForm]);

  useDialogFocusTrap({
    isOpen: showModal,
    onClose: closeModal,
    containerRef: modalRef,
    initialFocusRef: nameInputRef,
    canClose: !saving,
  });

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

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    const numericPrice = Number(price);
    if (!name.trim() || !category.trim()) {
      toast.error("Nama dan kategori produk wajib diisi");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Harga produk harus lebih dari Rp 0");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category.trim());
      formData.append("price", String(numericPrice));
      formData.append("stock", String(totalSizeStock));
      formData.append("description", description);
      formData.append("imageUrl", imageUrl.trim());
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
      setShowModal(false);
      resetForm();
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success("Produk berhasil dihapus!");
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus produk");
    } finally {
      setDeleting(false);
    }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stock !== null && p.stock > 0 && p.stock < 10
  ).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.price * (p.stock ?? 0),
    0
  );

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
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Products Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Tambah, edit, atau kelola inventaris produk & ukuran di toko Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openModal()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-gray-200 text-gray-900 rounded-full text-xs font-semibold hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <Edit2 size={15} aria-hidden="true" />
            <span>Quick Add</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/product/add")}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-gray-950 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
          >
            <Plus size={16} aria-hidden="true" />
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
                <p className="text-xs font-medium text-gray-600">Total Produk</p>
                <p className="text-2xl font-bold text-gray-950 mt-2 tabular-nums">
                  {totalProducts}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-gray-800" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Stok Rendah</p>
                <p className="text-2xl font-bold text-amber-700 mt-2 tabular-nums">
                  {lowStockProducts}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-amber-700" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Stok Habis</p>
                <p className="text-2xl font-bold text-rose-700 mt-2 tabular-nums">
                  {outOfStockProducts}
                </p>
              </div>
              <div className="bg-rose-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-rose-700" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Total Nilai Inventaris
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <Package className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <label htmlFor={searchInputId} className="sr-only">
                Cari produk
              </label>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5"
                aria-hidden="true"
              />
              <input
                id={searchInputId}
                type="text"
                placeholder="Cari nama, kategori, brand, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
            >
              <Filter size={18} aria-hidden="true" />
              <span>Filter</span>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label
                  htmlFor={categoryFilterId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kategori
                </label>
                <select
                  id={categoryFilterId}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent"
                >
                  <option value="">Semua Kategori</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={stockFilterId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Stok
                </label>
                <select
                  id={stockFilterId}
                  value={stockFilter}
                  onChange={(e) =>
                    setStockFilter(e.target.value as "all" | "low" | "out")
                  }
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent"
                >
                  <option value="all">Semua</option>
                  <option value="low">Stok Rendah (&lt;10)</option>
                  <option value="out">Habis</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={sortFilterId}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Urutkan
                </label>
                <select
                  id={sortFilterId}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent"
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
            <p className="text-sm text-gray-600 tabular-nums">
              Menampilkan{" "}
              <span className="font-semibold text-gray-950">
                {filteredProducts.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-950">{totalProducts}</span>{" "}
              produk
            </p>
          </div>
        )}

        {/* Product Grid */}
        {error ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <p className="text-rose-700 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => void fetchProducts()}
              className="mt-4 px-5 py-2.5 min-h-[44px] bg-gray-950 text-white rounded-full text-xs font-semibold hover:bg-gray-800 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : (!initialLoaded || loading) && products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <div
              aria-hidden="true"
              className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-950"
            />
            <p className="text-gray-600 mt-4 text-sm font-medium">Memuat produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
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
                <div className="relative aspect-square bg-gray-100">
                  {product.imageUrl && !brokenImages[product.id] ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" aria-hidden="true" />
                    </div>
                  )}

                  {product.stock === 0 && (
                    <div className="absolute top-3 right-3 bg-rose-700 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
                      HABIS
                    </div>
                  )}
                  {product.stock !== null &&
                    product.stock > 0 &&
                    product.stock < 10 && (
                      <div className="absolute top-3 right-3 bg-amber-600 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
                        RENDAH
                      </div>
                    )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
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
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          Eksklusif
                        </span>
                      )}
                      {product.isSale && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                          Sale
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-gray-950 mt-2 line-clamp-2 text-sm">
                      {product.name}
                    </h2>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-base font-extrabold text-gray-950 tabular-nums">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-600 font-medium tabular-nums">
                        Stok: {product.stock ?? "N/A"}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => openModal(product)}
                        disabled={loading || deleting}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition text-xs font-semibold min-h-[44px] disabled:opacity-50"
                      >
                        <Edit2 size={14} aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        disabled={loading || deleting}
                        className="flex items-center justify-center px-3 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition min-h-[44px] min-w-[44px] disabled:opacity-50"
                        aria-label={`Hapus produk ${product.name}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
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
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-[1px]"
          onClick={closeModal}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={modalTitleId}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2
                  id={modalTitleId}
                  className="text-xl font-bold text-gray-950"
                >
                  {editId ? "Edit Produk" : "Tambah Produk"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Tutup modal produk"
                  className="p-2 text-gray-500 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSave} noValidate>
                <div className="p-6 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                  <div>
                    <label
                      htmlFor={nameInputId}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nama Produk <span className="text-rose-700">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id={nameInputId}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nike Air Max 2024"
                      required
                      disabled={saving}
                      className="w-full px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={categoryInputId}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Kategori <span className="text-rose-700">*</span>
                    </label>
                    <select
                      id={categoryInputId}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      disabled={saving}
                      className="w-full px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Kategori</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor={brandInputId}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Brand
                      </label>
                      <input
                        id={brandInputId}
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Nike, Adidas"
                        disabled={saving}
                        className="w-full px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={audienceInputId}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Target
                      </label>
                      <select
                        id={audienceInputId}
                        value={audience}
                        onChange={(e) =>
                          setAudience(e.target.value as ProductAudience)
                        }
                        disabled={saving}
                        className="w-full px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        htmlFor={segmentInputId}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Segment
                      </label>
                      <select
                        id={segmentInputId}
                        value={segment}
                        onChange={(e) =>
                          handleSegmentChange(e.target.value as ProductSegment)
                        }
                        disabled={saving}
                        className="w-full px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      {
                        label: "New Arrival",
                        checked: isNewArrival,
                        onChange: setIsNewArrival,
                      },
                      {
                        label: "Eksklusif",
                        checked: isExclusive,
                        onChange: setIsExclusive,
                      },
                      {
                        label: "Coming Soon",
                        checked: isComingSoon,
                        onChange: setIsComingSoon,
                      },
                      { label: "Sale", checked: isSale, onChange: setIsSale },
                    ].map((item) => (
                      <label
                        key={item.label}
                        className="flex items-center gap-2 text-sm text-gray-700 min-h-[36px]"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => item.onChange(e.target.checked)}
                          disabled={saving}
                          className="h-4 w-4 rounded border-gray-300 accent-black"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={priceInputId}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Harga (Rp) <span className="text-rose-700">*</span>
                      </label>
                      <input
                        id={priceInputId}
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="1500000"
                        min="1"
                        step="1"
                        required
                        disabled={saving}
                        className="w-full px-4 py-2 min-h-[44px] border border-gray-300 rounded-lg tabular-nums focus:ring-2 focus:ring-gray-950 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={stockDisplayId}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Total Stok Otomatis
                      </label>
                      <input
                        id={stockDisplayId}
                        type="number"
                        value={totalSizeStock}
                        readOnly
                        disabled
                        className="w-full px-4 py-2 min-h-[44px] border border-gray-200 bg-gray-100 text-gray-700 rounded-lg tabular-nums cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-3">
                      Stok Per Ukuran
                    </p>
                    <SizeStockEditor
                      segment={segment}
                      sizeStocks={sizeStocks}
                      onChange={setSizeStocks}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={descInputId}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Deskripsi{" "}
                      <span className="text-xs text-gray-500">(opsional)</span>
                    </label>
                    <textarea
                      id={descInputId}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Deskripsi produk, fitur, material, dll..."
                      rows={4}
                      disabled={saving}
                      maxLength={500}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-950 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1 tabular-nums">
                      {description.length}/500 karakter
                    </p>
                  </div>

                  <div>
                    <ImageUploadDropzone
                      value={imageUrl}
                      onChange={(url) => setImageUrl(url)}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 min-h-[44px] text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 min-h-[44px] text-sm font-semibold"
                  >
                    <Save size={18} aria-hidden="true" />
                    <span>{saving ? "Menyimpan..." : "Simpan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Produk?"
        description={
          deleteTarget
            ? `Produk "${deleteTarget.name}" akan dihapus dari katalog. Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Ya, Hapus Produk"
        cancelLabel="Batal"
        tone="danger"
        isPending={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </AdminLayout>
  );
}

