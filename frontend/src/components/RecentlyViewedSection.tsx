import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import {
  RECENTLY_VIEWED_UPDATED_EVENT,
  RecentlyViewedProduct,
  clearRecentlyViewed,
  loadRecentlyViewed,
} from "@/utils/recently-viewed";

type RecentlyViewedSectionProps = {
  excludeProductId?: string;
  limit?: number;
};

export default function RecentlyViewedSection({
  excludeProductId,
  limit = 4,
}: RecentlyViewedSectionProps) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>(() =>
    loadRecentlyViewed(excludeProductId).slice(0, limit)
  );

  useEffect(() => {
    const sync = () => {
      setItems(loadRecentlyViewed(excludeProductId).slice(0, limit));
    };

    sync();
    window.addEventListener(RECENTLY_VIEWED_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [excludeProductId, limit]);

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className="py-12 bg-[#fafafa] border-t border-neutral-200"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2
              id="recently-viewed-heading"
              className="text-2xl font-extrabold tracking-tight text-neutral-950"
            >
              Terakhir Dilihat
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Bandingkan kembali sepatu yang baru saja Anda jelajahi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => clearRecentlyViewed()}
            className="min-h-[44px] px-3.5 border border-neutral-300 bg-white text-neutral-800 text-xs font-bold uppercase tracking-[0.08em] hover:border-black hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-colors"
          >
            Hapus Riwayat
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
