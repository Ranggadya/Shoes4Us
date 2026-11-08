import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10 text-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Kontak Kami */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Kontak Kami</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Jam Operasional</h4>
                <p className="text-gray-600">Senin - Minggu, 24 jam</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Layanan Pelanggan</h4>
                <p className="text-gray-600">Email: connect@shoes4us.id</p>
                <p className="text-gray-600">WhatsApp: +6281574577583</p>
              </div>
            </div>
          </div>

          {/* Column 2: Tentang */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Tentang</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link
                  to="/tentang-kami"
                  className="hover:text-black hover:underline transition"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  to="/tentang-shoes4us"
                  className="hover:text-black hover:underline transition"
                >
                  Tentang Shoes4Us
                </Link>
              </li>
              <li>
                <Link
                  to="/syarat-dan-ketentuan"
                  className="hover:text-black hover:underline transition"
                >
                  Syarat dan Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  to="/kebijakan-privasi"
                  className="hover:text-black hover:underline transition"
                >
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Layanan Pelanggan */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Layanan Pelanggan</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link
                  to="/faq"
                  className="hover:text-black hover:underline transition"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/kebijakan-pengembalian"
                  className="hover:text-black hover:underline transition"
                >
                  Kebijakan Pengembalian
                </Link>
              </li>
              <li>
                <Link
                  to="/kontak-kami"
                  className="hover:text-black hover:underline transition"
                >
                  Kontak Kami
                </Link>
              </li>
              <li>
                <Link
                  to="/peta-situs"
                  className="hover:text-black hover:underline transition"
                >
                  Peta Situs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Join Our Newsletter</h3>
            <form
              className="mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Terima kasih telah berlangganan Newsletter Shoes4Us!");
              }}
            >
              <div className="flex">
                <input
                  type="email"
                  required
                  placeholder="Masukkan email Anda"
                  className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 text-sm font-bold tracking-wider hover:bg-gray-800 transition"
                >
                  DAFTAR
                </button>
              </div>
              <label className="flex items-start gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 border-gray-300 text-black focus:ring-black"
                />
                <span className="text-xs text-gray-500 leading-tight">
                  Dengan memilih &quot;Daftar&quot;, saya menyetujui{" "}
                  <Link to="/kebijakan-privasi" className="underline hover:text-black">
                    kebijakan keamanan data
                  </Link>{" "}
                  Shoes4Us Indonesia
                </span>
              </label>
            </form>

            <div className="flex gap-4 mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="Facebook"
              >
                <Facebook size={20} fill="currentColor" stroke="none" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">Shoes4Us</span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {new Date().getFullYear()} © SHOES4US.ID. ALL RIGHTS RESERVED.
          </p>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4 text-center md:text-left">
          <p className="text-xs text-gray-400">
            Harga dapat berubah sewaktu-waktu tanpa pemberitahuan. Produk yang ditampilkan mungkin tidak tersedia di toko kami.
          </p>
        </div>
      </div>
    </footer>
  );
}
