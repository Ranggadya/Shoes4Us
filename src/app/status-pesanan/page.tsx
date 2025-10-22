"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client"; // ✅ Import dari Prisma
import OrderTracking from "@/components/OrderTracking";
import { useAuth } from "@/components/AuthProvider";
import EmptyOrders from "@/components/empty-states/EmptyOrders";

type OrderItem = {
  id: string;
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  shippingAddress?: string;
  shippingCity?: string;
  paymentMethod?: string;
};

type OrdersResponse = {
  success: boolean;
  data: {
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  };
};

export default function StatusPesananPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      console.log("🔍 [StatusPesanan] Fetching orders...");
      console.log("🔑 [StatusPesanan] User:", user ? "Ada" : "Tidak ada");
      console.log("🔑 [StatusPesanan] Token:", token ? "Ada" : "Tidak ada");

      if (!user || !token) {
        console.log("⚠️ [StatusPesanan] User/token tidak ada, skip fetch");
        setOrders([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log("📤 [StatusPesanan] Mengirim request ke /api/orders");
        
        const response = await fetch("/api/orders", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Kirim token!
          },
          cache: "no-store",
        });

        console.log("📥 [StatusPesanan] Response status:", response.status);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          console.error("❌ [StatusPesanan] Response error:", body);
          throw new Error(body?.message ?? "Gagal memuat pesanan.");
        }

        const data = (await response.json()) as OrdersResponse;
        console.log("📦 [StatusPesanan] Response data:", data);
        console.log("📦 [StatusPesanan] Data.data:", data.data);
        
        // ✅ Handle jika struktur berbeda
        const ordersList = data.data?.orders || [];
        console.log("📦 [StatusPesanan] Jumlah orders:", ordersList.length);

        setOrders(ordersList);
      } catch (err) {
        console.error("❌ [StatusPesanan] Error:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, user, token]);

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      PENDING: "Menunggu Pembayaran",
      PROCESSING: "Sedang Diproses",
      PAID: "Sudah Dibayar",
      SHIPPED: "Dalam Pengiriman",
      DELIVERED: "Terkirim",
      CANCELLED: "Dibatalkan",
    };
    return labels[status] || status;
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-6">
        <p className="text-gray-600">Memuat data...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-10 px-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Silakan login untuk melihat riwayat pesanan Anda.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Status Pesanan Anda
      </h1>

      {loading ? (
        <p className="text-gray-600">Memuat status pesanan...</p>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Coba Lagi
          </button>
        </div>
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
                statusLabel={getStatusLabel(order.status)}
                estimatedArrival={null}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}