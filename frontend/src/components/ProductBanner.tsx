import { Link } from "react-router-dom";

export default function ProductBanner() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12 px-6">
        <div className="flex justify-center">
          <img
            src="/sepatu1.jpeg"
            alt="Koleksi Sepatu Baru"
            className="w-full max-w-[500px] h-auto rounded-xl shadow-lg object-cover"
          />
        </div>

        <div className="text-center md:text-left">
          <h2 className="text-4xl font-bold text-gray-900">
            Koleksi Sepatu Baru
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            Dapatkan sepatu terbaru dengan desain stylish & nyaman dipakai sehari-hari.
          </p>
          <Link
            to="/product"
            className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition"
          >
            Belanja Sekarang
          </Link>
        </div>
      </div>
    </section>
  );
}
