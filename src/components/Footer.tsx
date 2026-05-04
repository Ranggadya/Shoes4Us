"use client";

import { useState } from "react";
import { Facebook, Instagram } from "lucide-react";

export default function Footer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
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
                  <button onClick={() => setIsOpen(true)} className="hover:text-black transition" suppressHydrationWarning>
                    Tentang Kami
                  </button>
                </li>
                <li><a href="#" className="hover:text-black transition">Tentang Shoes4Us</a></li>
                <li><a href="#" className="hover:text-black transition">Syarat dan Ketentuan</a></li>
                <li><a href="#" className="hover:text-black transition">Kebijakan Privasi</a></li>
              </ul>
            </div>

            {/* Column 3: Layanan Pelanggan */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Layanan Pelanggan</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black transition">FAQ</a></li>
                <li><a href="#" className="hover:text-black transition">Kebijakan Pengembalian</a></li>
                <li><a href="#" className="hover:text-black transition">Kontak Kami</a></li>
                <li><a href="#" className="hover:text-black transition">Peta Situs</a></li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Join Our Newsletter</h3>
              <form className="mb-4">
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Masukkan email Anda" 
                    className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                    suppressHydrationWarning
                  />
                  <button type="button" className="bg-black text-white px-4 py-2 text-sm font-bold tracking-wider hover:bg-gray-800 transition" suppressHydrationWarning>
                    DAFTAR
                  </button>
                </div>
                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-black focus:ring-black" />
                  <span className="text-xs text-gray-500 leading-tight">
                    Dengan memilih &quot;Daftar Sekarang&quot;, saya menyetujui kebijakan keamanan data Shoes4Us Indonesia
                  </span>
                </label>
              </form>
              
              <div className="flex gap-4 mt-6">
                <a href="#" className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition">
                  <Facebook size={20} fill="currentColor" stroke="none" />
                </a>
                <a href="#" className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
            
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight">Shoes4Us</span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider" suppressHydrationWarning>
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

      {/* Modal popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-lg shadow-lg p-6 w-96 max-w-full m-4">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Tentang Kami
            </h3>

            <ul className="space-y-2 text-sm mb-6">
              <li>RANGGADYA ADITAMA RAMADHANI   — 2406012314096</li>
              <li>RETNO EKA TRIATRY             — 24060123140188</li>
              <li>SHAFIYAH                      — 24060123140143</li>
              <li>STEPHEN MICHAEL SIRAIT        — 24060123140193</li>
              <li>YELISA LORIAN                 — 24060123130082</li>
            </ul>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
              suppressHydrationWarning
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}