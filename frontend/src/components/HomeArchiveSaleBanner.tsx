import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function HomeArchiveSaleBanner() {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

  return (
    <section
      aria-labelledby="archive-sale-heading"
      className="bg-[#0a0a0a] text-white border-y border-[#262626] selection:bg-white selection:text-black"
    >
      <div className="container mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#262626]">
          <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
            <h2
              id="archive-sale-heading"
              className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.1] text-white"
            >
              ARCHIVE SALE · HEMAT S/D 20%
            </h2>

            <div className="mt-4 inline-flex items-center gap-2.5 w-fit px-3 py-1 bg-[#d91e2a] text-white text-xs font-extrabold uppercase tracking-[0.1em]">
              <span>Potongan Harga Resmi</span>
              <span aria-hidden="true">·</span>
              <span>Bisa Digabung Voucher DISKON10</span>
            </div>

            <p className="mt-5 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-[54ch]">
              Pilihan siluet sneakers lari, lifestyle, dan basket bertanda Sale dengan harga markdown langsung. Pasang kode promo di keranjang untuk potongan tambahan di checkout.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/product?isSale=true"
                className={`min-h-[48px] px-6 bg-white text-black text-xs font-extrabold uppercase tracking-[0.08em] inline-flex items-center gap-2 hover:bg-neutral-200 transition-colors ${focusRing}`}
              >
                <span>Belanja Produk Sale</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to="/product?collection=exclusive"
                className={`min-h-[48px] px-6 bg-transparent border border-[#525252] text-white text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-colors ${focusRing}`}
              >
                Lihat Koleksi Exclusive
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#f5f5f5] border-t lg:border-t-0 lg:border-l border-[#262626] flex items-center justify-center p-8 min-h-[260px] lg:min-h-[340px]">
            <img
              src="/NB%201000%20WHITE.webp"
              alt="Koleksi sneaker unggulan Archive Sale Shoes4Us"
              className="w-full max-w-[360px] h-56 sm:h-64 object-contain mix-blend-multiply"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/sepatu2.jpeg")) {
                  target.src = "/sepatu2.jpeg";
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
