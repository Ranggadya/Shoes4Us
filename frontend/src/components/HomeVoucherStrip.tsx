import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ArrowRight, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import { PROMO_VOUCHERS } from "@/constants/coupons";

export default function HomeVoucherStrip() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Kode voucher ${code} berhasil disalin!`);
    } catch {
      setCopiedCode(null);
      toast.error(`Salin kode secara manual: ${code}`);
    }
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopiedCode(null), 2200);
  };

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  return (
    <section
      aria-labelledby="home-vouchers-heading"
      className="py-10 bg-white border-b border-neutral-200"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2
              id="home-vouchers-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950"
            >
              Voucher Belanja Aktif
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Salin kode pilihan Anda dan terapkan langsung di Keranjang atau Checkout.
            </p>
          </div>
          <Link
            to="/product"
            className={`min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-neutral-900 hover:underline underline-offset-4 ${focusRing}`}
          >
            <span>Mulai Belanja</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-neutral-200 divide-y md:divide-y-0 md:divide-x divide-neutral-200 bg-white">
          {PROMO_VOUCHERS.map((voucher) => {
            const isCopied = copiedCode === voucher.code;
            return (
              <div
                key={voucher.code}
                className="p-5 sm:p-6 flex flex-col justify-between gap-4 hover:bg-[#fafafa] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-neutral-700">
                      <Ticket className="w-3.5 h-3.5 text-black" aria-hidden="true" />
                      <span>{voucher.rule}</span>
                    </span>
                    <span className="text-xs font-bold text-[#065f46] tabular-nums">
                      {voucher.benefit}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-950">
                    {voucher.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1.5 bg-[#fafafa] border border-neutral-300 text-xs font-extrabold uppercase tracking-[0.12em] text-neutral-950 tabular-nums">
                    {voucher.code}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopy(voucher.code)}
                      aria-label={`Salin kode ${voucher.code}`}
                      className={`min-h-[44px] px-3.5 border text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center gap-1.5 transition-colors ${
                        isCopied
                          ? "bg-black text-white border-black"
                          : "bg-white text-neutral-900 border-neutral-300 hover:border-black hover:bg-neutral-50"
                      } ${focusRing}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={voucher.ctaHref}
                      className={`min-h-[44px] px-3.5 bg-black text-white text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center hover:bg-neutral-800 transition-colors ${focusRing}`}
                    >
                      Pakai
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <span role="status" className="sr-only">
          {copiedCode ? `Kode ${copiedCode} disalin ke clipboard` : ""}
        </span>
      </div>
    </section>
  );
}
