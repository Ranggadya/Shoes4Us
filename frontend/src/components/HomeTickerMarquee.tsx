import { Link } from "react-router-dom";
import BrandLogoMark, { BrandLogoId } from "./BrandLogoMark";

type TickerBrandEntry = {
  kind: "brand";
  id: BrandLogoId;
  label: string;
  href: string;
};

type TickerStatementEntry = {
  kind: "statement";
  label: string;
  highlight?: boolean;
};

type TickerEntry = TickerBrandEntry | TickerStatementEntry;

const TICKER_ITEMS: readonly TickerEntry[] = [
  { kind: "statement", label: "Ekstra 10% Kode DISKON10", highlight: true },
  { kind: "brand", id: "nike", label: "Nike", href: "/product?brand=Nike" },
  { kind: "statement", label: "100% Produk Original Resmi" },
  { kind: "brand", id: "jordan", label: "Jordan", href: "/product?brand=Jordan" },
  { kind: "statement", label: "Gratis Ongkir s/d Rp 25.000", highlight: true },
  { kind: "brand", id: "adidas", label: "Adidas", href: "/product?brand=Adidas" },
  { kind: "statement", label: "Garansi Tukar Ukuran 7 Hari" },
  {
    kind: "brand",
    id: "new-balance",
    label: "New Balance",
    href: "/product?brand=New%20Balance",
  },
  { kind: "brand", id: "asics", label: "Asics", href: "/product?brand=Asics" },
  { kind: "brand", id: "puma", label: "Puma", href: "/product?brand=Puma" },
  { kind: "brand", id: "converse", label: "Converse", href: "/product?brand=Converse" },
  { kind: "brand", id: "vans", label: "Vans", href: "/product?brand=Vans" },
];

function TickerTrack({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      className={`flex items-center shrink-0 ${
        duplicate ? "shoes4us-marquee-duplicate" : ""
      }`}
      aria-hidden={duplicate ? true : undefined}
    >
      {TICKER_ITEMS.map((item, idx) => (
        <div
          key={`${duplicate ? "dup" : "main"}-${item.label}-${idx}`}
          className="inline-flex items-center gap-6 px-5 py-2.5 border-r border-[#262626] shrink-0"
        >
          {item.kind === "brand" ? (
            <Link
              to={item.href}
              tabIndex={duplicate ? -1 : undefined}
              className="inline-flex items-center gap-2 text-neutral-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            >
              <BrandLogoMark id={item.id} className="h-4 w-auto max-w-[42px]" />
              <span className="text-xs font-bold uppercase tracking-[0.08em]">
                {item.label}
              </span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-200 whitespace-nowrap">
              {item.highlight && (
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 bg-[#d91e2a] shrink-0"
                />
              )}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HomeTickerMarquee() {
  return (
    <section
      aria-label="Sorotan Merek dan Keuntungan Belanja"
      className="bg-[#0a0a0a] text-white border-y border-[#262626] shoes4us-marquee selection:bg-white selection:text-black"
    >
      <div className="shoes4us-marquee-track">
        <TickerTrack />
        <TickerTrack duplicate />
      </div>
    </section>
  );
}
