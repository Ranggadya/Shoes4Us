"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  RefreshCw
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category:
  | string
  | {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  price: number;
  stock: number | null;
}


interface Order {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  status: string;
  totalAmount: number;
  items: Array<{
    id: number;
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  paymentMethod?: string;
}

export default function AdminDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State produk & orders
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // State umum
  const [activeTab, setActiveTab] = useState<"produk" | "status">("status");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State filter & search untuk orders
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount-high" | "amount-low">("newest");

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch products
  useEffect(() => {
    if (user?.role === "ADMIN" && activeTab === "produk") {
      fetchProducts();
    }
  }, [user, activeTab]);

  // Fetch orders
  useEffect(() => {
    if (user?.role === "ADMIN" && activeTab === "status") {
      fetchOrders();
    }
  }, [user, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 [AdminDashboard] Fetching products...");
      console.log("🔑 [AdminDashboard] Token:", token ? "Ada" : "Tidak ada");

      const response = await fetch("/api/products?page=1&pageSize=100", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
      });

      console.log("📥 [AdminDashboard] Products response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [AdminDashboard] Products error:", errorData);
        throw new Error(errorData?.message || "Gagal memuat produk");
      }

      const data = await response.json();
      console.log("📦 [AdminDashboard] Products FULL response:", data);
      console.log("📦 [AdminDashboard] data.data:", data.data);
      console.log("📦 [AdminDashboard] data.data?.items:", data.data?.items);
      console.log("📦 [AdminDashboard] data.data?.products:", data.data?.products);

      const productsList = data.data?.items || data.data?.products || data.data || [];
      console.log("📦 [AdminDashboard] Products list:", productsList);
      console.log("📦 [AdminDashboard] Jumlah products:", productsList.length);

      setProducts(productsList);
    } catch (err) {
      console.error("❌ [AdminDashboard] Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/orders?page=1&limit=100", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal memuat pesanan");
      }

      const data = await response.json();
      setOrders(data.data?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  // Filter & sort orders
  const filteredAndSortedOrders = orders
    .filter((order) => {
      // Filter by status
      if (filterStatus !== "ALL" && order.status !== filterStatus) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = order.id.toString().includes(query);
        const matchesCustomer = order.user.name.toLowerCase().includes(query) ||
          order.user.email.toLowerCase().includes(query);
        const matchesProduct = order.items.some(item =>
          item.product.name.toLowerCase().includes(query)
        );
        if (!matchesId && !matchesCustomer && !matchesProduct) {
          return false;
        }
      }

      // Filter by date range
      const orderDate = new Date(order.createdAt);
      if (filterDateFrom && new Date(filterDateFrom) > orderDate) {
        return false;
      }
      if (filterDateTo) {
        const endDate = new Date(filterDateTo);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < orderDate) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "amount-high":
          return b.totalAmount - a.totalAmount;
        case "amount-low":
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    processing: orders.filter(o => o.status === "PROCESSING").length,
    shipped: orders.filter(o => o.status === "SHIPPED").length,
    completed: orders.filter(o => o.status === "COMPLETED").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
    totalRevenue: orders
      .filter(o => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.totalAmount, 0),
    averageOrderValue: orders.length > 0
      ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / orders.length
      : 0,
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Tanggal", "Pelanggan", "Email", "Produk", "Total", "Status"];
    const rows = filteredAndSortedOrders.map(order => [
      order.id,
      new Date(order.createdAt).toLocaleDateString("id-ID"),
      order.user.name,
      order.user.email,
      order.items.map(i => `${i.product.name} (${i.quantity}x)`).join("; "),
      order.totalAmount,
      order.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success("Data berhasil diekspor!");
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("newest");
  };

  // Ganti status pesanan
  const handleStatusChange = async (orderId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) {
      return; // No change
    }

    if (!confirm(`Ubah status pesanan #${orderId} dari "${currentStatus}" menjadi "${newStatus}"?`)) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "Gagal mengubah status");
      }

      toast.success(`Status pesanan #${orderId} berhasil diubah!`);
      await fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Memuat...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

        {/* Tab Navigation */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Dashboard</p>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("status")}
              className={`w-full px-3 py-2 rounded text-left transition-colors ${activeTab === "status" ? "bg-gray-800" : "hover:bg-gray-800"
                }`}
            >
              Status Pesanan
            </button>
            <button
              onClick={() => setActiveTab("produk")}
              className={`w-full px-3 py-2 rounded text-left transition-colors ${activeTab === "produk" ? "bg-gray-800" : "hover:bg-gray-800"
                }`}
            >
              Daftar Produk
            </button>
          </nav>
        </div>

        {/* External Navigation Links */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Kelola</p>
          <nav className="space-y-2">
            <button
              onClick={() => router.push("/admin/product")}
              className="w-full px-3 py-2 rounded text-left hover:bg-gray-800 transition-colors flex items-center justify-between group"
            >
              <span>Kelola Produk</span>
              <svg
                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      </aside>

      {/* Konten */}
      <main className="flex-1 p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {activeTab === "produk" ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Daftar Produk</h1>
              <button
                onClick={() => router.push("/admin/product")}
                className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 font-semibold transition-colors"
              >
                + Tambah/Edit Produk
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-700 font-medium">Memuat produk...</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-x-auto border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-800 text-left">
                    <tr>
                      <th className="p-3 border-b border-gray-700 text-white font-semibold">ID</th>
                      <th className="p-3 border-b border-gray-700 text-white font-semibold">Nama Produk</th>
                      <th className="p-3 border-b border-gray-700 text-white font-semibold">Kategori</th>
                      <th className="p-3 border-b border-gray-700 text-white font-semibold">Harga</th>
                      <th className="p-3 border-b border-gray-700 text-white font-semibold">Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-gray-600 text-base">
                          Belum ada produk
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                          <td className="p-3">
                            <span className="font-bold text-gray-900">#{p.id}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-900">{p.name}</span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {typeof p.category === 'string'
                                ? p.category
                                : p.category?.name || 'Tidak ada kategori'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900 text-base">
                              Rp {(p.price || 0).toLocaleString("id-ID")}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`font-semibold ${p.stock === null ? "text-green-700" : p.stock > 0 ? "text-gray-900" : "text-red-600"}`}>
                              {p.stock ?? "Tidak terbatas"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Kelola Pesanan</h1>
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 font-semibold transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Muat Ulang
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Pesanan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rp {(stats.totalRevenue / 1000000).toFixed(1)}jt
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rata-rata Order</p>
                    <p className="text-2xl font-bold text-purple-600">
                      Rp {(stats.averageOrderValue / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Status Pesanan</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded font-semibold text-gray-800">
                      Pending: {stats.pending}
                    </span>
                    <span className="bg-yellow-100 px-2 py-1 rounded font-semibold text-yellow-800">
                      Proses: {stats.processing}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-100 px-2 py-1 rounded font-semibold text-blue-800">
                      Kirim: {stats.shipped}
                    </span>
                    <span className="bg-green-100 px-2 py-1 rounded font-semibold text-green-800">
                      Selesai: {stats.completed}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900">Filter & Pencarian</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Cari</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ID, nama, email, produk..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Dari Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Sampai Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Sort & Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-900">Urutkan:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "amount-high" | "amount-low")}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="amount-high">Total Tertinggi</option>
                    <option value="amount-low">Total Terendah</option>
                  </select>
                </div>

                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset Filter
                </button>

                <button
                  onClick={exportToCSV}
                  disabled={filteredAndSortedOrders.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-semibold ml-auto transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>

                <div className="text-sm text-gray-900 font-medium">
                  Menampilkan <span className="font-bold text-blue-600">{filteredAndSortedOrders.length}</span> dari{" "}
                  <span className="font-bold text-blue-600">{stats.total}</span> pesanan
                </div>
              </div>
            </div>

            {/* Orders Table */}
            {loading && orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Memuat pesanan...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchOrders}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Coba Lagi
                </button>
              </div>
            ) : filteredAndSortedOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">
                  {orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan yang sesuai filter"}
                </p>
                {orders.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-blue-600 hover:underline"
                  >
                    Reset filter untuk melihat semua pesanan
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800 text-left border-b">
                        <tr>
                          <th className="p-3 text-sm font-semibold text-white">ID</th>
                          <th className="p-3 text-sm font-semibold text-white">Tanggal</th>
                          <th className="p-3 text-sm font-semibold text-white">Pelanggan</th>
                          <th className="p-3 text-sm font-semibold text-white">Produk</th>
                          <th className="p-3 text-sm font-semibold text-white">Total</th>
                          <th className="p-3 text-sm font-semibold text-white">Status</th>
                          <th className="p-3 text-sm font-semibold text-white text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAndSortedOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                            <td className="p-3">
                              <span className="font-mono text-sm font-bold text-gray-900">#{order.id}</span>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="font-medium text-gray-900">
                                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                <div className="font-semibold text-gray-900">{order.user.name}</div>
                                <div className="text-xs text-gray-700">{order.user.email}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm max-w-xs">
                                {order.items.length === 1 ? (
                                  <div className="text-gray-900">
                                    <span className="font-medium">{order.items[0].product.name}</span>
                                    <span className="text-gray-600"> x{order.items[0].quantity}</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-medium text-gray-900">{order.items[0].product.name}</span>
                                    <span className="text-gray-600"> x{order.items[0].quantity}</span>
                                    <br />
                                    <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                                      onClick={() => setSelectedOrder(order)}
                                    >
                                      +{order.items.length - 1} produk lainnya
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-gray-900 text-base">
                                Rp {(order.totalAmount || 0).toLocaleString("id-ID")}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${order.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                                order.status === "SHIPPED" ? "bg-blue-100 text-blue-800" :
                                  order.status === "PROCESSING" ? "bg-yellow-100 text-yellow-800" :
                                    order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                                      "bg-gray-100 text-gray-800"
                                }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                                  disabled={loading}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer bg-white hover:border-gray-400 disabled:opacity-50"
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredAndSortedOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                      {/* Card Header */}
                      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-white">#{order.id}</span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${order.status === "COMPLETED" ? "bg-green-400 text-green-900" :
                            order.status === "SHIPPED" ? "bg-blue-400 text-blue-900" :
                              order.status === "PROCESSING" ? "bg-yellow-400 text-yellow-900" :
                                order.status === "CANCELLED" ? "bg-red-400 text-red-900" :
                                  "bg-gray-400 text-gray-900"
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-gray-600">
                            {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Customer */}
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-600 mb-1">Pelanggan</p>
                          <p className="font-semibold text-gray-900">{order.user.name}</p>
                          <p className="text-sm text-gray-700">{order.user.email}</p>
                        </div>

                        {/* Products */}
                        <div className="border-t pt-3">
                          <p className="text-xs text-gray-600 mb-1">Produk</p>
                          {order.items.length === 1 ? (
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{order.items[0].product.name}</span>
                              <span className="text-gray-600"> x{order.items[0].quantity}</span>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{order.items[0].product.name}</span>
                              <span className="text-gray-600"> x{order.items[0].quantity}</span>
                              <br />
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="text-xs text-blue-600 font-medium hover:underline mt-1"
                              >
                                +{order.items.length - 1} produk lainnya
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Total */}
                        <div className="border-t pt-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total</span>
                          <span className="font-bold text-gray-900 text-lg">
                            Rp {(order.totalAmount || 0).toLocaleString("id-ID")}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="border-t pt-3 flex gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Detail
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                            disabled={loading}
                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:border-gray-400 disabled:opacity-50"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Detail Pesanan #{selectedOrder.id}</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Informasi Pelanggan</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                        <p><span className="font-medium">Nama:</span> {selectedOrder.user.name}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                        {selectedOrder.shippingPhone && (
                          <p><span className="font-medium">Telepon:</span> {selectedOrder.shippingPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Shipping Info */}
                    {selectedOrder.shippingAddress && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Alamat Pengiriman</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p>{selectedOrder.shippingAddress}</p>
                          <p>
                            {selectedOrder.shippingCity}
                            {selectedOrder.shippingPostalCode && ` - ${selectedOrder.shippingPostalCode}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Produk</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Produk</th>
                              <th className="text-center p-3 text-sm font-medium">Qty</th>
                              <th className="text-right p-3 text-sm font-medium">Harga</th>
                              <th className="text-right p-3 text-sm font-medium">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedOrder.items.map((item) => (
                              <tr key={item.id}>
                                <td className="p-3 text-sm">{item.product.name}</td>
                                <td className="p-3 text-sm text-center">{item.quantity}</td>
                                <td className="p-3 text-sm text-right">
                                  Rp {(item.price || 0).toLocaleString("id-ID")}
                                </td>
                                <td className="p-3 text-sm text-right font-medium">
                                  Rp {((item.price || 0) * (item.quantity || 0)).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t-2">
                            <tr>
                              <td colSpan={3} className="p-3 text-right font-semibold">Total</td>
                              <td className="p-3 text-right font-bold text-lg">
                                Rp {(selectedOrder.totalAmount || 0).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Payment & Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Metode Pembayaran</h3>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {selectedOrder.paymentMethod || "Tidak tersedia"}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => {
                            handleStatusChange(selectedOrder.id, e.target.value, selectedOrder.status);
                            setSelectedOrder(null);
                          }}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Date */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Tanggal Pesanan</h3>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {new Date(selectedOrder.createdAt).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "short"
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
