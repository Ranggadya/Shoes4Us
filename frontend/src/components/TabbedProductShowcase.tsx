import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { Product } from "@/types";
import { api } from "@/services/api";

type ShowcaseTabId = "new-arrivals" | "sale" | "exclusive" | "coming-soon";

type ShowcaseTabConfig = {
  id: ShowcaseTabId;
  label: string;
  apiQuery: string;
  ctaLabel: string;
  ctaHref: string;
  emptyMessage: string;
};

const SHOWCASE_TABS: readonly ShowcaseTabConfig[] = [
  {
    id: "new-arrivals",
    label: "New Arrivals",
    apiQuery: "/products?collection=new-arrivals&limit=8",
    ctaLabel: "Lihat Semua New Arrivals",
    ctaHref: "/product?collection=new-arrivals",
    emptyMessage: "Belum ada rilisan terbaru pada koleksi ini.",
  },
  {
    id: "sale",
    label: "Sedang Diskon",
    apiQuery: "/products?isSale=true&limit=8",
    ctaLabel: "Lihat Semua Produk Sale",
    ctaHref: "/product?isSale=true",
    emptyMessage: "Belum ada produk promo aktif saat ini.",
  },
  {
    id: "exclusive",
    label: "Exclusive",
    apiQuery: "/products?collection=exclusive&limit=8",
    ctaLabel: "Lihat Semua Exclusive",
    ctaHref: "/product?collection=exclusive",
    emptyMessage: "Belum ada produk edisi eksklusif saat ini.",
  },
  {
    id: "coming-soon",
    label: "Coming Soon",
    apiQuery: "/products?collection=coming-soon&limit=8",
    ctaLabel: "Lihat Semua Coming Soon",
    ctaHref: "/product?collection=coming-soon",
    emptyMessage: "Nantikan rilisan mendatang kami berikutnya.",
  },
];

type ShowcaseProductsResponse = {
  success?: boolean;
  data?: Product[] | { items?: Product[]; products?: Product[] };
};

export default function TabbedProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTabId>("new-arrivals");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tabCacheRef = useRef<Partial<Record<ShowcaseTabId, Product[]>>>({});

  const activeConfig =
    SHOWCASE_TABS.find((t) => t.id === activeTab) ?? SHOWCASE_TABS[0];

  useEffect(() => {
    const cached = tabCacheRef.current[activeConfig.id];
    if (cached) {
      setProducts(cached);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    api
      .get<ShowcaseProductsResponse>(activeConfig.apiQuery, {
        signal: controller.signal,
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        const items = Array.isArray(json?.data)
          ? json.data
          : json?.data?.items || json?.data?.products || [];
        tabCacheRef.current[activeConfig.id] = items;
        setProducts(items);
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }
        setProducts([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeConfig.id, activeConfig.apiQuery]);

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  return (
    <section
      aria-labelledby="tabbed-showcase-heading"
      className="py-14 bg-white border-b border-neutral-200"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-neutral-200 mb-8">
          <div>
            <h2
              id="tabbed-showcase-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950"
            >
              Kurasi Koleksi Pilihan
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-neutral-600">
              Jelajahi rilisan terbaru, penawaran diskon, hingga edisi eksklusif.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter koleksi produk"
            className="flex flex-wrap items-center gap-1.5"
          >
            {SHOWCASE_TABS.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`showcase-tab-${tab.id}`}
                  aria-controls="showcase-tabpanel"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] border transition-colors ${
                    selected
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-800 border-neutral-300 hover:border-black hover:bg-neutral-50"
                  } ${focusRing}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="showcase-tabpanel"
          role="tabpanel"
          aria-labelledby={`showcase-tab-${activeConfig.id}`}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="border border-neutral-200 bg-white animate-pulse"
                >
                  <div className="aspect-square bg-neutral-100 border-b border-neutral-200" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3 bg-neutral-200 w-1/3" />
                    <div className="h-4 bg-neutral-200 w-3/4" />
                    <div className="h-4 bg-neutral-200 w-1/2 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-neutral-200 bg-[#fafafa] p-10 text-center">
              <p className="text-sm font-medium text-neutral-700 mb-4">
                {activeConfig.emptyMessage}
              </p>
              <Link
                to="/product"
                className={`min-h-[44px] px-5 bg-black text-white text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center hover:bg-neutral-800 transition-colors ${focusRing}`}
              >
                Lihat Semua Produk
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to={activeConfig.ctaHref}
              className={`min-h-[48px] inline-flex items-center gap-2 bg-black text-white px-8 text-xs font-extrabold uppercase tracking-[0.08em] hover:bg-neutral-800 transition-colors ${focusRing}`}
            >
              <span>{activeConfig.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
