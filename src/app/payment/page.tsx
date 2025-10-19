"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartContext";
import { formatCurrency } from "@/lib/utils/format";

const DELIVERY_FEE = 15000;

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, isLoading, error, refresh } = useCart();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("Kartu Kredit");
  const [showPopup, setShowPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = cart?.totals.subtotal ?? 0;
  const total = subtotal === 0 ? 0 : subtotal + DELIVERY_FEE;

  const handlePay = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      router.push("/login");
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
    if (!cart || cart.items.length === 0) {
      setFormError("Keranjang masih kosong.");
      setShowPopup(false);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: address,
          shippingCity: city,
          shippingPostalCode: postalCode,
          shippingPhone: phone,
          paymentMethod: method,
        }),
      });

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? body?.message ?? "Gagal membuat pesanan.");
      }

      const { data: orderData } = await orderRes.json();
      const payRes = await fetch(`/api/payment/${orderData.id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!payRes.ok) {
        const body = await payRes.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? body?.message ?? "Gagal memproses pembayaran.");
      }

      const { paymentUrl } = await payRes.json();
      window.location.href = paymentUrl;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal memproses pesanan.");
    } finally {
      setSubmitting(false);
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-center p-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Butuh Login</h1>
          <p className="text-gray-600">
            Silakan login terlebih dahulu sebelum melanjutkan pembayaran.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Masuk Sekarang
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Memuat keranjang...</p>
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
    <div className="min-h-screen bg-white text-black p-6 max-w-4xl mx-auto relative">
      <h1 className="text-3xl font-bold mb-6">Pembayaran</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Informasi Pembeli</h2>
          <form onSubmit={handlePay} className="space-y-3">
            <div>
              <label className="block text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div>
              <label className="block text-gray-700">Alamat Pengiriman</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border rounded-lg p-2"
                rows={3}
                placeholder="Masukkan alamat lengkap"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700">Kota</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="Contoh: Bandung"
                />
              </div>
              <div>
                <label className="block text-gray-700">Kode Pos</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="40115"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700">Nomor Telepon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-gray-700">Metode Pembayaran</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option>Kartu Kredit</option>
                <option>QRIS</option>
                <option>Transfer Bank</option>
              </select>
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition-colors mt-4 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Pengiriman</span>
              <span>{subtotal === 0 ? "-" : formatCurrency(DELIVERY_FEE)}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4 mb-4">
            <span>Total Bayar</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {showPopup && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowPopup(false)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto relative">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Detail Pembayaran
              </h2>

              {method === "Kartu Kredit" && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nomor Kartu (XXXX XXXX XXXX XXXX)"
                    className="w-full border rounded-lg p-2"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-1/2 border rounded-lg p-2"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      className="w-1/2 border rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              {method === "QRIS" && (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">
                    Scan QR Code berikut untuk melakukan pembayaran:
                  </p>
                  <div className="border rounded-lg p-4 bg-gray-100 inline-block">
                    <Image
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAYMENT-SHOES4U"
                      alt="QR Code"
                      width={150}
                      height={150}
                      className="mx-auto"
                    />
                  </div>
                </div>
              )}

              {method === "Transfer Bank" && (
                <div>
                  <p className="text-gray-700 mb-1">
                    Silakan transfer ke Virtual Account berikut:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg mt-2">
                    <p className="font-semibold">Bank BCA</p>
                    <p>
                      No. VA:{" "}
                      <span className="font-mono">1234567890123456</span>
                    </p>
                    <p>a.n. Shoes4Us</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleConfirm}
                className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition-colors mt-6 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
              </button>

              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
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
