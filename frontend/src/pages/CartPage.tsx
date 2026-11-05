import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/format";
import CartSkeleton from "@/components/skeletons/CartSkeleton";
import EmptyCart from "@/components/empty-states/EmptyCart";
import CouponInput, { SAVED_COUPON_STORAGE_KEY } from "@/components/CouponInput";
import type { CouponValidationResult } from "@/types";

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    isLoading,
    error,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(() => {
      try {
        const raw = sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as CouponValidationResult) : null;
      } catch {
        return null;
      }
    });

  const subtotal = cart?.totals?.subtotal ?? 0;

  useEffect(() => {
    if (appliedCoupon && subtotal > 0 && subtotal < appliedCoupon.minOrderAmount) {
      setAppliedCoupon(null);
      try {
        sessionStorage.removeItem(SAVED_COUPON_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [subtotal, appliedCoupon]);

  const discountAmount =
    appliedCoupon && subtotal >= appliedCoupon.minOrderAmount
      ? appliedCoupon.discountAmount
      : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleDecrease = async (itemId: string, current: number) => {
    if (current <= 1) return;
    try {
      await updateItemQuantity(itemId, current - 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah jumlah produk."
      );
    }
  };

  const handleIncrease = async (itemId: string, current: number) => {
    try {
      await updateItemQuantity(itemId, current + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah jumlah produk."
      );
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm("Hapus produk dari keranjang?")) return;
    try {
      await removeItem(itemId);
      toast.success("Produk dihapus dari keranjang");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus produk.");
    }
  };

  const handleClear = async () => {
    if (!confirm("Kosongkan seluruh keranjang?")) return;
    try {
      await clearCart();
      toast.success("Keranjang berhasil dikosongkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengosongkan keranjang.");
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Keranjang masih kosong.");
      return;
    }

    if (!user) {
      toast("Silakan login untuk melanjutkan pembayaran.", { icon: "🔒" });
      navigate("/login?redirect=/payment");
      return;
    }

    navigate("/payment");
  };

  return (
    <div className="bg-white text-black p-4 max-w-6xl mx-auto my-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center lg:text-left">
          KERANJANG ANDA
        </h1>
        {cart?.items.length ? (
          <button
            onClick={handleClear}
            className="text-sm text-red-600 hover:underline"
          >
            Kosongkan Keranjang
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <CartSkeleton />
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : !cart || cart.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={item.product.imageUrl || "/sepatu1.jpeg"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{item.product.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.size ? `Ukuran: ${item.size} • ` : ""}
                      Harga: {formatCurrency(item.product.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0 flex-wrap">
                  <span className="font-semibold text-sm">
                    {formatCurrency(item.lineTotal)}
                  </span>
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      className="px-4 py-2 hover:bg-gray-100 text-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
                      onClick={() => handleDecrease(item.id, item.quantity)}
                      aria-label="Kurangi jumlah"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-sm border-x border-gray-300">{item.quantity}</span>
                    <button
                      className="px-4 py-2 hover:bg-gray-100 text-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
                      onClick={() => handleIncrease(item.id, item.quantity)}
                      aria-label="Tambah jumlah"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-sm text-red-500 hover:underline px-2 py-2 min-h-[44px]"
                    onClick={() => handleRemove(item.id)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-center">
                Ringkasan Pesanan
              </h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Item</span>
                  <span>{cart?.totals?.totalItems ?? 0}</span>
                </div>
                {discountAmount > 0 && appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon ({appliedCoupon.code})</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
              </div>

              <CouponInput
                subtotal={subtotal}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
              />

              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-3 mb-3">
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition-colors text-sm min-h-[44px]"
              >
                {user ? "Lanjut ke Pembayaran →" : "Login & Lanjut ke Pembayaran →"}
              </button>
              {!user && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Keranjang Anda akan otomatis tersimpan ke akun setelah login.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
