import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Keranjang Belanja Kosong
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        Belum ada produk yang ditambahkan ke keranjang. 
        Mulai belanja dan temukan sepatu impian Anda!
      </p>

      <Link
        href="/product"
        className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition font-medium inline-flex items-center gap-2"
      >
        <ShoppingBag className="w-5 h-5" />
        <span>Mulai Belanja</span>
      </Link>

      <div className="mt-10 text-sm text-gray-500">
        <p>Tips: Cari sepatu berdasarkan kategori atau gunakan fitur pencarian</p>
      </div>
    </div>
  );
}
