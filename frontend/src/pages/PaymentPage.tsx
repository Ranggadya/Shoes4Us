import { FormEvent, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/format";
import {
  loadSavedShippingAddress,
  saveShippingAddress,
} from "@/utils/shipping-address";
import { api } from "@/services/api";
import CouponInput, { SAVED_COUPON_STORAGE_KEY } from "@/components/CouponInput";
import CourierSelector from "@/components/CourierSelector";
import AddressBookModal from "@/components/AddressBookModal";
import type { CouponValidationResult, CourierOption } from "@/types";

const DEFAULT_COURIER: CourierOption = {
  code: "JNE-REG",
  name: "JNE Reguler",
  service: "REG",
  cost: 18000,
  estimatedDays: "2 - 3 hari",
  description: "Pengiriman reguler ke seluruh Indonesia",
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading, error, refresh } = useCart();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("Kartu Kredit");
  const [selectedCourier, setSelectedCourier] = useState<CourierOption>(DEFAULT_COURIER);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(() => {
    try {
      const saved = sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CouponValidationResult) : null;
    } catch {
      return null;
    }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const saved = loadSavedShippingAddress(user.id, user.name || "");
    setName((prev) => prev || saved.recipient || user.name || "");
    setAddress((prev) => prev || saved.address || "");
    setCity((prev) => prev || saved.city || "");
    setPostalCode((prev) => prev || saved.postalCode || "");
    setPhone((prev) => prev || saved.phone || "");
  }, [user]);

  const subtotal = cart?.totals.subtotal ?? 0;
  const shippingFee = subtotal === 0 ? 0 : selectedCourier.cost;
  const discountAmount =
    appliedCoupon && subtotal >= appliedCoupon.minOrderAmount
      ? appliedCoupon.discountType === "FREE_SHIPPING"
        ? Math.min(shippingFee, appliedCoupon.discountAmount)
        : appliedCoupon.discountAmount
      : 0;
  const total = subtotal === 0 ? 0 : Math.max(0, subtotal + shippingFee - discountAmount);

  const handlePay = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!cart || cart.items.length === 0) {
      setFormError("Keranjang masih kosong.");
      return;
    }

    if (!name || !address || !city || !postalCode || !phone) {
      setFormError("Lengkapi informasi pengiriman terlebih dahulu.");
      return;
    }

    setFormError(null);
    setShowPopup(true);
  };

  const handleConfirm = async () => {
    if (submitting || isSubmittingRef.current) return;

    if (!createdOrderId && (!cart || cart.items.length === 0)) {
      setFormError("Keranjang masih kosong.");
      setShowPopup(false);
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    try {
      let orderIdToPay = createdOrderId;

      if (!orderIdToPay) {
        try {
          const orderIdemKey = `order-${user?.id || "guest"}-${cart?.id || "cart"}-${total}`;
          const { data: orderData } = await api.post<{
            data: { order: { id: string } };
          }>(
            "/orders",
            {
              shippingAddress: address,
              shippingCity: city,
              shippingPostalCode: postalCode,
              shippingPhone: phone,
              shippingCourier: selectedCourier.name,
              shippingCost: shippingFee,
              couponCode: appliedCoupon?.code || "",
              paymentMethod: method,
            },
            {
              headers: { "Idempotency-Key": orderIdemKey },
            }
          );
          orderIdToPay = orderData.order.id;
          setCreatedOrderId(orderIdToPay);
          if (user) {
            saveShippingAddress(user.id, {
              recipient: name,
              address,
              city,
              postalCode,
              phone,
            });
          }
        } catch (err) {
          const errMsg =
            err instanceof Error ? err.message : "Gagal membuat pesanan.";
          if (errMsg.toLowerCase().includes("kosong")) {
            await refresh();
          }
          throw err;
        }
      }

      await api.post(
        "/payment",
        { orderId: orderIdToPay },
        { headers: { "Idempotency-Key": `pay-${orderIdToPay}` } }
      );

      try {
        sessionStorage.removeItem(SAVED_COUPON_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }

      await refresh();
      navigate("/status-pesanan");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal memproses pesanan.");
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Memuat data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center p-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Butuh Login</h1>
          <p className="text-gray-600">
            Silakan login terlebih dahulu sebelum melanjutkan pembayaran.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-4 min-h-[44px] px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-colors"
          >
            Masuk Sekarang
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 max-w-5xl mx-auto relative">
      <h1 className="text-3xl font-bold mb-6">Pembayaran & Pengiriman</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-neutral-900">
              Informasi Pembeli
            </h2>
            <button
              type="button"
              onClick={() => setShowAddressBook(true)}
              disabled={Boolean(createdOrderId)}
              className="min-h-[44px] text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-colors"
            >
              Pilih dari Buku Alamat
            </button>
          </div>
          <AddressBookModal
            isOpen={showAddressBook}
            userId={user.id}
            onClose={() => setShowAddressBook(false)}
            onSelect={(selected) => {
              setName(selected.recipientName || "");
              setPhone(selected.phone || "");
              setAddress(selected.streetAddress || "");
              setCity(selected.city || "");
              setPostalCode(selected.postalCode || "");
            }}
          />
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={Boolean(createdOrderId)}
                className="w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black disabled:bg-neutral-100"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">Alamat Pengiriman</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={Boolean(createdOrderId)}
                className="w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black disabled:bg-neutral-100"
                rows={3}
                placeholder="Masukkan alamat lengkap"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">Kota</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={Boolean(createdOrderId)}
                  className="w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black disabled:bg-neutral-100"
                  placeholder="Contoh: Bandung"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">Kode Pos</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={Boolean(createdOrderId)}
                  className="w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 tabular-nums focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black disabled:bg-neutral-100"
                  placeholder="40115"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">Nomor Telepon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={Boolean(createdOrderId)}
                className="w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 tabular-nums focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black disabled:bg-neutral-100"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="pt-2">
              <CourierSelector
                selectedCourier={selectedCourier}
                onSelect={setSelectedCourier}
                disabled={Boolean(createdOrderId)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">Metode Pembayaran</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={Boolean(createdOrderId)}
                className="w-full border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black disabled:bg-neutral-100"
              >
                <option>Kartu Kredit</option>
                <option>QRIS</option>
                <option>Transfer Bank</option>
              </select>
            </div>

            {formError && (
              <p className="text-sm font-medium text-red-700" role="alert">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] bg-black text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-colors mt-4 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </form>
        </div>

        <aside className="bg-neutral-50 p-6 border border-neutral-200 h-fit">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-neutral-950 mb-4 pb-3 border-b border-neutral-200">
            Ringkasan Pesanan
          </h2>

          <div className="mb-4 pb-4 border-b border-neutral-200">
            <CouponInput
              subtotal={subtotal}
              shippingFee={shippingFee}
              appliedCoupon={appliedCoupon}
              onApply={setAppliedCoupon}
              disabled={Boolean(createdOrderId)}
            />
          </div>

          <div className="space-y-2.5 mb-4 text-sm">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-neutral-950 tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>
                Ongkos Kirim ({selectedCourier.name})
                <span className="block text-xs text-neutral-500">
                  Estimasi {selectedCourier.estimatedDays}
                </span>
              </span>
              <span className="font-semibold text-neutral-950 tabular-nums">
                {subtotal === 0 ? "-" : formatCurrency(shippingFee)}
              </span>
            </div>
            {discountAmount > 0 && appliedCoupon && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Diskon Voucher ({appliedCoupon.code})</span>
                <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-extrabold text-lg border-t border-neutral-900 pt-4">
            <span>Total Bayar</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </aside>
      </div>

      {showPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowPopup(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-modal-title"
              className="bg-white border border-neutral-900 shadow-2xl p-6 w-full max-w-md mx-auto relative"
            >
              <h2 id="payment-modal-title" className="text-xl font-extrabold uppercase tracking-wider mb-2 text-center pr-8">
                Detail Pembayaran
              </h2>
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 mb-4 text-center font-medium">
                MODE SIMULASI: Anda tidak akan dikenakan biaya asli.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 p-3 mb-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Kurir Pengiriman:</span>
                  <span className="font-semibold text-neutral-900">{selectedCourier.name}</span>
                </div>
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Voucher ({appliedCoupon.code}):</span>
                    <span className="font-semibold tabular-nums">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-neutral-200 text-neutral-950">
                  <span>Total Tagihan:</span>
                  <span className="tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>

              {method === "Kartu Kredit" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nomor Kartu (XXXX XXXX XXXX XXXX)"
                    className="w-full border border-neutral-300 p-2.5 text-sm tabular-nums focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-1/2 border border-neutral-300 p-2.5 text-sm tabular-nums focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      className="w-1/2 border border-neutral-300 p-2.5 text-sm tabular-nums focus:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black"
                    />
                  </div>
                </div>
              )}

              {method === "QRIS" && (
                <div className="text-center">
                  <p className="text-sm text-neutral-600 mb-2">
                    Scan QR Code berikut untuk melakukan pembayaran:
                  </p>
                  <div className="border border-neutral-300 p-4 bg-neutral-100 inline-block">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAYMENT-SHOES4U"
                      alt="QR Code Pembayaran Shoes4Us"
                      width={150}
                      height={150}
                      className="mx-auto"
                    />
                  </div>
                </div>
              )}

              {method === "Transfer Bank" && (
                <div>
                  <p className="text-sm text-neutral-700 mb-1">
                    Silakan transfer ke Virtual Account berikut:
                  </p>
                  <div className="bg-neutral-100 border border-neutral-200 p-3 mt-2 text-sm space-y-0.5">
                    <p className="font-bold text-neutral-950">Bank BCA (SIMULASI)</p>
                    <p>
                      No. VA:{" "}
                      <span className="font-mono tabular-nums font-semibold">1234567890123456</span>
                    </p>
                    <p>a.n. Shoes4Us Official</p>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 italic text-center">
                    Cukup klik konfirmasi untuk melanjutkan simulasi order.
                  </p>
                </div>
              )}

              {formError && (
                <p className="text-sm text-red-700 mt-4 text-center bg-red-50 p-2.5 border border-red-200" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className="w-full min-h-[48px] bg-black text-white py-3 text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-colors mt-6 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
              </button>

              <button
                type="button"
                onClick={() => setShowPopup(false)}
                aria-label="Tutup detail pembayaran"
                className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-500 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black text-xl"
              >
                ×
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
