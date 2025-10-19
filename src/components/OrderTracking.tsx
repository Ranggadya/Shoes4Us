"use client";
"use client";

import React from "react";
import { CheckCircle, Circle, Truck, Package, Home, XCircle } from "lucide-react";

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

interface OrderTrackingProps {
  orderId: string | number;
  productName: string;
  currentStatus: OrderStatus;
  statusLabel: string;
  estimatedArrival?: string | null;
}

const steps: Array<{
  status: Exclude<OrderStatus, "CANCELLED">;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { status: "PENDING", label: "Diterima", icon: Circle },
  { status: "PROCESSING", label: "Diproses", icon: Package },
  { status: "SHIPPED", label: "Dikirim", icon: Truck },
  { status: "COMPLETED", label: "Selesai", icon: Home },
];

export default function OrderTracking({
  orderId,
  productName,
  currentStatus,
  statusLabel,
  estimatedArrival,
}: OrderTrackingProps) {
  const currentStepIndex = steps.findIndex((s) => s.status === currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold">
          Pesanan #{orderId} - {productName}
        </h2>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isCancelled
              ? "bg-red-100 text-red-600"
              : currentStatus === "COMPLETED"
              ? "bg-green-100 text-green-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {isCancelled ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {statusLabel}
        </span>
      </div>

      {estimatedArrival && !isCancelled && (
        <p className="text-sm text-gray-500 mb-4">
          Estimasi tiba: {estimatedArrival}
        </p>
      )}

      <div className="flex justify-between items-center relative z-10">
        {steps.map((step, index) => {
          const isCompleted = !isCancelled && index <= currentStepIndex;
          const Icon = isCompleted ? CheckCircle : step.icon;

          return (
            <div
              key={step.status}
              className="flex flex-col items-center text-center w-1/4"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCancelled
                    ? "border-red-200 text-red-300"
                    : isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                <Icon size={20} />
              </div>
              <p
                className={`text-sm mt-2 ${
                  isCancelled
                    ? "text-red-400"
                    : isCompleted
                    ? "text-green-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="absolute top-[67px] left-0 w-full h-1 bg-gray-200">
        <div
          className={`h-1 transition-all duration-500 ${
            isCancelled ? "bg-red-400" : "bg-green-500"
          }`}
          style={{
            width: isCancelled
              ? "0%"
              : `${Math.max(0, currentStepIndex) / (steps.length - 1) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
