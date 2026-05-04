"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency } from "@/lib/utils/format";
import { 
  Package, 
  Search, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  Filter,
  Download,
  RefreshCw,
  ShoppingBag,
  MapPin,
  CreditCard,
  Calendar,
  Eye,
  X,
  RotateCcw,
  Star
} from "lucide-react";
import Link from "next/link";

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

type OrderItem = {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
  size?: string;
};

type Order = {
  id: number;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  paymentMethod?: string;
};

type OrdersResponse = {
  success: boolean;
  data: { orders: Order[] };
};

const getStatusConfig = (status: OrderStatus) => {
  const configs = {
    PENDING: {
      label: "Menunggu Pembayaran",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    PROCESSING: {
      label: "Sedang Diproses",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    SHIPPED: {
      label: "Sedang Dikirim",
      icon: Truck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
    COMPLETED: {
      label: "Selesai",
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    CANCELLED: {
      label: "Dibatalkan",
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  };
  return configs[status];
};

export default function UserOrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Gagal memuat pesanan.");
      }

      const data = (await response.json()) as OrdersResponse;
      setOrders(data.data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
    }
  }, [authLoading, user]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Filter by status
    if (filterStatus !== "ALL" && order.status !== filterStatus) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesId = order.id.toString().includes(query);
      const matchesProduct = order.items.some(item => 
        item.product.name.toLowerCase().includes(query)
      );
      if (!matchesId && !matchesProduct) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    processing: orders.filter(o => o.status === "PROCESSING").length,
    shipped: orders.filter(o => o.status === "SHIPPED").length,
    completed: orders.filter(o => o.status === "COMPLETED").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
    totalSpent: orders
      .filter(o => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0),
  };

  // Cancel order
  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Gagal membatalkan pesanan.");
      }

      toast.success("Pesanan berhasil dibatalkan");
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan pesanan");
    }
  };

  // Download invoice (mock)
  const handleDownloadInvoice = (orderId: number) => {
    toast.success(`Invoice #${orderId} sedang diunduh...`);
    // In production, this would trigger actual PDF download
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login Diperlukan</h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk melihat riwayat pesanan Anda.
          </p>
          <Link
            href="/login"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Login Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Saya</h1>
          <p className="text-gray-600">Kelola dan lacak semua pesanan Anda</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dikirim</p>
                <p className="text-xl font-bold text-gray-900">{stats.shipped}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan ID pesanan atau nama produk..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Status */}
            <div className="md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">Menunggu Pembayaran</option>
                  <option value="PROCESSING">Sedang Diproses</option>
                  <option value="SHIPPED">Sedang Dikirim</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition min-w-[120px]"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Results Counter */}
          {!loading && orders.length > 0 && (
            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{filteredOrders.length}</span> dari{" "}
              <span className="font-semibold">{stats.total}</span> pesanan
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Memuat pesanan...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan yang sesuai filter"}
            </p>
            {orders.length === 0 ? (
              <Link
                href="/product"
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                Mulai belanja sekarang →
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("ALL");
                }}
                className="text-blue-600 hover:underline mt-4"
              >
                Reset filter untuk melihat semua pesanan
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-600">ID Pesanan</p>
                        <p className="font-mono font-semibold text-gray-900">#{order.id}</p>
                      </div>
                      <div className="hidden sm:block w-px h-10 bg-gray-300"></div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-gray-600">Tanggal</p>
                        <p className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                      <span className={`text-sm font-semibold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Jumlah: {item.quantity} {item.size && `• Ukuran: ${item.size}`}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-6 pt-4 border-t flex justify-between items-center">
                      <span className="text-gray-600">Total Pembayaran</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Detail</span>
                    </button>

                    {order.status === "COMPLETED" && (
                      <>
                        <button
                          onClick={() => handleDownloadInvoice(order.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>Invoice</span>
                        </button>
                        <Link
                          href={`/product/${order.items[0].product.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Beli Lagi</span>
                        </Link>
                      </>
                    )}

                    {order.status === "PENDING" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition ml-auto"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Batalkan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total Spending */}
        {!loading && stats.total > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Total Belanja</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-blue-100 text-sm mt-1">
                  dari {stats.total} pesanan • {stats.completed} selesai
                </p>
              </div>
              <div className="hidden md:block">
                <ShoppingBag className="w-16 h-16 text-blue-200 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
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
                {/* Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Status Pesanan</h3>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusConfig(selectedOrder.status).bg} ${getStatusConfig(selectedOrder.status).border} border`}>
                    {(() => {
                      const StatusIcon = getStatusConfig(selectedOrder.status).icon;
                      return <StatusIcon className={`w-5 h-5 ${getStatusConfig(selectedOrder.status).color}`} />;
                    })()}
                    <span className={`font-semibold ${getStatusConfig(selectedOrder.status).color}`}>
                      {getStatusConfig(selectedOrder.status).label}
                    </span>
                  </div>
                </div>

                {/* Shipping Info */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Alamat Pengiriman
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>{selectedOrder.shippingAddress}</p>
                      <p>
                        {selectedOrder.shippingCity}
                        {selectedOrder.shippingPostalCode && ` - ${selectedOrder.shippingPostalCode}`}
                      </p>
                      {selectedOrder.shippingPhone && (
                        <p className="mt-2 text-sm text-gray-600">
                          Telp: {selectedOrder.shippingPhone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Produk</h3>
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
                            <td className="p-3 text-sm">
                              {item.product.name}
                              {item.size && <span className="text-gray-500"> • {item.size}</span>}
                            </td>
                            <td className="p-3 text-sm text-center">{item.quantity}</td>
                            <td className="p-3 text-sm text-right">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="p-3 text-sm text-right font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2">
                        <tr>
                          <td colSpan={3} className="p-3 text-right font-semibold">Total</td>
                          <td className="p-3 text-right font-bold text-lg">
                            {formatCurrency(selectedOrder.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment & Date */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.paymentMethod && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Pembayaran
                      </h3>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {selectedOrder.paymentMethod}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Tanggal
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {new Date(selectedOrder.createdAt).toLocaleDateString("id-ID", {
                        dateStyle: "full",
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {selectedOrder.status === "COMPLETED" && (
                    <button
                      onClick={() => handleDownloadInvoice(selectedOrder.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Invoice</span>
                    </button>
                  )}
                  {selectedOrder.status === "PENDING" && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Batalkan Pesanan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
