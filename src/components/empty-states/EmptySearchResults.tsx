import Link from "next/link";
import { SearchX } from "lucide-react";

interface EmptySearchResultsProps {
  query?: string;
}

export default function EmptySearchResults({ query }: EmptySearchResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <SearchX className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Tidak Ada Hasil
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-2">
        {query ? (
          <>
            Tidak ada produk yang ditemukan untuk <strong>&quot;{query}&quot;</strong>
          </>
        ) : (
          "Tidak ada produk yang sesuai dengan kriteria pencarian Anda."
        )}
      </p>

      <div className="text-sm text-gray-500 mb-8 text-center max-w-md">
        <p className="mb-1">Saran:</p>
        <ul className="list-disc list-inside space-y-1 text-left inline-block">
          <li>Periksa ejaan kata kunci</li>
          <li>Coba gunakan kata kunci yang lebih umum</li>
          <li>Gunakan kata kunci yang berbeda</li>
          <li>Gunakan filter kategori untuk mempersempit pencarian</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link
          href="/product"
          className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          Lihat Semua Produk
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-gray-900 px-6 py-2.5 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition font-medium"
        >
          Reset Filter
        </button>
      </div>

      <div className="mt-10">
        <p className="text-sm text-gray-500 mb-3">Kategori Populer:</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/product?category=Running"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
          >
            Running
          </Link>
          <Link
            href="/product?category=Casual"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
          >
            Casual
          </Link>
          <Link
            href="/product?category=Sneakers"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
          >
            Sneakers
          </Link>
        </div>
      </div>
    </div>
  );
}
