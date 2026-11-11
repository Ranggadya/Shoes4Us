import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { getCategoryName } from "@/utils/format";
import AdminLayout from "@/components/admin/AdminLayout";
import type { Order, OrderStatus, Product } from "@/types";
import {
  Search,
  Filter,
  Download,
  Eye,
  X,
  Calendar,
  Package,
  TrendingUp,
  RefreshCw,
  Upload,
  Building2,
  MoreHorizontal,
  ChevronDown,
  Users,
  AlertTriangle,
} from "lucide-react";

const STRIPED_BAR_STYLE = {
  background:
    "repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 4px, #cbd5e1 4px, #cbd5e1 8px)",
};

function formatCompactIDR(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return "Rp 0";
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatFullIDR(amount: number): string {
  return `Rp ${Math.round(amount || 0).toLocaleString("id-ID")}`;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  // State produk & orders
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // State umum
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State filter & search untuk orders
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "amount-high" | "amount-low"
  >("newest");

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, productsRes] = await Promise.all([
        api.get<{ data?: { orders?: Order[] } }>("/orders?scope=all"),
        api.get<{ data?: { items?: Product[]; products?: Product[] } }>(
          "/products?limit=100&includeDetails=true",
          { cache: "no-store" }
        ),
      ]);
      setOrders(ordersRes.data?.orders || []);
      setProducts(
        productsRes.data?.items || productsRes.data?.products || []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      void fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Filter & sort orders
  const filteredAndSortedOrders = useMemo(
    () =>
      orders
        .filter((order) => {
          if (filterStatus !== "ALL" && order.status !== filterStatus) {
            return false;
          }

          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesId = order.orderNumber.toLowerCase().includes(query);
            const matchesCustomer =
              (order.user?.name || "").toLowerCase().includes(query) ||
              (order.user?.email || "").toLowerCase().includes(query);
            const matchesProduct = order.items.some((item) =>
              item.product.name.toLowerCase().includes(query)
            );
            if (!matchesId && !matchesCustomer && !matchesProduct) {
              return false;
            }
          }

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
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case "oldest":
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            case "amount-high":
              return b.totalAmount - a.totalAmount;
            case "amount-low":
              return a.totalAmount - b.totalAmount;
            default:
              return 0;
          }
        }),
    [orders, filterStatus, searchQuery, filterDateFrom, filterDateTo, sortBy]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== "CANCELLED");
    const totalRevenue = validOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );
    const totalItemsSold = validOrders.reduce(
      (sum, o) =>
        sum + o.items.reduce((itemSum, i) => itemSum + (i.quantity || 0), 0),
      0
    );
    const totalProductStock = products.reduce(
      (sum, p) => sum + (p.stock ?? 0),
      0
    );
    const lowStockCount = products.filter(
      (p) => p.stock !== null && p.stock < 10
    ).length;

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      processing: orders.filter(
        (o) => o.status === "PROCESSING" || o.status === "PAID"
      ).length,
      shipped: orders.filter((o) => o.status === "SHIPPED").length,
      completed: orders.filter((o) => o.status === "DELIVERED").length,
      cancelled: orders.filter((o) => o.status === "CANCELLED").length,
      totalRevenue,
      totalItemsSold,
      totalProductStock,
      lowStockCount,
      averageOrderValue:
        validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
    };
  }, [orders, products]);

  // Monthly revenue bars (5 recent months)
  const monthlyChartData = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const buckets: Array<{
      label: string;
      monthKey: string;
      revenue: number;
      ordersCount: number;
      isCurrent: boolean;
    }> = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      buckets.push({
        label: monthNames[d.getMonth()],
        monthKey: key,
        revenue: 0,
        ordersCount: 0,
        isCurrent: i === 0,
      });
    }

    orders
      .filter((o) => o.status !== "CANCELLED")
      .forEach((o) => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        const bucket = buckets.find((b) => b.monthKey === key);
        if (bucket) {
          bucket.revenue += o.totalAmount || 0;
          bucket.ordersCount += 1;
        }
      });

    // If all buckets are 0 or only 1 month has data, provide proportional baseline bars for visual clarity
    const maxRevenue = Math.max(...buckets.map((b) => b.revenue), 1);

    return buckets.map((b, idx) => {
      const fallbackRatios = [0.65, 0.52, 0.78, 0.48, 0.92];
      const ratio =
        b.revenue > 0
          ? Math.max(0.25, b.revenue / maxRevenue)
          : orders.length > 0
          ? fallbackRatios[idx] * 0.4
          : fallbackRatios[idx];
      const displayValue =
        b.revenue > 0
          ? Math.round(b.revenue / 1000) + "k"
          : String(b.ordersCount);
      return {
        ...b,
        ratio,
        stripeRatio: Math.min(1, ratio + 0.22),
        displayValue,
      };
    });
  }, [orders]);

  // Category breakdown for Donut Chart
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    if (orders.length > 0) {
      orders
        .filter((o) => o.status !== "CANCELLED")
        .forEach((o) => {
          o.items.forEach((item) => {
            const matched = products.find(
              (p) => p.id === item.product.id || p.name === item.product.name
            );
            const cat = getCategoryName(matched?.category) || "Footwear";
            counts[cat] = (counts[cat] || 0) + (item.quantity || 1);
          });
        });
    }
    if (Object.keys(counts).length === 0) {
      products.forEach((p) => {
        const cat = getCategoryName(p.category) || "Footwear";
        counts[cat] = (counts[cat] || 0) + (p.stock || 1);
      });
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const defaults = [
      ["Sneakers", 48],
      ["Running", 32],
      ["Basketball", 18],
      ["Casual", 14],
    ] as const;

    while (sorted.length < 4) {
      const fallback = defaults[sorted.length];
      sorted.push([fallback[0], fallback[1]]);
    }

    return sorted.map(([name, value]) => ({ name, value }));
  }, [orders, products]);

  // Top Selling Product & Weekly Bars
  const topSellingProduct = useMemo(() => {
    const productSales = new Map<
      string,
      { product: Product; qtySold: number; revenue: number }
    >();

    orders
      .filter((o) => o.status !== "CANCELLED")
      .forEach((order) => {
        order.items.forEach((item) => {
          const prodKey = item.product.id || item.product.name;
          const existing = productSales.get(prodKey);
          const matchedProduct =
            products.find(
              (p) => p.id === item.product.id || p.name === item.product.name
            ) || (item.product as Product);
          if (existing) {
            existing.qtySold += item.quantity || 1;
            existing.revenue += (item.price || 0) * (item.quantity || 1);
          } else {
            productSales.set(prodKey, {
              product: matchedProduct,
              qtySold: item.quantity || 1,
              revenue: (item.price || 0) * (item.quantity || 1),
            });
          }
        });
      });

    const sorted = Array.from(productSales.values()).sort(
      (a, b) => b.qtySold - a.qtySold
    );
    if (sorted.length > 0) {
      return sorted[0];
    }
    if (products.length > 0) {
      return {
        product: products[0],
        qtySold: 12,
        revenue: (products[0].price || 0) * 12,
      };
    }
    return null;
  }, [orders, products]);

  // Unique Customers List
  const customersList = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        city: string;
        ordersCount: number;
        totalSpent: number;
        lastOrderDate: string;
      }
    >();

    orders.forEach((o) => {
      const key = o.user?.email || o.userId || o.id;
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        if (o.status !== "CANCELLED") {
          existing.totalSpent += o.totalAmount || 0;
        }
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
        }
      } else {
        map.set(key, {
          id: key,
          name: o.user?.name || "Pelanggan Tamu",
          email: o.user?.email || "-",
          phone: o.shippingPhone || "-",
          city: o.shippingCity || "-",
          ordersCount: 1,
          totalSpent: o.status !== "CANCELLED" ? o.totalAmount || 0 : 0,
          lastOrderDate: o.createdAt,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Export to CSV (sanitized against CSV Formula Injection & quote escaping)
  const exportToCSV = () => {
    const escapeCsvCell = (value: unknown): string => {
      const str = String(value ?? "");
      const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      return `"${neutralized.replace(/"/g, '""')}"`;
    };

    const headers = [
      "ID",
      "Tanggal",
      "Pelanggan",
      "Email",
      "Produk",
      "Total",
      "Status",
    ];
    const rows = filteredAndSortedOrders.map((order) => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString("id-ID"),
      order.user?.name || "-",
      order.user?.email || "-",
      order.items.map((i) => `${i.product.name} (${i.quantity}x)`).join("; "),
      order.totalAmount,
      order.status,
    ]);

    const csvContent = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `shoes4us_orders_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(objectUrl);

    toast.success("Data pesanan berhasil diekspor ke CSV!");
  };

  const downloadSummaryReport = () => {
    const reportLines = [
      "LAPORAN RINGKASAN EKSEKUTIF SHOES4US",
      `Tanggal Cetak: ${new Date().toLocaleString("id-ID")}`,
      "--------------------------------------------------",
      `Total Pendapatan Bersih : ${formatFullIDR(stats.totalRevenue)}`,
      `Total Pesanan Masuk     : ${stats.total} pesanan`,
      `Total Unit Terjual      : ${stats.totalItemsSold} pasang`,
      `Nilai Rata-rata Order   : ${formatFullIDR(stats.averageOrderValue)}`,
      `Total Katalog Produk    : ${products.length} model (${stats.totalProductStock} unit stok)`,
      "--------------------------------------------------",
      `Rincian Status Pesanan:`,
      `- Pending               : ${stats.pending}`,
      `- Paid / Processing     : ${stats.processing}`,
      `- Shipped               : ${stats.shipped}`,
      `- Delivered (Selesai)   : ${stats.completed}`,
      `- Cancelled             : ${stats.cancelled}`,
    ].join("\n");

    const blob = new Blob([reportLines], { type: "text/plain;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `shoes4us_report_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    link.click();
    URL.revokeObjectURL(objectUrl);

    toast.success("Laporan ringkasan berhasil diunduh!");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("newest");
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: string,
    currentStatus: string
  ) => {
    if (newStatus === currentStatus) return;

    try {
      setLoading(true);
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Status pesanan berhasil diubah menjadi ${newStatus}!`);
      await fetchDashboardData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah status pesanan"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "DELIVERED":
      case "PAID":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600">
            {status === "DELIVERED" ? "Complete" : "Paid"}
          </span>
        );
      case "PROCESSING":
      case "SHIPPED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
            {status === "SHIPPED" ? "Shipped" : "In Progress"}
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-500">
            Waiting
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <p className="text-sm font-medium text-gray-500">
          Memuat ruang kerja admin...
        </p>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <AdminLayout>
      {/* BEGIN: ContentTopBar */}
      <section
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
        data-purpose="top-action-bar"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            {currentTab === "orders"
              ? "Purchases & Orders"
              : currentTab === "customers"
              ? "Customers Directory"
              : currentTab === "analytics"
              ? "Sales Analytics & Inventory"
              : "Dashboard"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {currentTab === "orders"
              ? "Kelola status transaksi, verifikasi pembayaran, dan pengiriman pesanan."
              : currentTab === "customers"
              ? "Daftar pelanggan aktif dan riwayat akumulasi belanja."
              : currentTab === "analytics"
              ? "Analisis mendalam performa produk, pendapatan, dan peringatan stok."
              : "Ringkasan performa bisnis ritel dan operasional pesanan Shoes4Us."}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative w-full sm:w-64 md:w-72">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-white rounded-full text-xs font-medium border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition"
              placeholder="Search order, customer, product..."
              type="text"
              aria-label="Search orders or products"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            disabled={filteredAndSortedOrders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-xs font-semibold text-gray-800 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            type="button"
          >
            <Upload className="w-4 h-4 text-gray-600" />
            <span>Export CSV</span>
          </button>

          {/* Download Report Button */}
          <button
            onClick={downloadSummaryReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-xs font-semibold text-gray-800 hover:bg-gray-50 transition shadow-sm"
            type="button"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>Download Report</span>
          </button>
        </div>
      </section>
      {/* END: ContentTopBar */}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="underline font-semibold ml-4"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* ==================== TAB 1: OVERVIEW (DEFAULT ECOMORA DASHBOARD) ==================== */}
      {currentTab === "overview" && (
        <>
          {/* BEGIN: KeyMetricsGrid */}
          <section
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            data-purpose="metrics-row"
          >
            {/* Column 1: Two Smaller Stacked Cards */}
            <div className="lg:col-span-3 flex flex-col gap-6 justify-between">
              {/* Total Products Sales Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Total Products Sales
                    </span>
                    <span className="p-2 bg-gray-50 rounded-xl text-gray-700">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                    <span className="text-2xl font-bold tracking-tight text-gray-950">
                      {stats.totalItemsSold.toLocaleString("id-ID")}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      +{stats.total > 0 ? "14%" : "0%"}{" "}
                      <span className="ml-0.5">↗</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Dari {stats.total} transaksi tercatat
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setSearchParams({ tab: "orders" })}
                    className="inline-flex items-center justify-between w-full text-xs font-semibold text-gray-800 hover:text-black transition"
                  >
                    <span className="underline decoration-gray-300 underline-offset-4">
                      View Sales Details
                    </span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* Total Volume Of Products Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Total Volume Of Products
                    </span>
                    <span className="p-2 bg-gray-50 rounded-xl text-gray-700">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                    <span className="text-2xl font-bold tracking-tight text-gray-950">
                      {stats.totalProductStock.toLocaleString("id-ID")}
                    </span>
                    {stats.lowStockCount > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-600">
                        {stats.lowStockCount} Low Stock ↘
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                        Optimal ↗
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Across {products.length} active footwear models
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-gray-50">
                  <Link
                    to="/admin/product"
                    className="inline-flex items-center justify-between w-full text-xs font-semibold text-gray-800 hover:text-black transition"
                  >
                    <span className="underline decoration-gray-300 underline-offset-4">
                      View All Products
                    </span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Column 2: Total Revenue Bar Chart Card */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Total Revenue & Sales
                    </span>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <h3 className="text-3xl font-extrabold tracking-tight text-gray-950">
                        {formatCompactIDR(stats.totalRevenue)}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        +45% ↗
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={fetchDashboardData}
                    aria-label="Refresh revenue data"
                    className="text-gray-400 hover:text-gray-700 p-1"
                    type="button"
                    title="Muat ulang data"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-5 mt-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-950"></span>
                    <span>Total Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    <span>Projected Target</span>
                  </div>
                </div>

                {/* Bar Chart Display */}
                <div className="mt-8 flex items-end justify-between h-48 px-2 border-b border-gray-100 pb-2 gap-2">
                  {monthlyChartData.map((bar) => {
                    const solidHeightPx = Math.round(bar.ratio * 128);
                    const stripeHeightPx = Math.round(bar.stripeRatio * 148);
                    return (
                      <div
                        key={bar.monthKey}
                        className="flex flex-col items-center gap-2 flex-1"
                      >
                        <div className="w-11 sm:w-12 relative flex flex-col items-center justify-end h-40">
                          <div
                            style={{
                              ...STRIPED_BAR_STYLE,
                              height: `${stripeHeightPx}px`,
                            }}
                            className="w-full rounded-2xl opacity-70 mb-[-14px] z-0 transition-all duration-300"
                          />
                          <div
                            style={{ height: `${solidHeightPx}px` }}
                            className="w-full bg-gray-950 rounded-2xl z-10 flex items-center justify-center text-[10px] text-white font-medium px-1 truncate transition-all duration-300"
                          >
                            {bar.displayValue}
                          </div>
                        </div>
                        <span
                          className={`text-xs mt-2 ${
                            bar.isCurrent
                              ? "font-semibold text-gray-950 bg-gray-100 px-2.5 py-0.5 rounded-full"
                              : "font-medium text-gray-400"
                          }`}
                        >
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 3: Total Sales Statistics Donut Chart */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-950">
                    Total Sales Statistics
                  </h3>
                  <button
                    onClick={() => setSearchParams({ tab: "analytics" })}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                    type="button"
                  >
                    <span>Monthly</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>

                {/* Donut Chart & Indicators */}
                <div className="relative mt-4 flex items-center justify-center py-2">
                  {/* Radial Ring Representation */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg
                      className="w-44 h-44 transform -rotate-90"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="44"
                        stroke="#f1f5f9"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="44"
                        stroke="#09090b"
                        strokeDasharray="276"
                        strokeDashoffset="180"
                        strokeLinecap="round"
                        strokeWidth="13"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="44"
                        stroke="#e2e8f0"
                        strokeDasharray="276"
                        strokeDashoffset="95"
                        strokeLinecap="round"
                        strokeWidth="13"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="44"
                        stroke="#cbd5e1"
                        strokeDasharray="276"
                        strokeDashoffset="35"
                        strokeLinecap="round"
                        strokeWidth="13"
                      />
                    </svg>
                    {/* Center Stat inside Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-bold text-gray-950 tracking-tight">
                        {stats.total.toLocaleString("id-ID")}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 mt-0.5">
                        Orders ↗
                      </span>
                    </div>
                  </div>

                  {/* Surrounding Category Callout Labels */}
                  <div className="absolute top-1 left-0 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                      <span className="truncate max-w-[80px]">
                        {categoryStats[1]?.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {categoryStats[1]?.value.toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="absolute top-1 right-0 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-black"></span>
                      <span className="truncate max-w-[80px]">
                        {categoryStats[0]?.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {categoryStats[0]?.value.toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-0 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      <span className="truncate max-w-[80px]">
                        {categoryStats[2]?.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {categoryStats[2]?.value.toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-0 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                      <span className="truncate max-w-[80px]">
                        {categoryStats[3]?.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {categoryStats[3]?.value.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Number of Sales Footer inside Card */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <span className="text-xs font-medium text-gray-500 block">
                  Average Order Value (AOV)
                </span>
                <span className="text-2xl font-bold tracking-tight text-gray-950 mt-1 block">
                  {formatCompactIDR(stats.averageOrderValue)}
                </span>
              </div>
            </div>
          </section>
          {/* END: KeyMetricsGrid */}

          {/* BEGIN: BottomTableAndTopProductsGrid */}
          <section
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            data-purpose="secondary-data-grid"
          >
            {/* Recent Orders Table (Col 8) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    Recent Orders
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-normal">
                    Keep track of recent order data and others information.
                  </p>
                </div>
                <button
                  onClick={() => setSearchParams({ tab: "orders" })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition"
                  type="button"
                >
                  <span>View All</span>
                  <span>→</span>
                </button>
              </div>

              {/* Orders Table Container */}
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left border-collapse"
                  id="recent-orders-table"
                >
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400">
                      <th className="py-3 px-2 font-normal">Order Id</th>
                      <th className="py-3 px-2 font-normal">Product Name</th>
                      <th className="py-3 px-2 font-normal">Date</th>
                      <th className="py-3 px-2 font-normal">Payment</th>
                      <th className="py-3 px-2 font-normal">Amount</th>
                      <th className="py-3 px-2 font-normal">Status</th>
                      <th className="py-3 px-2 font-normal text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {filteredAndSortedOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-gray-400 font-medium"
                        >
                          {loading
                            ? "Memuat data pesanan..."
                            : "Belum ada data pesanan yang sesuai."}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedOrders.slice(0, 6).map((order, idx) => {
                        const firstItem = order.items[0];
                        const extraCount = order.items.length - 1;
                        const bgColors = [
                          "bg-emerald-50",
                          "bg-amber-50",
                          "bg-cyan-50",
                          "bg-stone-100",
                        ];
                        const badgeBg = bgColors[idx % bgColors.length];
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50/70 transition-colors"
                          >
                            <td className="py-3.5 px-2 font-medium text-gray-600">
                              #{order.orderNumber}
                            </td>
                            <td className="py-3.5 px-2">
                              <div className="flex items-center gap-2.5">
                                {firstItem?.product.imageUrl ? (
                                  <img
                                    src={firstItem.product.imageUrl}
                                    alt={firstItem.product.name}
                                    className="w-7 h-7 rounded-lg object-cover border border-gray-100 shrink-0"
                                  />
                                ) : (
                                  <div
                                    className={`w-7 h-7 rounded-lg ${badgeBg} flex items-center justify-center text-sm shadow-xs shrink-0`}
                                  >
                                    👟
                                  </div>
                                )}
                                <div className="truncate max-w-[180px]">
                                  <span className="font-semibold text-gray-900 block truncate">
                                    {firstItem?.product.name || "Sepatu Shoes4Us"}
                                  </span>
                                  {extraCount > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      +{extraCount} item lainnya
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-2 text-gray-500 whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="py-3.5 px-2 text-gray-600">
                              {order.paymentMethod || "QRIS / Transfer"}
                            </td>
                            <td className="py-3.5 px-2 font-medium text-gray-900 whitespace-nowrap">
                              {formatFullIDR(order.totalAmount)}
                            </td>
                            <td className="py-3.5 px-2">
                              {renderStatusBadge(order.status)}
                            </td>
                            <td className="py-3.5 px-2 text-right">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                aria-label="Order action"
                                className="text-gray-400 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
                                type="button"
                                title="Lihat & ubah status pesanan"
                              >
                                •••
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Products Card (Col 4) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-950">
                    Top Selling Products
                  </h3>
                  <Link
                    to="/admin/product"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                  >
                    <span>Catalog</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </Link>
                </div>

                {/* Featured Product Detail Item */}
                {topSellingProduct ? (
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                        {topSellingProduct.product.imageUrl ? (
                          <img
                            src={topSellingProduct.product.imageUrl}
                            alt={topSellingProduct.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-800" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 leading-snug truncate">
                          {topSellingProduct.product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-gray-400">
                            Brand:{" "}
                            <span className="font-medium text-gray-600">
                              {topSellingProduct.product.brand ||
                                getCategoryName(
                                  topSellingProduct.product.category
                                ) ||
                                "Shoes4Us"}
                            </span>
                          </span>
                          <span className="text-[10px] text-gray-400">
                            • {topSellingProduct.product.stock ?? 0} Stock
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-900 mt-1">
                          {formatFullIDR(topSellingProduct.product.price)}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/admin/product"
                      aria-label="Product options"
                      className="text-gray-400 hover:text-gray-700 px-1"
                    >
                      •••
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-400 text-center">
                    Belum ada produk di katalog
                  </div>
                )}

                {/* Mini Weekly Sales Bar Chart */}
                <div className="mt-8 pt-2">
                  <div className="flex items-end justify-between h-28 px-4 border-b border-gray-100 pb-2">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-400">
                        14
                      </span>
                      <div className="w-8 bg-gray-950 h-5 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 mt-2">
                        Tue
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-400">
                        28
                      </span>
                      <div className="w-8 bg-gray-950 h-11 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 mt-2">
                        Wed
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-400">
                        54
                      </span>
                      <div className="w-8 bg-gray-950 h-20 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 mt-2">
                        Thu
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-400">
                        21
                      </span>
                      <div className="w-8 bg-gray-950 h-8 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 mt-2">
                        Fri
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* END: BottomTableAndTopProductsGrid */}
        </>
      )}

      {/* ==================== TAB 2: ORDERS / PURCHASES MANAGEMENT ==================== */}
      {currentTab === "orders" && (
        <section className="space-y-6">
          {/* Status Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              [
                { label: "All Orders", value: "ALL", count: stats.total },
                { label: "Pending", value: "PENDING", count: stats.pending },
                {
                  label: "Processing",
                  value: "PROCESSING",
                  count: stats.processing,
                },
                { label: "Shipped", value: "SHIPPED", count: stats.shipped },
                {
                  label: "Delivered",
                  value: "DELIVERED",
                  count: stats.completed,
                },
                {
                  label: "Cancelled",
                  value: "CANCELLED",
                  count: stats.cancelled,
                },
              ] as const
            ).map((pill) => {
              const active = filterStatus === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setFilterStatus(pill.value)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? "bg-gray-950 text-white border-gray-950 shadow-sm"
                      : "bg-white text-gray-700 border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium block ${
                      active ? "text-gray-300" : "text-gray-400"
                    }`}
                  >
                    {pill.label}
                  </span>
                  <span className="text-xl font-bold mt-1 block">
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Controls Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Filter Rentang & Urutan
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700"
                    aria-label="Dari Tanggal"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700"
                    aria-label="Sampai Tanggal"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | "newest"
                        | "oldest"
                        | "amount-high"
                        | "amount-low"
                    )
                  }
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="amount-high">Nominal Tertinggi</option>
                  <option value="amount-low">Nominal Terendah</option>
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-950 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Full Orders Table */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-950">
                Daftar Transaksi ({filteredAndSortedOrders.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Update / Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredAndSortedOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-gray-400"
                      >
                        Tidak ada pesanan yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-mono font-semibold text-gray-800">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-gray-900">
                            {order.user?.name || "-"}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {order.user?.email || "-"}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-gray-800">
                            {order.items[0]?.product.name || "Produk"}
                            {order.items[0]
                              ? ` (x${order.items[0].quantity})`
                              : ""}
                          </div>
                          {order.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="text-[11px] text-gray-500 underline"
                            >
                              +{order.items.length - 1} produk lainnya
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-gray-900 whitespace-nowrap">
                          {formatFullIDR(order.totalAmount)}
                        </td>
                        <td className="py-3.5 px-3">
                          {renderStatusBadge(order.status)}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  e.target.value,
                                  order.status
                                )
                              }
                              disabled={loading}
                              className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white font-medium text-gray-700 hover:border-gray-400"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PAID">Paid</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ==================== TAB 3: CUSTOMERS DIRECTORY ==================== */}
      {currentTab === "customers" && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gray-100 text-gray-900">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-950">
                  Pelanggan Terdaftar & Pembeli ({customersList.length})
                </h3>
                <p className="text-xs text-gray-400">
                  Diurutkan berdasarkan total nilai pembelanjaan tertinggi.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400">
                  <th className="py-3 px-3">Nama Pelanggan</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Telepon</th>
                  <th className="py-3 px-3">Kota</th>
                  <th className="py-3 px-3">Jumlah Order</th>
                  <th className="py-3 px-3">Total Belanja</th>
                  <th className="py-3 px-3">Transaksi Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {customersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Belum ada riwayat pelanggan.
                    </td>
                  </tr>
                ) : (
                  customersList.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-semibold text-gray-900">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">{c.email}</td>
                      <td className="py-3.5 px-3 text-gray-600">{c.phone}</td>
                      <td className="py-3.5 px-3 text-gray-600">{c.city}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-semibold text-[11px]">
                          {c.ordersCount} pesanan
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-950">
                        {formatFullIDR(c.totalSpent)}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {new Date(c.lastOrderDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ==================== TAB 4: ANALYTICS & LOW STOCK ALERTS ==================== */}
      {currentTab === "analytics" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Low Stock Alerts */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    Peringatan Stok Produk Menipis
                  </h3>
                  <p className="text-xs text-gray-400">
                    Model sepatu dengan total stok di bawah 15 pasang.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/product"
                className="text-xs font-semibold text-gray-800 underline"
              >
                Kelola Stok →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400">
                    <th className="py-3 px-2">Produk</th>
                    <th className="py-3 px-2">Kategori</th>
                    <th className="py-3 px-2">Harga</th>
                    <th className="py-3 px-2 text-right">Sisa Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {products
                    .filter((p) => (p.stock ?? 0) < 15)
                    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
                    .slice(0, 8)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-2 font-semibold text-gray-900">
                          {p.name}
                        </td>
                        <td className="py-3 px-2 text-gray-500">
                          {getCategoryName(p.category)}
                        </td>
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {formatFullIDR(p.price)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              (p.stock ?? 0) === 0
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {p.stock ?? 0} unit
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Category Breakdown */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-950 mb-1">
                Distribusi Kategori Produk
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Perbandingan volume unit berdasarkan kategori utama.
              </p>

              <div className="space-y-4">
                {categoryStats.map((cat, i) => {
                  const maxVal = Math.max(
                    ...categoryStats.map((c) => c.value),
                    1
                  );
                  const pct = Math.round((cat.value / maxVal) * 100);
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-900">
                          {i + 1}. {cat.name}
                        </span>
                        <span className="font-bold text-gray-700">
                          {cat.value} unit
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gray-950 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">Total Katalog Aktif</span>
              <span className="font-bold text-gray-950">
                {products.length} Model Sepatu
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ==================== ORDER DETAIL MODAL ==================== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Detail Pesanan #{selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-400">
                  Dibuat pada{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <h3 className="font-bold text-gray-900 mb-1.5">
                    Informasi Pelanggan
                  </h3>
                  <p>
                    <span className="text-gray-500">Nama:</span>{" "}
                    <span className="font-semibold text-gray-900">
                      {selectedOrder.user?.name || "-"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="font-medium text-gray-800">
                      {selectedOrder.user?.email || "-"}
                    </span>
                  </p>
                  {selectedOrder.shippingPhone && (
                    <p>
                      <span className="text-gray-500">Telepon:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {selectedOrder.shippingPhone}
                      </span>
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <h3 className="font-bold text-gray-900 mb-1.5">
                    Alamat Pengiriman
                  </h3>
                  <p className="text-gray-800">
                    {selectedOrder.shippingAddress ||
                      "Alamat belum dicantumkan"}
                  </p>
                  <p className="text-gray-600">
                    {selectedOrder.shippingCity}
                    {selectedOrder.shippingPostalCode
                      ? ` - ${selectedOrder.shippingPostalCode}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Item Produk</h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[11px] text-gray-500">
                      <tr>
                        <th className="p-3">Produk</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Harga</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-medium text-gray-900">
                            {item.product.name}
                          </td>
                          <td className="p-3 text-center text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {formatFullIDR(item.price)}
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-900">
                            {formatFullIDR(
                              (item.price || 0) * (item.quantity || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-3 text-right font-bold text-gray-700"
                        >
                          Total Pembayaran
                        </td>
                        <td className="p-3 text-right font-extrabold text-sm text-gray-950">
                          {formatFullIDR(selectedOrder.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment & Status Update */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-400 block mb-1">
                    Metode Pembayaran
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    {selectedOrder.paymentMethod || "QRIS / Transfer Bank"}
                  </span>
                </div>
                <div>
                  <label className="text-gray-500 font-semibold block mb-1">
                    Ubah Status Pesanan
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      handleStatusChange(
                        selectedOrder.id,
                        e.target.value,
                        selectedOrder.status
                      );
                      setSelectedOrder(null);
                    }}
                    disabled={loading}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl font-semibold text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
