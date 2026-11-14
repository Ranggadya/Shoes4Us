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

      <div className="mt-8 w-full max-w-md border-t border-neutral-200 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-700 mb-3">
          Jelajahi Kategori Populer
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { label: "Running", to: "/product?category=running" },
            { label: "Sneakers", to: "/product?category=sneakers" },
            { label: "Lifestyle", to: "/product?category=lifestyle" },
          ].map((cat) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="min-h-[44px] min-w-[44px] px-4 py-2 border border-neutral-300 bg-white text-xs font-bold uppercase tracking-wider text-neutral-900 hover:border-black hover:bg-neutral-100 transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
