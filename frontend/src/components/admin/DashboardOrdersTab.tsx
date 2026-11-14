import { useId } from "react";
import { ChevronLeft, ChevronRight, CreditCard, Eye } from "lucide-react";
import type { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ORDER_STATUS_LIST,
  ORDER_STATUS_META,
  getAllowedStatusOptions,
  getOrderItems,
} from "./dashboard-utils";

interface DashboardOrdersTabProps {
  allOrders: Order[];
  filteredOrders: Order[];
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  updatingOrderId: string | null;
  onStatusChange: (order: Order, nextStatus: OrderStatus) => void;
  onSelectOrder: (order: Order) => void;
  onResetFilters: () => void;
}

export default function DashboardOrdersTab({
  allOrders,
  filteredOrders,
  filterStatus,
  onFilterStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  onSortByChange,
  currentPage,
  itemsPerPage,
  onPageChange,
  updatingOrderId,
  onStatusChange,
  onSelectOrder,
  onResetFilters,
}: DashboardOrdersTabProps) {
  const statusSelectId = useId();
  const dateFromId = useId();
  const dateToId = useId();
  const sortSelectId = useId();

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const pageOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const countByStatus = ORDER_STATUS_LIST.reduce<Record<OrderStatus, number>>(
    (acc, status) => {
      acc[status] = allOrders.filter((o) => o.status === status).length;
      return acc;
    },
    {
      PENDING: 0,
      PROCESSING: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    }
  );

  const hasActiveFilters =
    filterStatus !== "ALL" || Boolean(dateFrom) || Boolean(dateTo);

  return (
    <div className="space-y-5">
      {/* Status Summary Pills */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter status pesanan"
      >
        <button
          type="button"
          onClick={() => onFilterStatusChange("ALL")}
          aria-pressed={filterStatus === "ALL"}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition tabular-nums ${
            filterStatus === "ALL"
              ? "bg-gray-950 text-white border-gray-950"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Semua ({allOrders.length})
        </button>

        {ORDER_STATUS_LIST.map((st) => {
          const meta = ORDER_STATUS_META[st];
          const active = filterStatus === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => onFilterStatusChange(st)}
              aria-pressed={active}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition tabular-nums ${
                active
                  ? meta.pillActiveClass
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {meta.label} ({countByStatus[st]})
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label
              htmlFor={statusSelectId}
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Status Pesanan
            </label>
            <select
              id={statusSelectId}
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-gray-950"
            >
              <option value="ALL">Semua Status</option>
              {ORDER_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {ORDER_STATUS_META[st].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={dateFromId}
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Dari Tanggal
            </label>
            <input
              id={dateFromId}
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-gray-950"
            />
          </div>

          <div>
            <label
              htmlFor={dateToId}
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Sampai Tanggal
            </label>
            <input
              id={dateToId}
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-gray-950"
            />
          </div>

          <div>
            <label
              htmlFor={sortSelectId}
              className="block text-xs font-semibold text-gray-700 mb-1.5"
            >
              Urutkan
            </label>
            <select
              id={sortSelectId}
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-gray-950"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Nilai Tertinggi</option>
              <option value="lowest">Nilai Terendah</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-600 tabular-nums">
              Menampilkan {filteredOrders.length} pesanan cocok
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              className="min-h-[36px] px-3 py-1 rounded-lg font-semibold text-gray-800 hover:bg-gray-100 transition"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {pageOrders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <CreditCard
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-700">
              Tidak ada pesanan yang sesuai filter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  <th className="py-3.5 px-5">No. Pesanan</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4">Ubah Status</th>
                  <th className="py-3.5 px-5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {pageOrders.map((order) => {
                  const isRowUpdating = updatingOrderId === order.id;
                  const allowedOptions = getAllowedStatusOptions(order.status);
                  const isTerminal = allowedOptions.length <= 1;
                  const itemCount = getOrderItems(order).reduce(
                    (sum, it) => sum + (Number(it.quantity) || 0),
                    0
                  );

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70">
                      <td className="py-4 px-5">
                        <p className="font-bold text-gray-950 tabular-nums">
                          #{order.orderNumber || order.id}
                        </p>
                        <p className="text-[11px] text-gray-600 tabular-nums mt-0.5">
                          {itemCount} item · {order.shippingCourier || "Reguler"}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">
                          {order.user?.name || "Pelanggan"}
                        </p>
                        <p className="text-[11px] text-gray-600">
                          {order.user?.email || "-"}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-gray-700 tabular-nums">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-950 tabular-nums">
                        {formatCurrency(order.totalAmount || 0)}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          aria-label={`Ubah status pesanan ${order.orderNumber || order.id}`}
                          value={order.status}
                          disabled={isRowUpdating || isTerminal}
                          onChange={(e) =>
                            onStatusChange(order, e.target.value as OrderStatus)
                          }
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-gray-950 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          {allowedOptions.map((st) => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_META[st].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order)}
                          aria-label={`Lihat detail pesanan ${order.orderNumber || order.id}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-950 hover:bg-gray-100 transition"
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

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 text-xs">
            <p className="text-gray-600 tabular-nums">
              Halaman <span className="font-bold text-gray-950">{safePage}</span>{" "}
              dari <span className="font-bold text-gray-950">{totalPages}</span>{" "}
              ({filteredOrders.length} pesanan)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => onPageChange(safePage - 1)}
                aria-label="Halaman sebelumnya"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => onPageChange(safePage + 1)}
                aria-label="Halaman berikutnya"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
