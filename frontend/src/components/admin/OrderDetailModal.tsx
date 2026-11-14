import { useEffect, useId, useRef, useState } from "react";
import { Download, MapPin, Package, Phone, Truck, X } from "lucide-react";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import type { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  ORDER_STATUS_META,
  downloadOrderReceiptTxt,
  getAllowedStatusOptions,
  getOrderItems,
} from "./dashboard-utils";

interface OrderDetailModalProps {
  order: Order | null;
  isUpdating: boolean;
  onClose: () => void;
  onRequestStatusUpdate: (order: Order, nextStatus: OrderStatus) => Promise<boolean>;
}

export default function OrderDetailModal({
  order,
  isUpdating,
  onClose,
  onRequestStatusUpdate,
}: OrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PENDING");
  const titleId = useId();
  const statusSelectId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  useDialogFocusTrap({
    isOpen: Boolean(order),
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeBtnRef,
    canClose: !isUpdating,
  });

  if (!order) return null;

  const items = getOrderItems(order);
  const statusMeta = ORDER_STATUS_META[order.status];
  const allowedOptions = getAllowedStatusOptions(order.status);
  const hasStatusChange = selectedStatus !== order.status;

  const handleApplyStatus = async () => {
    if (!hasStatusChange || isUpdating) return;
    const succeeded = await onRequestStatusUpdate(order, selectedStatus);
    if (succeeded) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-[1px]"
      onClick={() => {
        if (!isUpdating) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-2xl rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  id={titleId}
                  className="text-lg font-bold text-gray-950 tabular-nums"
                >
                  Pesanan #{order.orderNumber || order.id}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dibuat pada {formatDate(order.createdAt)} ·{" "}
                {order.user?.name || "Pelanggan"} ({order.user?.email || "-"})
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              aria-label="Tutup detail pesanan"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition disabled:opacity-50"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            {/* Shipping Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 text-gray-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-950 uppercase tracking-wider">
                    Alamat Pengiriman
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {order.shippingAddress || "-"}
                  </p>
                  <p className="text-gray-600">
                    {order.shippingCity || "-"}{" "}
                    {order.shippingPostalCode || ""}
                  </p>
                  {order.shippingPhone && (
                    <p className="inline-flex items-center gap-1 text-gray-600 tabular-nums">
                      <Phone className="w-3 h-3" aria-hidden="true" />
                      <span>{order.shippingPhone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck
                  className="w-4 h-4 text-gray-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-950 uppercase tracking-wider">
                    Kurir & Pembayaran
                  </p>
                  <p className="text-gray-700">
                    Kurir: {order.shippingCourier || "-"}
                  </p>
                  <p className="text-gray-700">
                    Metode: {order.paymentMethod || "-"}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-gray-700 tabular-nums">
                      Resi: {order.trackingNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                Daftar Produk ({items.length})
              </h3>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                  Tidak ada rincian produk pada pesanan ini.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
                  {items.map((item) => (
                    <li
                      key={String(item.id)}
                      className="flex items-center justify-between gap-4 p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name || "Produk"}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package
                              className="w-5 h-5 text-gray-400"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-950 truncate">
                            {item.product?.name || "Produk"}
                          </p>
                          <p className="text-xs text-gray-600 tabular-nums">
                            Qty: {item.quantity}
                            {item.size ? ` · Ukuran: ${item.size}` : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-950 tabular-nums shrink-0">
                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Totals */}
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim</span>
                <span className="tabular-nums font-medium text-gray-900">
                  {formatCurrency(order.shippingCost || 0)}
                </span>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon ({order.couponCode || "Kupon"})</span>
                  <span className="tabular-nums font-medium">
                    -{formatCurrency(order.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-950">
                <span>Total Bayar</span>
                <span className="tabular-nums">
                  {formatCurrency(order.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={() => downloadOrderReceiptTxt(order)}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Unduh Struk (.txt)</span>
            </button>

            <div className="flex items-center gap-2.5">
              <label htmlFor={statusSelectId} className="sr-only">
                Ubah status pesanan
              </label>
              <select
                id={statusSelectId}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                disabled={isUpdating || allowedOptions.length <= 1}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-gray-950 disabled:bg-gray-100 disabled:text-gray-500"
              >
                {allowedOptions.map((st) => (
                  <option key={st} value={st}>
                    {ORDER_STATUS_META[st].label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!hasStatusChange || isUpdating}
                onClick={() => void handleApplyStatus()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gray-950 text-white text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Menyimpan..." : "Simpan Status"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
