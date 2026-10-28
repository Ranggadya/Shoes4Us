import { Link, useNavigate } from "react-router-dom";
import { Home, Search, ShoppingBag, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="text-9xl font-black text-gray-200 select-none">
            404
          </div>
          <div className="flex justify-center items-center gap-3 mt-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak dapat ditemukan. 
          Mungkin sudah dipindahkan atau tidak pernah ada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Beranda</span>
          </Link>

          <Link
            to="/product"
            className="flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition font-medium"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Semua Produk</span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 mb-4">
            Atau jelajahi kategori sepatu kami:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/product?category=Running"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm font-medium"
            >
              Running
            </Link>
            <Link
              to="/product?category=Casual"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm font-medium"
            >
              Casual
            </Link>
            <Link
              to="/product?category=Formal"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm font-medium"
            >
              Formal
            </Link>
            <Link
              to="/product?category=Sneakers"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm font-medium"
            >
              Sneakers
            </Link>
            <Link
              to="/product?category=Sport"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition text-sm font-medium"
            >
              Sport
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
