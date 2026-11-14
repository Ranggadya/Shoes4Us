import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import type { Product } from "@/types";
import { formatCurrency, getCategoryName } from "@/utils/format";
import type {
  MonthlyRevenuePoint,
  TopSellingProduct,
} from "./dashboard-utils";

interface DashboardAnalyticsTabProps {
  monthlySeries: MonthlyRevenuePoint[];
  lowStockProducts: Product[];
  topProducts: TopSellingProduct[];
}

export default function DashboardAnalyticsTab({
  monthlySeries,
  lowStockProducts,
  topProducts,
}: DashboardAnalyticsTabProps) {
  const hasRevenueData = monthlySeries.some((m) => m.revenue > 0);
  const total6MonthRevenue = monthlySeries.reduce(
    (sum, m) => sum + m.revenue,
    0
  );

  return (
    <div className="space-y-6">
      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Pendapatan Aktual 6 Bulan Terakhir
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Akumulasi transaksi non-batal per bulan kalender
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-gray-600">
              Total 6 Bulan
            </p>
            <p className="text-lg font-extrabold text-gray-950 tabular-nums">
              {formatCurrency(total6MonthRevenue)}
            </p>
          </div>
        </div>

        {!hasRevenueData ? (
          <div className="h-56 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
            <BarChart3 className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
            Belum ada pendapatan tercatat dalam 6 bulan terakhir.
          </div>
        ) : (
          <div
            className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6"
            role="img"
            aria-label="Grafik pendapatan bulanan 6 bulan terakhir"
          >
            {monthlySeries.map((point) => (
              <div
                key={point.monthKey}
                className="flex-1 flex flex-col items-center justify-end h-full gap-2"
              >
                <span className="text-[11px] font-semibold text-gray-700 tabular-nums text-center">
                  {point.revenue > 0
                    ? `${Math.round(point.revenue / 1000).toLocaleString("id-ID")}rb`
                    : "0"}
                </span>
                <div className="w-full max-w-[56px] h-36 bg-gray-100 rounded-xl flex items-end overflow-hidden p-1">
                  <div
                    title={`${point.label} (${point.monthKey}): ${formatCurrency(point.revenue)} (${point.ordersCount} pesanan)`}
                    style={{ height: `${point.heightPct}%` }}
                    className="w-full rounded-lg bg-gray-950 transition-all"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Peringatan Stok Menipis
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Produk dengan sisa stok di bawah 10 unit
              </p>
            </div>
            <Link
              to="/admin/product"
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-900 hover:bg-gray-200 transition"
            >
              <span>Kelola Stok</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
              Tidak ada produk stok rendah yang cocok.
            </div>
          ) : (
            <ul className="space-y-3">
              {lowStockProducts.slice(0, 8).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle
                      className="w-4 h-4 text-amber-700 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-950 truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {getCategoryName(p.category)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-rose-700 tabular-nums shrink-0">
                    Sisa {p.stock ?? 0} unit
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Performing Products */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-950">
              Performa Produk Terlaris
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Kontribusi unit terjual dan pendapatan aktual
            </p>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
              Belum ada penjualan produk tercatat.
            </div>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((item, idx) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-gray-950 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-950 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-gray-950 tabular-nums">
                      {item.qtySold} unit
                    </p>
                    <p className="text-[11px] text-gray-600 tabular-nums">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
