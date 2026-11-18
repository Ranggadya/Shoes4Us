import { Link } from "react-router-dom";
import { ArrowRight, Ruler } from "lucide-react";
import { EU_TO_US_MAP } from "@/utils/size-converter";

const QUICK_EU_SIZES = ["39", "40", "41", "42", "43", "44", "45"] as const;

export default function HomeQuickSizeFinder() {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  return (
    <section
      aria-labelledby="quick-size-finder-heading"
      className="py-10 bg-[#fafafa] border-b border-neutral-200"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
              <Ruler className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="quick-size-finder-heading"
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950"
              >
                Cari Langsung Berdasarkan Ukuranmu
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Pilih ukuran US / EU favorit Anda untuk langsung menyaring katalog.
              </p>
            </div>
          </div>

          <Link
            to="/product"
            className={`min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-neutral-900 hover:underline underline-offset-4 ${focusRing}`}
          >
            <span>Semua Ukuran</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {QUICK_EU_SIZES.map((eu) => {
            const usLabel = EU_TO_US_MAP[eu] || `EU ${eu}`;
            return (
              <Link
                key={eu}
                to={`/product?size=${encodeURIComponent(eu)}`}
                className={`min-h-[56px] px-3 py-2.5 border border-neutral-300 bg-white hover:border-black hover:bg-black hover:text-white transition-colors flex flex-col items-center justify-center text-center group tabular-nums ${focusRing}`}
              >
                <span className="text-sm font-extrabold leading-tight">
                  {usLabel}
                </span>
                <span className="text-[11px] text-neutral-600 group-hover:text-neutral-300 mt-0.5 leading-tight">
                  EU {eu}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
