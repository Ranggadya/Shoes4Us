import Image from "next/image";

export default function ProductBanner() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12 px-6">
        {/* Gambar di kiri */}
        <div className="flex justify-center">
          <Image
            src="/sepatu1.jpeg" 
            alt="Koleksi Sepatu Baru"
            width={500}
            height={400}
            className="rounded-xl shadow-lg"
          />
        </div>

        {/* Teks di kanan */}
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-bold text-gray-900">
            Koleksi Sepatu Baru
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            Dapatkan sepatu terbaru dengan desain stylish & nyaman dipakai sehari-hari.
          </p>
          <button className="mt-6 px-6 py-3 bg-black text-white rounded-lg shadow hover:bg-gray-800 transition">
            Belanja Sekarang
          </button>
        </div>
      </div>
    </section>
  );
}
