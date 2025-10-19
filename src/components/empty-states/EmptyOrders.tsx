import Link from "next/link";
import { Package } from "lucide-react";

export default function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Belum Ada Pesanan
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        Anda belum memiliki riwayat pesanan. 
        Mulai berbelanja dan buat pesanan pertama Anda!
      </p>

      <Link
        href="/product"
        className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition font-medium inline-flex items-center gap-2"
      >
        <Package className="w-5 h-5" />
        <span>Jelajahi Produk</span>
      </Link>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm text-gray-500 max-w-2xl">
        <div>
          <div className="font-semibold text-gray-700 mb-1">📦 Gratis Ongkir</div>
          <p>Untuk pembelian minimal Rp 500.000</p>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-1">🔄 Retur Mudah</div>
          <p>Retur gratis dalam 7 hari</p>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-1">✅ Original</div>
          <p>100% produk original</p>
        </div>
      </div>
    </div>
  );
}
