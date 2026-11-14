import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center border border-neutral-200 bg-neutral-50/50 py-16 px-6 text-center">
      <div className="w-20 h-20 border border-neutral-300 bg-white flex items-center justify-center mb-6">
        <ShoppingBag className="w-9 h-9 text-neutral-800" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
        Keranjang Belanja Kosong
      </h2>

      <p className="text-neutral-600 max-w-md mb-8 text-sm sm:text-base">
        Belum ada produk yang ditambahkan ke keranjang. Mulai belanja dan
        temukan sepatu pilihan Anda di koleksi Shoes4Us.
      </p>

      <Link
        to="/product"
        className="min-h-[44px] bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.12em] hover:bg-neutral-800 transition-colors inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
        <span>Mulai Belanja</span>
      </Link>

      <p className="mt-8 text-xs sm:text-sm text-neutral-600">
        Tips: Cari sepatu berdasarkan kategori atau gunakan fitur pencarian di bagian atas.
      </p>
    </div>
  );
}
