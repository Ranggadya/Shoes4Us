import { Link } from "react-router-dom";
import {
  ArrowRight,
  CreditCard,
  DollarSign,
  Eye,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Order, Product } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  CategoryDistributionItem,
  DailyActivityBar,
  ORDER_STATUS_META,
  PeriodComparison,
  TopSellingProduct,
  getOrderItems,
} from "./dashboard-utils";

interface DashboardOverviewTabProps {
  orders: Order[];
  products: Product[];
  recentOrders: Order[];
  totalCustomers: number;
  registeredCount: number;
  periodComparison: PeriodComparison;
  weeklyBars: DailyActivityBar[];
  categoryStats: CategoryDistributionItem[];
  topProducts: TopSellingProduct[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: "overview" | "orders" | "customers" | "analytics") => void;
  onSelectOrder: (order: Order) => void;
}

const DONUT_RADIUS = 56;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export default function DashboardOverviewTab({
  orders,
  products,
  recentOrders,
  totalCustomers,
  registeredCount,
  periodComparison,
  weeklyBars,
  categoryStats,
  topProducts,
  isRefreshing,
  onRefresh,
  onNavigateTab,
  onSelectOrder,
}: DashboardOverviewTabProps) {
  const totalRevenue = orders.reduce(
    (sum, o) => (o.status !== "CANCELLED" ? sum + (o.totalAmount || 0) : sum),
    0
  );
  const lowStockCount = products.filter(
    (p) => typeof p.stock === "number" && p.stock < 10
  ).length;
  const totalSoldUnits = categoryStats.reduce((sum, item) => sum + item.quantity, 0);
  const hasWeeklyActivity = weeklyBars.some((b) => b.orders > 0);

  let cumulativeOffset = 0;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                Total Pendapatan
              </p>
              <p className="text-2xl font-extrabold text-gray-950 mt-2 tabular-nums">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-100 text-gray-900">
              <DollarSign className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            {periodComparison.revenueGrowthPercent !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                  periodComparison.revenueGrowthPercent >= 0
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {periodComparison.revenueGrowthPercent >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {periodComparison.revenueGrowthPercent >= 0 ? "+" : ""}
                {periodComparison.revenueGrowthPercent}% (30 hari)
              </span>
            ) : (
              <span className="text-gray-600 font-medium tabular-nums">
                30 hari terakhir: {formatCurrency(periodComparison.recentRevenue)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("orders")}
          className="text-left bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:border-gray-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Pesanan</p>
              <p className="text-2xl font-extrabold text-gray-950 mt-2 tabular-nums">
                {orders.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-100 text-gray-900">
              <CreditCard className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-4 text-xs">
            {periodComparison.ordersGrowthPercent !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                  periodComparison.ordersGrowthPercent >= 0
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {periodComparison.ordersGrowthPercent >= 0 ? "+" : ""}
                {periodComparison.ordersGrowthPercent}% dibanding 30h lalu
              </span>
            ) : (
              <span className="text-gray-600 font-medium tabular-nums">
                {periodComparison.recentOrdersCount} pesanan dalam 30 hari terakhir
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab("customers")}
          className="text-left bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:border-gray-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                Basis Pelanggan
              </p>
              <p className="text-2xl font-extrabold text-gray-950 mt-2 tabular-nums">
                {totalCustomers}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-100 text-gray-900">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-600 font-medium tabular-nums">
            {registeredCount > 0
              ? `${registeredCount} akun terdaftar di sistem`
              : "Dihitung dari pembeli & pelanggan terdaftar"}
          </p>
        </button>

        <Link
          to="/admin/product"
          className="block bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:border-gray-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                Produk Katalog
              </p>
              <p className="text-2xl font-extrabold text-gray-950 mt-2 tabular-nums">
                {products.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-100 text-gray-900">
              <Package className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium tabular-nums">
            {lowStockCount > 0 ? (
              <span className="text-amber-700 font-semibold">
                {lowStockCount} produk stok rendah (&lt; 10)
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">
                Semua stok dalam kondisi aman
              </span>
            )}
          </p>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Orders Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Aktivitas Pesanan 7 Hari Terakhir
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Jumlah pesanan aktual harian selama seminggu terakhir
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("analytics")}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-900 hover:bg-gray-200 transition"
            >
              <span>Monthly Overview</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {!hasWeeklyActivity ? (
            <div className="h-48 flex items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
              Belum ada pesanan dalam 7 hari terakhir.
            </div>
          ) : (
            <div
              className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-4"
              role="img"
              aria-label="Grafik batang jumlah pesanan 7 hari terakhir"
            >
              {weeklyBars.map((bar) => (
                <div
                  key={bar.isoDate}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-[11px] font-bold text-gray-700 tabular-nums">
                    {bar.orders}
                  </span>
                  <div className="w-full max-w-[44px] h-32 bg-gray-100 rounded-xl flex items-end overflow-hidden p-1">
                    <div
                      title={`${bar.label} (${bar.isoDate}): ${bar.orders} pesanan · ${formatCurrency(bar.revenue)}`}
                      style={{ height: `${bar.heightPct}%` }}
                      className={`w-full rounded-lg transition-all ${
                        bar.isToday ? "bg-gray-950" : "bg-gray-700"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      bar.isToday
                        ? "text-gray-950 font-bold"
                        : "text-gray-600"
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Distribusi Penjualan Kategori
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Berdasarkan unit produk terjual (non-batal)
              </p>
            </div>
          </div>

          {categoryStats.length === 0 ? (
            <div className="flex-1 min-h-[192px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500 p-4 text-center">
              Belum ada transaksi penjualan per kategori.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
              <div className="relative w-36 h-36 shrink-0">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 140 140"
                  aria-label="Diagram donat distribusi kategori produk"
                >
                  <circle
                    cx="70"
                    cy="70"
                    r={DONUT_RADIUS}
                    fill="transparent"
                    stroke="#F3F4F6"
                    strokeWidth="18"
                  />
                  {categoryStats.map((cat) => {
                    const segLength =
                      (cat.quantity / Math.max(1, totalSoldUnits)) *
                      DONUT_CIRCUMFERENCE;
                    const offset = -cumulativeOffset;
                    cumulativeOffset += segLength;
                    return (
                      <circle
                        key={cat.category}
                        cx="70"
                        cy="70"
                        r={DONUT_RADIUS}
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="18"
                        strokeDasharray={`${segLength} ${DONUT_CIRCUMFERENCE}`}
                        strokeDashoffset={offset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-extrabold text-gray-950 tabular-nums">
                    {totalSoldUnits}
                  </span>
                  <span className="text-[11px] font-medium text-gray-600">
                    Unit
                  </span>
                </div>
              </div>

              <ul className="flex-1 w-full space-y-2.5 text-xs">
                {categoryStats.map((cat) => (
                  <li
                    key={cat.category}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        aria-hidden="true"
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-gray-800 truncate">
                        {cat.category}
                      </span>
                    </span>
                    <span className="font-bold text-gray-950 tabular-nums shrink-0">
                      {cat.percentage}% ({cat.quantity})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Produk Terlaris
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Volume terjual tertinggi (pesanan aktif)
              </p>
            </div>
            <Link
              to="/admin/product"
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-900 hover:bg-gray-200 transition"
            >
              <span>Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
              Belum ada produk terjual pada pesanan aktif.
            </div>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((prod, idx) => (
                <li
                  key={prod.productId}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-gray-950 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-950 truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-gray-600 truncate">
                        {prod.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-gray-950 tabular-nums">
                      {prod.qtySold} terjual
                    </p>
                    <p className="text-[11px] text-gray-600 tabular-nums">
                      {formatCurrency(prod.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Pesanan Terbaru
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                6 transaksi terbaru di toko Anda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Muat ulang data dashboard"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("orders")}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-900 hover:bg-gray-200 transition"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
              Belum ada pesanan masuk.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    <th className="py-2.5 pr-3">Pesanan</th>
                    <th className="py-2.5 px-3">Pelanggan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 pl-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {recentOrders.map((order) => {
                    const meta = ORDER_STATUS_META[order.status];
                    const itemCount = getOrderItems(order).reduce(
                      (sum, it) => sum + (Number(it.quantity) || 0),
                      0
                    );
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70">
                        <td className="py-3 pr-3 font-semibold text-gray-950 tabular-nums">
                          #{order.orderNumber || order.id}
                          <span className="block text-[11px] font-normal text-gray-600">
                            {formatDate(order.createdAt)} · {itemCount} item
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-800">
                          {order.user?.name || "Pelanggan"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-950 tabular-nums">
                          {formatCurrency(order.totalAmount || 0)}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order)}
                            aria-label={`Lihat detail pesanan ${order.orderNumber || order.id}`}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-950 hover:bg-gray-100 transition"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
