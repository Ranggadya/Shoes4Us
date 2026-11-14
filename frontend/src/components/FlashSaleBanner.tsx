import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, X } from "lucide-react";

export const FLASH_BANNER_DISMISS_KEY = "shoes4us_flash_banner_dismissed";
const COUPON_CODE = "DISKON10";

export interface CountdownState {
  hours: string;
  minutes: string;
  seconds: string;
  expired: boolean;
}

export function calculateCountdown(
  targetTimeMs: number,
  nowMs = Date.now()
): CountdownState {
  const diffSec = Math.floor((targetTimeMs - nowMs) / 1000);
  if (diffSec <= 0) {
    return {
      hours: "00",
      minutes: "00",
      seconds: "00",
      expired: true,
    };
  }
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    expired: false,
  };
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(FLASH_BANNER_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

type CopyStatus = "idle" | "copied" | "failed";

type FlashSaleBannerProps = {
  targetTimeMs?: number;
};

export default function FlashSaleBanner({
  targetTimeMs,
}: FlashSaleBannerProps) {
  const [endTimestamp] = useState<number>(
    () => targetTimeMs ?? Date.now() + 6 * 3600 * 1000 + 45 * 60 * 1000
  );
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    calculateCountdown(endTimestamp)
  );
  const [dismissed, setDismissed] = useState<boolean>(readDismissed);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      const next = calculateCountdown(endTimestamp);
      setCountdown(next);
      if (next.expired) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTimestamp, dismissed]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  if (dismissed || countdown.expired) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => setCopyStatus("idle"), 2000);
  };

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(FLASH_BANNER_DISMISS_KEY, "1");
    } catch {
      // storage unavailable: still hide for this render cycle
    }
    setDismissed(true);
  };

  const spokenTime = `Sisa waktu promo ${Number(countdown.hours)} jam ${Number(
    countdown.minutes
  )} menit ${Number(countdown.seconds)} detik`;

  const focusRing =
    "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <section
      aria-label="Promo Flash Drop"
      className="bg-black text-white border-b border-white/10 selection:bg-white selection:text-black"
    >
      <div className="max-w-7xl mx-auto h-10 pl-4 sm:pl-6 lg:pl-8 flex items-center gap-4 text-[11px] sm:text-xs uppercase tracking-[0.08em]">
        <Link
          to="/product?sale=true"
          className={`flex items-center gap-2 shrink-0 font-extrabold hover:underline underline-offset-4 decoration-1 ${focusRing}`}
        >
          <span aria-hidden="true" className="w-1.5 h-1.5 bg-[#d91e2a]" />
          <span>Flash Drop</span>
          <span className="font-semibold text-white/70">s/d 20%</span>
        </Link>

        <div className="hidden md:flex items-center gap-2.5 min-w-0">
          <span aria-hidden="true" className="h-3 w-px bg-white/25" />
          <span className="normal-case tracking-normal text-white/70 truncate">
            Ekstra 10% dengan kode
          </span>
          <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label={`Salin kode voucher ${COUPON_CODE}`}
            className={`group inline-flex items-center gap-1.5 h-6 px-2 border border-white/40 font-bold tracking-[0.14em] transition-colors hover:bg-white hover:text-black ${focusRing}`}
          >
            {COUPON_CODE}
            {copyStatus === "copied" ? (
              <Check className="w-3 h-3" aria-hidden="true" />
            ) : (
              <Copy
                className="w-3 h-3 text-white/60 group-hover:text-black"
                aria-hidden="true"
              />
            )}
          </button>
          <span
            role="status"
            className="normal-case tracking-normal text-white/70 min-w-[4.5rem]"
          >
            {copyStatus === "copied" && "Tersalin"}
            {copyStatus === "failed" && "Salin manual"}
          </span>
        </div>

        <div className="ml-auto flex items-center h-full">
          <div
            role="timer"
            aria-live="off"
            aria-label={spokenTime}
            className="flex items-baseline gap-2"
          >
            <span
              aria-hidden="true"
              className="hidden sm:inline normal-case tracking-normal text-white/60"
            >
              Berakhir dalam
            </span>
            <span
              aria-hidden="true"
              className="font-semibold tabular-nums tracking-[0.04em]"
            >
              {countdown.hours}:{countdown.minutes}:{countdown.seconds}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup promo"
            className={`ml-2 sm:ml-3 h-10 w-10 flex items-center justify-center text-white/60 hover:text-white border-l border-white/10 transition-colors ${focusRing} focus-visible:outline-offset-[-4px]`}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
