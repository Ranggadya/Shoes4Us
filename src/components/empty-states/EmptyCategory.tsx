import Link from "next/link";
import { FolderX } from "lucide-react";

interface EmptyCategoryProps {
  category?: string;
}

export default function EmptyCategory({ category }: EmptyCategoryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FolderX className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Kategori Kosong
      </h2>
      
      <p className="text-gray-600 text-center max-w-md mb-8">
        {category ? (
          <>
            Belum ada produk di kategori <strong>{category}</strong>.
            <br />
            Coba jelajahi kategori lain atau lihat semua produk kami.
          </>
        ) : (
          "Belum ada produk di kategori ini. Coba jelajahi kategori lain."
        )}
      </p>

      <Link
        href="/product"
        className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition font-medium"
      >
        Lihat Semua Produk
      </Link>

      <div className="mt-10">
        <p className="text-sm text-gray-500 mb-3">Kategori Lainnya:</p>
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
            href="/product?category=Formal"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
          >
            Formal
          </Link>
          <Link
            href="/product?category=Sneakers"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
          >
            Sneakers
          </Link>
          <Link
            href="/product?category=Sport"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm"
          >
            Sport
          </Link>
        </div>
      </div>
    </div>
  );
}
