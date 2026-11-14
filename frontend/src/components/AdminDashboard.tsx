import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DashboardAnalyticsTab from "@/components/admin/DashboardAnalyticsTab";
import DashboardCustomersTab from "@/components/admin/DashboardCustomersTab";
import DashboardOrdersTab from "@/components/admin/DashboardOrdersTab";
import DashboardOverviewTab from "@/components/admin/DashboardOverviewTab";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import {
  buildCustomerSummaryRows,
  computeCategoryDistribution,
  computeMonthlyRevenueSeries,
  computePeriodComparison,
  computeTopSellingProducts,
  computeWeeklyActivityBars,
  downloadCustomersCsv,
  downloadInventoryCsv,
  downloadOrdersCsv,
} from "@/components/admin/dashboard-utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import type { AdminUserRecord, Order, OrderStatus, Product } from "@/types";
import {
  fetchAllOrders,
  fetchAllProducts,
  fetchRegisteredUsers,
  isAbortError,
} from "@/utils/admin-fetch";
import { getCategoryName } from "@/utils/format";

type DashboardTab = "overview" | "orders" | "customers" | "analytics";

interface PendingCancelRequest {
  order: Order;
  nextStatus: OrderStatus;
  resolve: (succeeded: boolean) => void;
}

const VALID_TABS: ReadonlySet<string> = new Set([
  "overview",
  "orders",
  "customers",
  "analytics",
]);

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputId = useId();

  const rawTab = new URLSearchParams(location.search).get("tab") || "overview";
  const activeTab: DashboardTab = VALID_TABS.has(rawTab)
    ? (rawTab as DashboardTab)
    : "overview";

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AdminUserRecord[]>([]);
  const [usersLoadWarning, setUsersLoadWarning] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Orders Tab Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Per-order mutation lock & detail/cancel modals
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingCancel, setPendingCancel] =
    useState<PendingCancelRequest | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const pendingCancelRef = useRef<PendingCancelRequest | null>(null);
  pendingCancelRef.current = pendingCancel;

  const isAdmin = !authLoading && user?.role === "ADMIN";

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const loadDashboardData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setUsersLoadWarning(null);
    try {
      const [ordersResult, productsResult, usersResult] =
        await Promise.allSettled([
          fetchAllOrders(signal),
          fetchAllProducts(signal),
          fetchRegisteredUsers(signal),
        ]);

      if (signal?.aborted) return;

      if (ordersResult.status === "rejected") {
        if (isAbortError(ordersResult.reason)) return;
        throw ordersResult.reason;
      }

      if (productsResult.status === "rejected") {
        if (isAbortError(productsResult.reason)) return;
        throw productsResult.reason;
      }

      setOrders(ordersResult.value);
      setProducts(productsResult.value);

      if (usersResult.status === "fulfilled") {
        setRegisteredUsers(usersResult.value);
      } else if (!isAbortError(usersResult.reason)) {
        setRegisteredUsers([]);
        setUsersLoadWarning(
          "Daftar akun terdaftar sementara tidak dapat dimuat; menampilkan pelanggan dari riwayat pesanan."
        );
      }

      setInitialLoaded(true);
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) return;
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data dashboard";
      setError(msg);
      toast.error("Gagal memuat data dashboard");
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
    void loadDashboardData(controller.signal);
    return () => controller.abort();
  }, [isAdmin, loadDashboardData]);

  // Reset pagination cleanly when order filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, dateFrom, dateTo, sortBy]);

  const handleNavigateTab = useCallback(
    (tab: DashboardTab) => {
      if (tab === "overview") {
        navigate("/admin/dashboard");
      } else {
        navigate(`/admin/dashboard?tab=${tab}`);
      }
    },
    [navigate]
  );

  const executeStatusMutation = useCallback(
    async (orderId: string, nextStatus: OrderStatus): Promise<boolean> => {
      setUpdatingOrderId(orderId);
      try {
        await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
        setOrders((prev) =>
          prev.map((ord) =>
            ord.id === orderId ? { ...ord, status: nextStatus } : ord
          )
        );
        setSelectedOrder((prev) =>
          prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev
        );
        toast.success(`Status pesanan diperbarui ke ${nextStatus}`);
        return true;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal memperbarui status pesanan"
        );
        return false;
      } finally {
        setUpdatingOrderId(null);
      }
    },
    []
  );

  const requestStatusChange = useCallback(
    (order: Order, nextStatus: OrderStatus): Promise<boolean> => {
      if (order.status === nextStatus) return Promise.resolve(true);
      if (nextStatus === "CANCELLED") {
        return new Promise<boolean>((resolve) => {
          setPendingCancel({ order, nextStatus, resolve });
        });
      }
      return executeStatusMutation(order.id, nextStatus);
    },
    [executeStatusMutation]
  );

  const handleConfirmCancelOrder = async () => {
    const req = pendingCancelRef.current;
    if (!req || confirmingCancel) return;
    setConfirmingCancel(true);
    try {
      const ok = await executeStatusMutation(req.order.id, req.nextStatus);
      setPendingCancel(null);
      req.resolve(ok);
    } finally {
      setConfirmingCancel(false);
    }
  };

  const handleDismissCancelDialog = () => {
    if (confirmingCancel) return;
    const req = pendingCancelRef.current;
    setPendingCancel(null);
    req?.resolve(false);
  };

  const sortedNewestOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  // Overview Recent Orders are isolated from Orders-tab filterStatus/date filters
  const overviewRecentOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list =
      activeTab === "overview" && q
        ? sortedNewestOrders.filter(
            (o) =>
              (o.orderNumber || o.id).toLowerCase().includes(q) ||
              (o.user?.name || "").toLowerCase().includes(q) ||
              (o.user?.email || "").toLowerCase().includes(q)
          )
        : sortedNewestOrders;
    return list.slice(0, 6);
  }, [sortedNewestOrders, activeTab, searchQuery]);

  const filteredOrders = useMemo(() => {
    let list = [...sortedNewestOrders];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (o) =>
          (o.orderNumber || o.id).toLowerCase().includes(q) ||
          (o.user?.name || "").toLowerCase().includes(q) ||
          (o.user?.email || "").toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "ALL") {
      list = list.filter((o) => o.status === filterStatus);
    }

    if (dateFrom) {
      const startMs = new Date(`${dateFrom}T00:00:00`).getTime();
      if (!Number.isNaN(startMs)) {
        list = list.filter((o) => new Date(o.createdAt).getTime() >= startMs);
      }
    }

    if (dateTo) {
      const endMs = new Date(`${dateTo}T23:59:59.999`).getTime();
      if (!Number.isNaN(endMs)) {
        list = list.filter((o) => new Date(o.createdAt).getTime() <= endMs);
      }
    }

    switch (sortBy) {
      case "oldest":
        list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "highest":
        list.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
        break;
      case "lowest":
        list.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
        break;
      default:
        break;
    }

    return list;
  }, [sortedNewestOrders, searchQuery, filterStatus, dateFrom, dateTo, sortBy]);

  const customers = useMemo(
    () => buildCustomerSummaryRows(orders, registeredUsers),
    [orders, registeredUsers]
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const periodComparison = useMemo(
    () => computePeriodComparison(orders),
    [orders]
  );
  const weeklyBars = useMemo(() => computeWeeklyActivityBars(orders), [orders]);
  const categoryStats = useMemo(
    () => computeCategoryDistribution(orders, products),
    [orders, products]
  );
  const topProducts = useMemo(
    () => computeTopSellingProducts(orders, products, 5),
    [orders, products]
  );
  const monthlySeries = useMemo(
    () => computeMonthlyRevenueSeries(orders, 6),
    [orders]
  );

  const lowStockProducts = useMemo(() => {
    const q = activeTab === "analytics" ? searchQuery.trim().toLowerCase() : "";
    return products
      .filter((p) => typeof p.stock === "number" && p.stock < 10)
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          getCategoryName(p.category).toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  }, [products, activeTab, searchQuery]);

  const filteredTopProducts = useMemo(() => {
    if (activeTab !== "analytics" || !searchQuery.trim()) return topProducts;
    const q = searchQuery.trim().toLowerCase();
    return topProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [topProducts, activeTab, searchQuery]);

  const handleExportCsv = () => {
    if (activeTab === "customers") {
      downloadCustomersCsv(filteredCustomers);
      toast.success("Ekspor CSV pelanggan dimulai");
      return;
    }
    if (activeTab === "analytics") {
      downloadInventoryCsv(products);
      toast.success("Ekspor CSV inventaris produk dimulai");
      return;
    }
    downloadOrdersCsv(activeTab === "orders" ? filteredOrders : orders);
    toast.success("Ekspor CSV pesanan dimulai");
  };

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

  const tabMeta: Record<
    DashboardTab,
    { title: string; subtitle: string; searchPlaceholder: string; exportLabel: string }
  > = {
    overview: {
      title: "Admin Dashboard",
      subtitle: "Ringkasan performa penjualan, pesanan, dan katalog Shoes4Us.",
      searchPlaceholder: "Cari pesanan terbaru (ID, nama, email)...",
      exportLabel: "Ekspor Pesanan CSV",
    },
    orders: {
      title: "Manajemen Pesanan",
      subtitle: "Kelola status transaksi, resi pengiriman, dan filter pesanan.",
      searchPlaceholder: "Cari ID pesanan, nama pelanggan, atau email...",
      exportLabel: "Ekspor Pesanan CSV",
    },
    customers: {
      title: "Direktori Pelanggan",
      subtitle: "Daftar pelanggan terdaftar dan riwayat total belanja.",
      searchPlaceholder: "Cari nama atau email pelanggan...",
      exportLabel: "Ekspor Pelanggan CSV",
    },
    analytics: {
      title: "Analitik & Inventaris",
      subtitle: "Tren pendapatan 6 bulan, stok menipis, dan produk terlaris.",
      searchPlaceholder: "Cari produk stok rendah atau terlaris...",
      exportLabel: "Ekspor Inventaris CSV",
    },
  };

  const currentMeta = tabMeta[activeTab];

  return (
    <AdminLayout>
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">{currentMeta.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative sm:w-72">
            <label htmlFor={searchInputId} className="sr-only">
              {currentMeta.searchPlaceholder}
            </label>
            <Search
              className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentMeta.searchPlaceholder}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-950 focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!initialLoaded || loading}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-950 text-white text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{currentMeta.exportLabel}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboardData()}
            className="mt-4 min-h-[44px] px-5 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold hover:bg-gray-800 transition"
          >
            Coba Lagi
          </button>
        </div>
      ) : !initialLoaded || (loading && orders.length === 0 && products.length === 0) ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-gray-100 shadow-sm">
          <div
            aria-hidden="true"
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-950"
          />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Memuat data dashboard...
          </p>
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <DashboardOverviewTab
              orders={orders}
              products={products}
              recentOrders={overviewRecentOrders}
              totalCustomers={customers.length}
              registeredCount={registeredUsers.length}
              periodComparison={periodComparison}
              weeklyBars={weeklyBars}
              categoryStats={categoryStats}
              topProducts={topProducts}
              isRefreshing={loading}
              onRefresh={() => void loadDashboardData()}
              onNavigateTab={handleNavigateTab}
              onSelectOrder={setSelectedOrder}
            />
          )}

          {activeTab === "orders" && (
            <DashboardOrdersTab
              allOrders={orders}
              filteredOrders={filteredOrders}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              currentPage={currentPage}
              itemsPerPage={10}
              onPageChange={setCurrentPage}
              updatingOrderId={updatingOrderId}
              onStatusChange={(order, nextStatus) => {
                void requestStatusChange(order, nextStatus);
              }}
              onSelectOrder={setSelectedOrder}
              onResetFilters={() => {
                setFilterStatus("ALL");
                setDateFrom("");
                setDateTo("");
                setSortBy("newest");
              }}
            />
          )}

          {activeTab === "customers" && (
            <DashboardCustomersTab
              customers={filteredCustomers}
              usersLoadWarning={usersLoadWarning}
            />
          )}

          {activeTab === "analytics" && (
            <DashboardAnalyticsTab
              monthlySeries={monthlySeries}
              lowStockProducts={lowStockProducts}
              topProducts={filteredTopProducts}
            />
          )}
        </>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isUpdating={Boolean(selectedOrder && updatingOrderId === selectedOrder.id)}
        onClose={() => setSelectedOrder(null)}
        onRequestStatusUpdate={requestStatusChange}
      />

      {/* Cancellation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pendingCancel)}
        title="Batalkan Pesanan?"
        description={
          pendingCancel
            ? `Pesanan #${
                pendingCancel.order.orderNumber || pendingCancel.order.id
              } akan dibatalkan dan stok produk akan dikembalikan. Tindakan ini bersifat final dan tidak dapat diubah kembali.`
            : ""
        }
        confirmLabel="Ya, Batalkan Pesanan"
        cancelLabel="Kembali"
        tone="danger"
        isPending={confirmingCancel}
        onConfirm={handleConfirmCancelOrder}
        onCancel={handleDismissCancelDialog}
      />
    </AdminLayout>
  );
}
