import { useState } from "react";
import { AlertCircle, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";
import type { CustomerSummaryRow } from "./dashboard-utils";

interface DashboardCustomersTabProps {
  customers: CustomerSummaryRow[];
  usersLoadWarning: string | null;
}

export default function DashboardCustomersTab({
  customers,
  usersLoadWarning,
}: DashboardCustomersTabProps) {
  const [segmentFilter, setSegmentFilter] = useState<
    "all" | "buyers" | "no_orders"
  >("all");

  const visibleCustomers = customers.filter((c) => {
    if (segmentFilter === "buyers") return c.ordersCount > 0;
    if (segmentFilter === "no_orders") return c.ordersCount === 0;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-950">
            Direktori Pelanggan & Akun Terdaftar
          </h2>
          <p className="text-xs text-gray-600 mt-0.5 tabular-nums">
            Total {customers.length} pelanggan gabungan dari daftar akun dan
            riwayat transaksi
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter segmen pelanggan"
        >
          {[
            { id: "all" as const, label: `Semua (${customers.length})` },
            {
              id: "buyers" as const,
              label: `Pernah Belanja (${customers.filter((c) => c.ordersCount > 0).length})`,
            },
            {
              id: "no_orders" as const,
              label: `Belum Belanja (${customers.filter((c) => c.ordersCount === 0).length})`,
            },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              aria-pressed={segmentFilter === pill.id}
              onClick={() => setSegmentFilter(pill.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition tabular-nums ${
                segmentFilter === pill.id
                  ? "bg-gray-950 text-white border-gray-950"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {usersLoadWarning && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{usersLoadWarning}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {visibleCustomers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-700">
              Belum ada data pelanggan untuk filter ini
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  <th className="py-3.5 px-5">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4 text-right">Pesanan</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja</th>
                  <th className="py-3.5 px-5 text-right">Aktivitas Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.key} className="hover:bg-gray-50/70">
                    <td className="py-4 px-5">
                      <p className="font-bold text-gray-950">{customer.name}</p>
                      <p className="text-[11px] text-gray-600">{customer.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          customer.isRegistered
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {customer.isRegistered
                          ? `Terdaftar (${customer.role})`
                          : "Riwayat Pesanan"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-900 tabular-nums">
                      {customer.ordersCount}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-950 tabular-nums">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="py-4 px-5 text-right text-gray-600 tabular-nums">
                      {formatDate(customer.lastActivityAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
