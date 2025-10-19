"use client";

import { useEffect, useState } from "react";
import OrderTracking from "@/components/OrderTracking";
import { useAuth } from "@/components/AuthProvider";
import EmptyOrders from "@/components/empty-states/EmptyOrders";

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";

type OrderItem = {
  id: number;
  product: {
    id: number;
    name: string;
  };
};

type Order = {
  id: number;
  status: OrderStatus;
  statusLabel: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  success: boolean;
  data: { orders: Order[] };
};

export default function StatusPesananPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setOrders([]);
        setError(null);
        return;
      }

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

    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, user]);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Status Pesanan Anda
      </h1>

      {authLoading ? (
        <p className="text-gray-600">Memuat data...</p>
      ) : !user ? (
        <p className="text-gray-600">
          Silakan login untuk melihat riwayat pesanan Anda.
        </p>
      ) : loading ? (
        <p className="text-gray-600">Memuat status pesanan...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const productName =
              order.items[0]?.product.name ?? "Pesanan tanpa detail produk";

            return (
              <OrderTracking
                key={order.id}
                orderId={order.id}
                productName={productName}
                currentStatus={order.status}
                statusLabel={order.statusLabel}
                estimatedArrival={null}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
