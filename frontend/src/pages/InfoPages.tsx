import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  ExternalLink,
} from "lucide-react";
import { SUPPORT_CONTACT } from "@/constants/contact";

export type InfoPageSlug =
  | "tentang-kami"
  | "tentang-shoes4us"
  | "syarat-dan-ketentuan"
  | "kebijakan-privasi"
  | "faq"
  | "kebijakan-pengembalian"
  | "kontak-kami"
  | "peta-situs";

type NavItem = {
  slug: InfoPageSlug;
  label: string;
  path: string;
  section: "TENTANG" | "LAYANAN PELANGGAN";
};

const INFO_NAV_ITEMS: NavItem[] = [
  {
    slug: "tentang-kami",
    label: "Tentang Kami",
    path: "/tentang-kami",
    section: "TENTANG",
  },
  {
    slug: "tentang-shoes4us",
    label: "Tentang Shoes4Us",
    path: "/tentang-shoes4us",
    section: "TENTANG",
  },
  {
    slug: "syarat-dan-ketentuan",
    label: "Syarat dan Ketentuan",
    path: "/syarat-dan-ketentuan",
    section: "TENTANG",
  },
  {
    slug: "kebijakan-privasi",
    label: "Kebijakan Privasi",
    path: "/kebijakan-privasi",
    section: "TENTANG",
  },
  {
    slug: "faq",
    label: "FAQ",
    path: "/faq",
    section: "LAYANAN PELANGGAN",
  },
  {
    slug: "kebijakan-pengembalian",
    label: "Kebijakan Pengembalian",
    path: "/kebijakan-pengembalian",
    section: "LAYANAN PELANGGAN",
  },
  {
    slug: "kontak-kami",
    label: "Kontak Kami",
    path: "/kontak-kami",
    section: "LAYANAN PELANGGAN",
  },
  {
    slug: "peta-situs",
    label: "Peta Situs",
    path: "/peta-situs",
    section: "LAYANAN PELANGGAN",
  },
];

const FAQ_ITEMS = [
  {
    category: "Pemesanan & Keranjang",
    question: "Apakah saya harus login terlebih dahulu untuk memasukkan produk ke keranjang?",
    answer:
      "Tidak perlu. Anda dapat memilih ukuran sepatu dan menambahkan produk ke keranjang belanja sebagai pengunjung (Guest Cart). Anda baru diminta untuk login atau mendaftar akun ketika hendak melanjutkan ke tahap pembayaran (Checkout), dan seluruh isi keranjang Anda akan otomatis tersinkronisasi ke akun Anda.",
  },
  {
    category: "Keaslian Produk",
    question: "Apakah semua sepatu yang dijual di Shoes4Us dijamin 100% Original?",
    answer:
      "Ya, 100% Original. Seluruh produk yang tersedia di Shoes4Us bersumber langsung dari distributor resmi masing-masing brand (New Balance, Nike, Adidas, Puma, Jordan, Vans, Converse, dan Asics) serta melewati proses inspeksi kualitas sebelum dikirimkan ke alamat Anda.",
  },
  {
    category: "Promo & Voucher",
    question: "Bagaimana cara menggunakan kode voucher diskon?",
    answer:
      "Anda dapat memasukkan kode promo seperti DISKON10 (potongan 10% hingga Rp50.000), HEMAT50RB (potongan Rp50.000 min. belanja Rp300.000), atau GRATISONGKIR (potongan ongkir hingga Rp25.000) langsung pada halaman Keranjang maupun halaman Pembayaran.",
  },
  {
    category: "Pengiriman & Pelacakan Resi",
    question: "Kurir apa saja yang tersedia dan bagaimana cara melacak nomor resi?",
    answer:
      "Kami bekerja sama dengan JNE Reguler, JNE YES (Yakin Esok Sampai), SiCepat REG, dan J&T Express. Setelah pesanan dikirim, nomor resi otomatis muncul di halaman Status Pesanan dan Riwayat Pesanan lengkap dengan tombol 'Salin Resi'.",
  },
  {
    category: "Ukuran & Penukaran",
    question: "Bagaimana jika ukuran sepatu yang saya terima kurang pas di kaki?",
    answer:
      "Jangan khawatir! Kami menyediakan garansi penukaran ukuran selama 7 hari sejak pesanan diterima, selama sepatu belum pernah dipakai beraktivitas di luar ruangan dan kotak serta tag asli masih lengkap.",
  },
];

export default function InfoPages({ page }: { page: InfoPageSlug }) {
  const location = useLocation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("Pertanyaan Produk & Ukuran");
  const [contactOrderNo, setContactOrderNo] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, page]);

  const currentNav =
    INFO_NAV_ITEMS.find((item) => item.slug === page) || INFO_NAV_ITEMS[0];

  const handleContactSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error("Mohon lengkapi nama, email, dan pesan Anda.");
      return;
    }
    toast.success(
      "Pesan Anda berhasil dikirim! Tim Layanan Pelanggan kami akan segera menghubungi Anda."
    );
    setContactName("");
    setContactEmail("");
    setContactOrderNo("");
    setContactMessage("");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Uppercase Slash Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex flex-wrap items-center gap-2 text-xs tracking-wide uppercase text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition">
              HOME
            </Link>
            <span className="text-slate-300">/</span>
            <span>{currentNav.section}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">
              {currentNav.label.toUpperCase()}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="border border-slate-200 bg-white sticky top-24">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Tentang
                </h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {INFO_NAV_ITEMS.filter((item) => item.section === "TENTANG").map(
                  (item) => {
                    const active = item.slug === page;
                    return (
                      <li key={item.slug}>
                        <Link
                          to={item.path}
                          className={`block px-4 py-3 text-sm transition ${
                            active
                              ? "bg-slate-900 text-white font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  }
                )}
              </ul>

              <div className="p-4 border-y border-slate-200 bg-slate-50">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Layanan Pelanggan
                </h2>
              </div>
              <ul className="divide-y divide-slate-100">
                {INFO_NAV_ITEMS.filter(
                  (item) => item.section === "LAYANAN PELANGGAN"
                ).map((item) => {
                  const active = item.slug === page;
                  return (
                    <li key={item.slug}>
                      <Link
                        to={item.path}
                        className={`block px-4 py-3 text-sm transition ${
                          active
                            ? "bg-slate-900 text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="lg:col-span-9">
            <div className="border border-slate-200 bg-white p-6 sm:p-10">
              {/* 1. TENTANG KAMI */}
              {page === "tentang-kami" && (
                <div className="space-y-8">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Tentang Kami
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
                      Destinasi ritel sepatu olahraga dan gaya hidup terpercaya di Indonesia yang menghadirkan kurasi koleksi terbaik dunia langsung ke langkah Anda.
                    </p>
                  </div>

                  <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                    <p>
                      Didirikan dengan semangat untuk menghadirkan akses mudah terhadap sepatu berkualitas tinggi, <strong>Shoes4Us Indonesia</strong> tumbuh menjadi platform e-commerce dan ritel multi-brand yang melayani ribuan pecinta sneaker, pelari, dan penggiat olahraga di seluruh nusantara.
                    </p>
                    <p>
                      Kami percaya bahwa sepasang sepatu yang tepat bukan sekadar pelengkap penampilan, melainkan fondasi kenyamanan dan kepercayaan diri dalam setiap aktivitas—mulai dari lintasan lari, lapangan basket, hingga gaya kasual sehari-hari.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-5 bg-slate-50">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                        Visi Kami
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Menjadi ekosistem ritel alas kaki nomor satu di Indonesia yang mengutamakan keaslian produk, transparansi harga, dan pengalaman belanja digital yang cepat serta inklusif.
                      </p>
                    </div>
                    <div className="border border-slate-200 p-5 bg-slate-50">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">
                        Misi Kami
                      </h3>
                      <ul className="text-sm text-slate-600 space-y-1.5">
                        <li>• Menghadirkan koleksi 100% original dari brand global ternama.</li>
                        <li>• Menyediakan layanan pengiriman terintegrasi ke seluruh provinsi.</li>
                        <li>• Memberikan jaminan tukar ukuran 7 hari tanpa birokrasi rumit.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {[
                      { value: "100%", label: "Jaminan Produk Resmi" },
                      { value: "8+", label: "Mitra Brand Global" },
                      { value: "24/7", label: "Dukungan Pelanggan" },
                      { value: "34", label: "Provinsi Jangkauan Kirim" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="border border-slate-200 p-4 text-center"
                      >
                        <p className="text-2xl font-bold text-slate-900">
                          {stat.value}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TENTANG SHOES4US */}
              {page === "tentang-shoes4us" && (
                <div className="space-y-8">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Tentang Shoes4Us
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
                      Mengenal standar kurasi produk, kemitraan brand resmi, dan keunggulan fitur belanja di platform Shoes4Us.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-5 flex gap-4">
                      <ShieldCheck className="w-6 h-6 text-slate-900 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold uppercase text-slate-900">
                          Garansi Keaslian 100%
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          Setiap pasang sepatu dilengkapi kode SKU resmi, kotak orisinal, dan melalui tahapan verifikasi fisik oleh tim spesialis produk kami.
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 flex gap-4">
                      <Award className="w-6 h-6 text-slate-900 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold uppercase text-slate-900">
                          Koleksi Eksklusif & Rilisan Baru
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          Mulai dari seri klasik New Balance, sepatu lari performa tinggi, hingga rilisan terbatas yang dikurasi khusus untuk pasar Indonesia.
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 flex gap-4">
                      <Truck className="w-6 h-6 text-slate-900 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold uppercase text-slate-900">
                          Multi-Ekspedisi & Pelacakan Resi
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          Pilih kurir favorit Anda (JNE, SiCepat, J&T) saat checkout dengan kalkulasi tarif instan dan nomor resi yang dapat disalin langsung.
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 flex gap-4">
                      <RotateCcw className="w-6 h-6 text-slate-900 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold uppercase text-slate-900">
                          Bebas Tukar Ukuran 7 Hari
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          Belanja sepatu secara online tanpa rasa ragu berkat perlindungan penukaran ukuran hingga 7 hari sejak barang tiba.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                      Brand Resmi di Katalog Kami
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        "NEW BALANCE",
                        "NIKE",
                        "ADIDAS",
                        "PUMA",
                        "JORDAN",
                        "VANS",
                        "CONVERSE",
                        "ASICS",
                      ].map((brand) => (
                        <Link
                          key={brand}
                          to={`/product?brand=${encodeURIComponent(brand)}`}
                          className="border border-slate-200 py-3 px-4 text-center text-xs font-bold tracking-wider text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition"
                        >
                          {brand}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SYARAT DAN KETENTUAN */}
              {page === "syarat-dan-ketentuan" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Syarat dan Ketentuan
                    </h1>
                    <p className="text-slate-500 mt-2 text-xs sm:text-sm">
                      Terakhir diperbarui: November 2026 • Berlaku untuk seluruh pengguna Shoes4Us Indonesia
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        1. Ketentuan Umum Penggunaan Situs
                      </h2>
                      <p>
                        Dengan mengakses dan berbelanja di situs Shoes4Us.id, Anda menyetujui untuk mematuhi seluruh syarat dan ketentuan yang tercantum di halaman ini. Pengunjung dapat menjelajahi katalog dan menambahkan produk ke keranjang tanpa login, namun wajib memiliki akun terverifikasi untuk menyelesaikan transaksi pembayaran.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        2. Informasi Produk, Harga, dan Ketersediaan Stok
                      </h2>
                      <p>
                        Seluruh harga produk tercantum dalam mata uang Rupiah (IDR). Stok masing-masing ukuran sepatu diperbarui secara langsung (real-time). Apabila terjadi kendala stok habis saat pesanan diproses, tim kami akan segera menghubungi Anda untuk opsi penggantian ukuran/produk atau pengembalian dana penuh (100%).
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        3. Penggunaan Voucher & Promosi
                      </h2>
                      <p>
                        Setiap kode voucher (seperti <code>DISKON10</code>, <code>HEMAT50RB</code>, dan <code>GRATISONGKIR</code>) memiliki ketentuan nilai minimum pembelanjaan dan batas maksimum potongan.Satu pesanan hanya dapat menggunakan satu kode voucher aktif.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        4. Pembayaran & Konfirmasi Pesanan
                      </h2>
                      <p>
                        Kami mendukung metode pembayaran melalui Kartu Kredit, QRIS, dan Transfer Virtual Account Bank. Pesanan yang masih berstatus <em>Menunggu Pembayaran (PENDING)</em> dapat dibatalkan kapan saja melalui halaman Riwayat Pesanan sebelum pembayaran dikonfirmasi.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        5. Hak Kekayaan Intelektual
                      </h2>
                      <p>
                        Seluruh materi visual, logo merek dagang, foto produk, dan tata letak situs merupakan milik Shoes4Us Indonesia serta masing-masing pemegang lisensi resmi brand terkait. Dilarang menyalin atau menggunakan materi tersebut untuk tujuan komersial tanpa izin tertulis.
                      </p>
                    </section>
                  </div>
                </div>
              )}

              {/* 4. KEBIJAKAN PRIVASI */}
              {page === "kebijakan-privasi" && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Kebijakan Privasi
                    </h1>
                    <p className="text-slate-500 mt-2 text-xs sm:text-sm">
                      Komitmen Shoes4Us Indonesia dalam melindungi keamanan data pribadi pelanggan.
                    </p>
                  </div>

                  <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        1. Data Pribadi yang Kami Kumpulkan
                      </h2>
                      <p>
                        Kami hanya mengumpulkan informasi yang dibutuhkan untuk memproses pesanan dan meningkatkan pengalaman belanja Anda, meliputi: Nama lengkap, alamat email, nomor telepon aktif, serta alamat pengiriman lengkap (kota dan kode pos).
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        2. Penggunaan Informasi Pelanggan
                      </h2>
                      <ul className="space-y-1.5 list-disc list-inside">
                        <li>Memproses dan mengirimkan pesanan sepatu Anda melalui mitra kurir resmi.</li>
                        <li>Menampilkan status pelacakan nomor resi dan riwayat transaksi di akun Anda.</li>
                        <li>Mengirimkan pembaruan terkait status pesanan atau informasi promo apabila Anda berlangganan Newsletter.</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        3. Keamanan Penyimpanan Data & Kata Sandi
                      </h2>
                      <p>
                        Kata sandi akun Anda dienkripsi menggunakan algoritma <em>bcrypt hashing</em> satu arah dan tidak pernah disimpan dalam bentuk teks biasa. Sesi autentikasi dilindungi dengan token JWT aman dan cookie ber-proteksi HTTP.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        4. Pembagian Data kepada Pihak Ketiga
                      </h2>
                      <p>
                        Shoes4Us tidak pernah menjual atau memperdagangkan data pribadi Anda kepada pihak mana pun. Informasi nama, alamat, dan nomor telepon hanya diteruskan kepada mitra logistik (JNE, SiCepat, J&T) semata-mata untuk keperluan pengantaran paket.
                      </p>
                    </section>

                    <section>
                      <h2 className="text-base font-bold text-slate-900 mb-2">
                        5. Hak Akses & Pembaruan Data
                      </h2>
                      <p>
                        Anda dapat memperbarui informasi profil, alamat pengiriman tersimpan, maupun mengganti kata sandi kapan saja melalui halaman <Link to="/profile" className="text-slate-900 font-semibold underline">Profil Saya</Link>.
                      </p>
                    </section>
                  </div>
                </div>
              )}

              {/* 5. FAQ */}
              {page === "faq" && (
                <div className="space-y-8">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Pertanyaan yang Sering Diajukan (FAQ)
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base">
                      Temukan jawaban cepat seputar pemesanan, ukuran sepatu, kode voucher, dan pengiriman di Shoes4Us.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200">
                    {FAQ_ITEMS.map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={item.question} className="bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenFaqIndex(isOpen ? null : idx)
                            }
                            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                          >
                            <div>
                              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                {item.category}
                              </span>
                              <span className="text-sm sm:text-base font-bold text-slate-900">
                                {item.question}
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Masih memiliki pertanyaan lain?
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tim Layanan Pelanggan kami siap membantu Anda setiap hari selama 24 jam.
                      </p>
                    </div>
                    <Link
                      to="/kontak-kami"
                      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                    >
                      Hubungi Kami
                    </Link>
                  </div>
                </div>
              )}

              {/* 6. KEBIJAKAN PENGEMBALIAN */}
              {page === "kebijakan-pengembalian" && (
                <div className="space-y-8">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Kebijakan Pengembalian & Tukar Ukuran
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base">
                      Kami memberikan jaminan 7 hari pengembalian dan penukaran ukuran agar Anda selalu mendapatkan sepatu yang pas.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                      Syarat Kelayakan Produk Retur
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Pengajuan dilakukan maksimal 7 hari kalender sejak status pesanan dinyatakan Selesai (Diterima).",
                        "Sepatu belum pernah digunakan beraktivitas di luar ruangan (sol bawah bersih dan tidak aus).",
                        "Kotak sepatu asli (original box) dalam kondisi utuh, tidak rusak, dan tidak ditempeli lakban langsung.",
                        "Label harga (hangtag), kertas pelindung dalam, dan aksesori bawaan (seperti tali sepatu cadangan) masih lengkap.",
                      ].map((cond) => (
                        <div
                          key={cond}
                          className="border border-slate-200 p-4 flex items-start gap-3 bg-slate-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-900 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {cond}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">
                      Langkah Mudah Pengajuan Penukaran
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {[
                        {
                          step: "01",
                          title: "Hubungi CS",
                          desc: "Kirim nomor pesanan (#ORD) dan foto kondisi sepatu melalui halaman Kontak Kami atau WhatsApp.",
                        },
                        {
                          step: "02",
                          title: "Verifikasi",
                          desc: "Tim kami akan memeriksa ketersediaan ukuran pengganti dan memberikan alamat gudang retur.",
                        },
                        {
                          step: "03",
                          title: "Kirim Paket",
                          desc: "Kemas kotak sepatu menggunakan pelapis tambahan (bubble wrap/kardus luar) dan kirimkan ke gudang kami.",
                        },
                        {
                          step: "04",
                          title: "Sepatu Baru Dikirim",
                          desc: "Setelah lolos inspeksi (1-2 hari kerja), sepatu ukuran baru langsung dikirim ke alamat Anda.",
                        },
                      ].map((item) => (
                        <div
                          key={item.step}
                          className="border border-slate-200 p-4 bg-white"
                        >
                          <span className="inline-block text-xs font-extrabold px-2 py-0.5 bg-slate-900 text-white mb-2">
                            TAHAP {item.step}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. KONTAK KAMI */}
              {page === "kontak-kami" && (
                <div className="space-y-8">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Kontak Kami
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base">
                      Hubungi tim Layanan Pelanggan Shoes4Us Indonesia untuk bantuan pesanan, konsultasi ukuran, maupun kerja sama.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="border border-slate-200 p-5 bg-slate-50">
                      <Mail className="w-5 h-5 text-slate-900 mb-2" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Email Resmi
                      </h3>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {SUPPORT_CONTACT.email}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Respon cepat dalam &lt; 2 jam kerja
                      </p>
                    </div>

                    <div className="border border-slate-200 p-5 bg-slate-50">
                      <Phone className="w-5 h-5 text-slate-900 mb-2" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        WhatsApp Layanan Pelanggan
                      </h3>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {SUPPORT_CONTACT.whatsappDisplayFormatted}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tersedia untuk chat & konfirmasi resi
                      </p>
                    </div>

                    <div className="border border-slate-200 p-5 bg-slate-50">
                      <Clock className="w-5 h-5 text-slate-900 mb-2" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Jam Operasional
                      </h3>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        Senin - Minggu, 24 Jam
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Termasuk hari libur nasional
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                    {/* Contact Form */}
                    <form
                      onSubmit={handleContactSubmit}
                      className="lg:col-span-7 space-y-4 border border-slate-200 p-6"
                    >
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                        Kirim Pesan Langsung
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Lengkap *
                          </label>
                          <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Nama Anda"
                            className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Alamat Email *
                          </label>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Topik Bantuan
                          </label>
                          <select
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
                          >
                            <option>Pertanyaan Produk & Ukuran</option>
                            <option>Status Pengiriman & Nomor Resi</option>
                            <option>Pengajuan Tukar Ukuran / Retur</option>
                            <option>Kendala Pembayaran & Voucher</option>
                            <option>Lainnya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nomor Pesanan (Opsional)
                          </label>
                          <input
                            type="text"
                            value={contactOrderNo}
                            onChange={(e) => setContactOrderNo(e.target.value)}
                            placeholder="Contoh: ORD-2026..."
                            className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Pesan Anda *
                        </label>
                        <textarea
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="Tuliskan detail pertanyaan atau kendala Anda..."
                          className="w-full px-3 py-2 text-sm border border-slate-300 focus:outline-none focus:border-slate-900"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                      >
                        <Send className="w-4 h-4" />
                        <span>Kirim Pesan</span>
                      </button>
                    </form>

                    {/* Flagship Store Locations */}
                    <div className="lg:col-span-5 space-y-3">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200">
                        Lokasi Gerai Flagship
                      </h2>
                      {[
                        {
                          city: "Jakarta Pusat",
                          name: "Shoes4Us Grand Indonesia",
                          address: "Skybridge Lt. 2 Unit SB-21, Jl. M.H. Thamrin No.1",
                        },
                        {
                          city: "Jakarta Selatan",
                          name: "Shoes4Us Senayan City",
                          address: "Lt. 3 Unit 48, Jl. Asia Afrika Lot 19",
                        },
                        {
                          city: "Bandung",
                          name: "Shoes4Us Paris Van Java",
                          address: "Resort Level C-12, Jl. Sukajadi No.131-139",
                        },
                        {
                          city: "Surabaya",
                          name: "Shoes4Us Tunjungan Plaza 5",
                          address: "Lt. 2 Unit 15, Jl. Basuki Rahmat No.8-12",
                        },
                      ].map((store) => (
                        <div
                          key={store.name}
                          className="border border-slate-200 p-4 flex items-start gap-3"
                        >
                          <MapPin className="w-4 h-4 text-slate-900 flex-shrink-0 mt-1" />
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              {store.city}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900">
                              {store.name}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {store.address}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 8. PETA SITUS */}
              {page === "peta-situs" && (
                <div className="space-y-8">
                  <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                      Peta Situs (Sitemap)
                    </h1>
                    <p className="text-slate-600 mt-2 text-sm sm:text-base">
                      Indeks lengkap seluruh halaman katalog, koleksi, akun pelanggan, dan layanan informasi di Shoes4Us.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Directory 1: Katalog & Koleksi */}
                    <div className="border border-slate-200 p-5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-200">
                        Katalog & Koleksi
                      </h2>
                      <ul className="space-y-2.5 text-sm">
                        {[
                          { label: "Beranda Utama", to: "/" },
                          { label: "Semua Produk Sepatu", to: "/product" },
                          { label: "Koleksi Pria", to: "/product?audience=MEN" },
                          { label: "Koleksi Wanita", to: "/product?audience=WOMEN" },
                          { label: "Koleksi Anak-Anak", to: "/product?audience=KIDS" },
                          { label: "Rilisan Baru (New Arrivals)", to: "/product?collection=new-arrivals" },
                          { label: "Koleksi Eksklusif", to: "/product?collection=exclusive" },
                          { label: "Promo & Diskon (Sale)", to: "/product?isSale=true" },
                        ].map((link) => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Directory 2: Brand Populer */}
                    <div className="border border-slate-200 p-5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-200">
                        Brand Sepatu
                      </h2>
                      <ul className="space-y-2.5 text-sm">
                        {[
                          "New Balance",
                          "Nike",
                          "Adidas",
                          "Puma",
                          "Jordan",
                          "Vans",
                          "Converse",
                          "Asics",
                        ].map((brand) => (
                          <li key={brand}>
                            <Link
                              to={`/product?brand=${encodeURIComponent(brand)}`}
                              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>Sepatu {brand}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Directory 3: Akun & Informasi */}
                    <div className="border border-slate-200 p-5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-3 mb-3 border-b border-slate-200">
                        Akun & Layanan Pelanggan
                      </h2>
                      <ul className="space-y-2.5 text-sm">
                        {[
                          { label: "Keranjang Belanja", to: "/cart" },
                          { label: "Wishlist Saya", to: "/wishlist" },
                          { label: "Status & Pelacakan Pesanan", to: "/status-pesanan" },
                          { label: "Riwayat Pesanan Saya", to: "/order" },
                          { label: "Profil & Pengaturan Akun", to: "/profile" },
                          { label: "Login / Daftar Akun", to: "/login" },
                          { label: "Tentang Kami", to: "/tentang-kami" },
                          { label: "FAQ & Bantuan", to: "/faq" },
                          { label: "Kebijakan Pengembalian", to: "/kebijakan-pengembalian" },
                          { label: "Kontak Kami", to: "/kontak-kami" },
                        ].map((link) => (
                          <li key={link.to}>
                            <Link
                              to={link.to}
                              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

