"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPaymentPage() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6">
      <div className="max-w-md">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-600 mb-6">
          Terima kasih telah berbelanja di{" "}
          <span className="font-semibold">Shoes Commerce</span>. Pesanan Anda
          sedang diproses dan akan segera dikirim.
        </p>
        {method && (
          <p className="text-sm text-gray-500 mb-6">
            Metode pembayaran: <span className="font-medium">{method}</span>
          </p>
        )}
        <Link
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
