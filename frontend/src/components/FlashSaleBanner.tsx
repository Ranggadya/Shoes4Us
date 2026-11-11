import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

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

  useEffect(() => {
    const timer = setInterval(() => {
      const next = calculateCountdown(endTimestamp);
      setCountdown(next);
      if (next.expired) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTimestamp]);

  if (countdown.expired) return null;

  return (
    <section
      aria-label="Promo Flash Sale"
      className="bg-gray-950 text-white border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bbf7d0] text-gray-950 text-xs font-extrabold tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 fill-current" />
            LIMITED SNEAKER DROP
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-200">
            Diskon s/d <span className="font-bold text-white">20% OFF</span> +
            Voucher <span className="font-mono font-bold text-[#bbf7d0]">DISKON10</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1.5 text-xs font-mono font-bold"
            aria-label="Waktu tersisa promo"
          >
            <span className="bg-white/10 px-2 py-1 rounded-lg">
              {countdown.hours}j
            </span>
            <span>:</span>
            <span className="bg-white/10 px-2 py-1 rounded-lg">
              {countdown.minutes}m
            </span>
            <span>:</span>
            <span className="bg-white/10 px-2 py-1 rounded-lg">
              {countdown.seconds}d
            </span>
          </div>

          <Link
            to="/product?sale=true"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-gray-950 px-3.5 py-1.5 rounded-full hover:bg-gray-200 transition"
          >
            Belanja Drop
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

