"use client";

import { useState } from "react";

export default function Footer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Footer utama */}
      <footer className="bg-gray-900 text-gray-300 py-6 mt-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-lg font-bold text-white">Shoes4Us</h2>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Shoes4Us. Kelompok PBP 2 Kelas E.
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            <button
              onClick={() => setIsOpen(true)}
              className="hover:text-white transition"
            >
              Tentang Kami
            </button>
            <a href="/contact" className="hover:text-white transition">
              Kontak
            </a>
            <a href="/privacy" className="hover:text-white transition">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </footer>

      {/* Modal popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Tentang Kami
            </h3>

            <ul className="space-y-2 text-sm">
              <li>RANGGADYA ADITAMA RAMADHANI   — 2406012314096</li>
              <li>RETNO EKA TRIATRY             — 24060123140188</li>
              <li>SHAFIYAH                      — 24060123140143</li>
              <li>STEPHEN MICHAEL SIRAIT        — 24060123140193</li>
              <li>YELISA LORIAN                 — 24060123130082</li>
            </ul>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}