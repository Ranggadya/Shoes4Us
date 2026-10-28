import { useEffect, useState } from "react";
import OrderTracking from "@/components/OrderTracking";
import { useAuth } from "@/context/AuthContext";
import EmptyOrders from "@/components/empty-states/EmptyOrders";

type OrderStatus = "PENDING" | "PROCESSING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type OrderItem = {
  id: string;
  product: {
    id: string;
    name: string;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  success: boolean;
  data: { orders: Order[] };
};

export default function OrderStatusPage() {
  const { user, token, isLoading: authLoading } = useAuth();
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
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error?.message ?? "Gagal memuat pesanan.");
        }
        const data: OrdersResponse = await response.json();
        setOrders(data.data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      void fetchOrders();
    }
  }, [user, token, authLoading]);

  const mapStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "Menunggu Pembayaran";
      case "PROCESSING":
        return "Diproses";
      case "PAID":
        return "Pembayaran Berhasil";
      case "SHIPPED":
        return "Sedang Dikirim";
      case "DELIVERED":
        return "Selesai";
      case "CANCELLED":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Status Pesanan</h1>

        {authLoading || loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Memuat pesanan Anda...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
            {error}
          </div>
        ) : !user ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Silakan login untuk melihat status pesanan Anda.
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          orders.map((order) => {
            const productName =
              order.items.length > 0
                ? order.items.length === 1
                  ? order.items[0].product.name
                  : `${order.items[0].product.name} +${order.items.length - 1} item lainnya`
                : "Produk Shoes4Us";

            return (
              <OrderTracking
                key={order.id}
                orderId={order.orderNumber || order.id}
                productName={productName}
                currentStatus={order.status}
                statusLabel={mapStatusLabel(order.status)}
                estimatedArrival={
                  order.status === "SHIPPED"
                    ? "2 - 3 hari lagi"
                    : order.status === "PROCESSING"
                    ? "Segera dikirim"
                    : undefined
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}
