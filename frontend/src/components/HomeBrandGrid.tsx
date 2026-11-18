import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BrandLogoMark, { BrandLogoId } from "./BrandLogoMark";

const FEATURED_BRANDS: ReadonlyArray<{
  id: BrandLogoId;
  label: string;
  href: string;
}> = [
  { id: "nike", label: "Nike", href: "/product?brand=Nike" },
  { id: "adidas", label: "Adidas", href: "/product?brand=Adidas" },
  {
    id: "adidas-originals",
    label: "Adidas Originals",
    href: "/product?search=Adidas%20Originals",
  },
  { id: "jordan", label: "Jordan", href: "/product?brand=Jordan" },
  {
    id: "new-balance",
    label: "New Balance",
    href: "/product?brand=New%20Balance",
  },
  { id: "asics", label: "Asics", href: "/product?brand=Asics" },
  { id: "puma", label: "Puma", href: "/product?brand=Puma" },
  { id: "converse", label: "Converse", href: "/product?brand=Converse" },
  { id: "vans", label: "Vans", href: "/product?brand=Vans" },
  { id: "on", label: "On", href: "/product?brand=On" },
  { id: "hoka", label: "Hoka", href: "/product?brand=Hoka" },
  { id: "salomon", label: "Salomon", href: "/product?brand=Salomon" },
];

export default function HomeBrandGrid() {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset";

  return (
    <section
      aria-labelledby="home-brand-grid-heading"
      className="py-12 bg-white border-b border-neutral-200"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2
              id="home-brand-grid-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950"
            >
              Belanja Berdasarkan Merek
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Pilih merek favorit Anda dari 21 brand resmi di Shoes4Us.
            </p>
          </div>

          <Link
            to="/product"
            className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-neutral-900 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <span>Lihat Semua Katalog</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-l border-neutral-200">
          {FEATURED_BRANDS.map((brand) => (
            <Link
              key={brand.id}
              to={brand.href}
              aria-label={`Belanja merek ${brand.label}`}
              className={`min-h-[96px] p-4 border-r border-b border-neutral-200 bg-white text-neutral-900 hover:bg-[#0a0a0a] hover:text-white transition-colors flex flex-col items-center justify-center gap-2 text-center group ${focusRing}`}
            >
              <BrandLogoMark
                id={brand.id}
                className="h-7 w-auto max-w-[76px]"
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-600 group-hover:text-neutral-300 transition-colors">
                {brand.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
