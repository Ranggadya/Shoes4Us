"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartContext";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading, refresh } = useCart();

  useEffect(() => {
    const handleCheckout = async () => {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (!cart || cart.items.length === 0) {
        router.replace("/cart");
        return;
      }

      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", 
          body: JSON.stringify({
            shippingAddress: "Alamat Pengguna", 
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Gagal memproses checkout");
        }

        const data = await res.json();

        if (data?.data?.paymentUrl) {
          toast.success("Mengalihkan ke halaman pembayaran...");
          router.replace(data.data.paymentUrl);
        } else {
          toast.success("Pesanan berhasil dibuat!");
          router.replace("/orders");
        }
        await refresh();
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat checkout"
        );
      }
    };

    if (!authLoading && !cartLoading) {
      handleCheckout();
    }
  }, [user, cart, authLoading, cartLoading, router, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Memproses checkout...</h1>
        <p className="text-gray-600">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}
