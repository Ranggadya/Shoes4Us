import { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Ruler,
  ShieldCheck,
} from "lucide-react";

const STORE_PILLARS = [
  {
    icon: ShieldCheck,
    text: "100% Original · Verifikasi Produk Resmi",
  },
  {
    icon: Ruler,
    text: "Pilihan Ukuran Lengkap (US / EU)",
  },
  {
    icon: RefreshCw,
    text: "Garansi Tukar Ukuran 7 Hari",
  },
] as const;

interface AuthEditorialRailProps {
  heading: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  fallbackSrc?: string;
  imageMode?: "contain" | "cover";
  captionLeft: string;
  captionRight: string;
}

/** Shared dark architectural left rail for desktop login and registration gates. */
export default function AuthEditorialRail({
  heading,
  description,
  imageSrc,
  imageAlt,
  fallbackSrc = "/sepatu1.jpeg",
  imageMode = "contain",
  captionLeft,
  captionRight,
}: AuthEditorialRailProps) {
  const handleSpecimenError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const step = img.dataset.fallbackStep;
    if (!step) {
      img.dataset.fallbackStep = "1";
      img.src = fallbackSrc;
      return;
    }
    if (step === "1") {
      img.dataset.fallbackStep = "2";
      img.src = "/logo.jpg";
    }
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:justify-between bg-neutral-950 text-white p-10 xl:p-12 border-r border-neutral-800">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-3 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          <img
            src="/logo.jpg"
            alt="Logo Shoes4Us"
            width={40}
            height={40}
            className="w-10 h-10 object-cover border border-neutral-700 shrink-0"
          />
          <span className="text-xl font-extrabold uppercase tracking-tight text-white">
            Shoes4Us
          </span>
        </Link>

        <div className="mt-10 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight leading-[1.15] text-white text-balance">
            {heading}
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {description}
          </p>

          <div
            className={`bg-neutral-100 border border-neutral-800 ${
              imageMode === "contain" ? "pt-2 pb-3 px-4" : "p-3"
            }`}
          >
            <div className="h-44 overflow-hidden flex items-center justify-center bg-neutral-100">
              <img
                src={imageSrc}
                alt={imageAlt}
                width={340}
                height={176}
                onError={handleSpecimenError}
                className={
                  imageMode === "contain"
                    ? "w-full h-full object-contain scale-[1.28] mix-blend-multiply"
                    : "w-full h-full object-cover object-center"
                }
              />
            </div>
            <div
              className={`${
                imageMode === "contain" ? "mt-1" : "mt-2.5"
              } pt-2.5 border-t border-neutral-300 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-800`}
            >
              <span>{captionLeft}</span>
              <span>{captionRight}</span>
            </div>
          </div>

          <ul className="border-t border-neutral-800 pt-5 space-y-3 tabular-nums">
            {STORE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li
                  key={pillar.text}
                  className="flex items-center gap-3 text-sm text-neutral-200"
                >
                  <Icon
                    className="w-4 h-4 text-white shrink-0"
                    aria-hidden="true"
                  />
                  <span>{pillar.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="pt-8 mt-8 border-t border-neutral-800">
        <Link
          to="/"
          className="group min-h-[44px] w-full px-4 py-2.5 border border-neutral-600 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-white hover:text-black hover:border-white transition-colors inline-flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Kembali ke Toko</span>
          </span>
          <span className="text-[11px] text-neutral-300 group-hover:text-neutral-700 transition-colors">
            Katalog
          </span>
        </Link>
      </div>
    </aside>
  );
}
