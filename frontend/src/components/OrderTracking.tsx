import React, { useState } from "react";
import { CheckCircle, Circle, Truck, Package, Home, XCircle, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import type { OrderStatus } from "@/types";

interface OrderTrackingProps {
  orderId: string | number;
  productName: string;
  currentStatus: OrderStatus;
  statusLabel: string;
  estimatedArrival?: string | null;
  trackingNumber?: string | null;
  shippingCourier?: string | null;
}

const steps: Array<{
  status: Exclude<OrderStatus, "CANCELLED">;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { status: "PENDING", label: "Diterima", description: "Pesanan tercatat", icon: Circle },
  { status: "PAID", label: "Dibayar", description: "Pembayaran terverifikasi", icon: CheckCircle },
  { status: "PROCESSING", label: "Diproses", description: "Dikemas di gudang", icon: Package },
  { status: "SHIPPED", label: "Dikirim", description: "Dalam perjalanan kurir", icon: Truck },
  { status: "DELIVERED", label: "Selesai", description: "Pesanan tiba", icon: Home },
];

export default function OrderTracking({
  orderId,
  productName,
  currentStatus,
  statusLabel,
  estimatedArrival,
  trackingNumber,
  shippingCourier,
}: OrderTrackingProps) {
  const [copied, setCopied] = useState(false);
  const currentStepIndex = steps.findIndex((s) => s.status === currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  const handleCopyResi = async () => {
    if (!trackingNumber) return;
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      toast.success("Nomor resi berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin nomor resi.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pesanan #{orderId} - {productName}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {shippingCourier && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                <Truck size={13} />
                Kurir: {shippingCourier}
              </span>
            )}
            {trackingNumber && !isCancelled && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                <span>
                  No. Resi: <strong className="font-mono">{trackingNumber}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyResi}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition text-[11px] font-semibold"
                  title="Salin Nomor Resi"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Tersalin" : "Salin Resi"}
                </button>
              </div>
            )}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium self-start sm:self-center ${
            isCancelled
              ? "bg-red-100 text-red-600"
              : currentStatus === "DELIVERED"
              ? "bg-green-100 text-green-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {isCancelled ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {statusLabel}
        </span>
      </div>

      {estimatedArrival && !isCancelled && (
        <p className="text-sm text-gray-500 mb-5">
          Estimasi tiba: <span className="font-medium text-gray-700">{estimatedArrival}</span>
        </p>
      )}

      <div className="relative pt-2">
        <div className="absolute top-7 left-0 w-full h-1 bg-gray-200">
          <div
            className={`h-1 transition-all duration-500 ${
              isCancelled ? "bg-red-400" : "bg-green-500"
            }`}
            style={{
              width: isCancelled
                ? "0%"
                : `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="flex justify-between items-start relative z-10">
          {steps.map((step, index) => {
            const isCompleted = !isCancelled && index <= currentStepIndex;
            const Icon = isCompleted ? CheckCircle : step.icon;

            return (
              <div
                key={step.status}
                className="flex flex-col items-center text-center w-1/5 px-1"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white ${
                    isCancelled
                      ? "border-red-200 text-red-300"
                      : isCompleted
                      ? "!bg-green-500 border-green-500 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <p
                  className={`text-xs sm:text-sm mt-2 ${
                    isCancelled
                      ? "text-red-400"
                      : isCompleted
                      ? "text-green-600 font-semibold"
                      : "text-gray-500 font-medium"
                  }`}
                >
                  {step.label}
                </p>
                <p className="hidden sm:block text-[11px] text-gray-400 mt-0.5">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
