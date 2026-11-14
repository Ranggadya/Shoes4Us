import { useEffect, useId, useRef, useState } from "react";
import { Ticket, CheckCircle2, X, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/services/api";
import {
  SAVED_COUPON_STORAGE_KEY,
  savePersistedCoupon,
} from "@/hooks/useCartCouponSync";
import { formatCurrency } from "@/utils/format";
import type { CouponValidationResult } from "@/types";

export { SAVED_COUPON_STORAGE_KEY };

const QUICK_VOUCHERS = [
  {
    code: "DISKON10",
    label: "DISKON10 (10%)",
    rule: "Min. Rp 100rb",
    minSubtotal: 100000,
  },
  {
    code: "HEMAT50RB",
    label: "HEMAT50RB (Rp 50rb)",
    rule: "Min. Rp 300rb",
    minSubtotal: 300000,
  },
  {
    code: "GRATISONGKIR",
    label: "GRATISONGKIR",
    rule: "Min. Rp 150rb",
    minSubtotal: 150000,
  },
];

type CouponInputProps = {
  subtotal: number;
  shippingFee?: number;
  appliedCoupon: CouponValidationResult | null;
  onApply: (result: CouponValidationResult | null) => void;
  disabled?: boolean;
  collapsible?: boolean;
};

export default function CouponInput({
  subtotal,
  shippingFee = 0,
  appliedCoupon,
  onApply,
  disabled = false,
  collapsible = false,
}: CouponInputProps) {
  const inputId = useId();
  const errorId = useId();
  const panelId = useId();
  const [code, setCode] = useState(appliedCoupon?.code || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsible || Boolean(appliedCoupon));
  const wasAppliedRef = useRef(Boolean(appliedCoupon));

  useEffect(() => {
    if (appliedCoupon) {
      setExpanded(true);
    } else if (wasAppliedRef.current) {
      setCode("");
      setErrorMsg(null);
    }
    wasAppliedRef.current = Boolean(appliedCoupon);
  }, [appliedCoupon]);

  const validateCode = async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Masukkan kode voucher terlebih dahulu");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post<{
        success: boolean;
        data: CouponValidationResult;
      }>("/coupons/validate", {
        code: clean,
        subtotal,
        shippingFee,
      });

      if (res.data) {
        setCode(res.data.code);
        savePersistedCoupon(res.data, subtotal, shippingFee);
        onApply(res.data);
        toast.success(`Voucher ${res.data.code} berhasil dipasang!`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Kode voucher tidak valid";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setErrorMsg(null);
    savePersistedCoupon(null);
    onApply(null);
  };

  const appliedBenefitLabel = (() => {
    if (!appliedCoupon) return "";
    if (appliedCoupon.discountType === "FREE_SHIPPING") {
      if (shippingFee > 0) {
        return `Hemat ongkir ${formatCurrency(
          Math.min(shippingFee, appliedCoupon.discountAmount)
        )}`;
      }
      return `Gratis ongkir s.d. ${formatCurrency(
        appliedCoupon.discountAmount
      )} (dihitung di checkout)`;
    }
    return `Hemat ${formatCurrency(appliedCoupon.discountAmount)}`;
  })();

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  const showBody = !collapsible || Boolean(appliedCoupon) || expanded;

  return (
    <div className="border border-neutral-200 bg-white p-4 my-4">
      {collapsible && !appliedCoupon ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={`w-full min-h-[44px] -my-1 flex items-center justify-between gap-2 text-left transition-colors ${focusRing}`}
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-neutral-900">
            <Ticket className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Punya kode voucher? ({QUICK_VOUCHERS.length} tersedia)
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-neutral-700 shrink-0 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <Ticket
            className="w-4 h-4 text-neutral-900 shrink-0"
            aria-hidden="true"
          />
          {appliedCoupon ? (
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-900">
              Kupon Promo / Voucher Diskon
            </span>
          ) : (
            <label
              htmlFor={inputId}
              className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-900 cursor-pointer"
            >
              Kupon Promo / Voucher Diskon
            </label>
          )}
        </div>
      )}

      {showBody && (
        <div
          id={panelId}
          className={collapsible && !appliedCoupon ? "mt-3 pt-3 border-t border-neutral-200" : undefined}
        >
          {appliedCoupon ? (
            <div className="flex items-start justify-between gap-2 bg-emerald-50 border border-emerald-700 px-3.5 py-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <CheckCircle2
                  className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold tracking-[0.08em] bg-emerald-800 text-white px-2 py-0.5">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-900 tabular-nums">
                      {appliedBenefitLabel}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    {appliedCoupon.description}
                  </p>
                </div>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className={`text-neutral-700 hover:text-red-700 min-w-[44px] min-h-[44px] -my-1.5 -mr-2 inline-flex items-center justify-center shrink-0 transition-colors ${focusRing}`}
                  aria-label={`Hapus voucher ${appliedCoupon.code}`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-stretch gap-2">
                <input
                  id={inputId}
                  type="text"
                  value={code}
                  aria-label={
                    collapsible ? "Masukkan kode voucher diskon" : undefined
                  }
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errorMsg) setErrorMsg(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void validateCode(code);
                    }
                  }}
                  aria-invalid={Boolean(errorMsg)}
                  aria-describedby={errorMsg ? errorId : undefined}
                  disabled={disabled || loading}
                  placeholder="Masukkan kode (cth: DISKON10)"
                  className="flex-1 min-w-0 min-h-[44px] px-3 py-2 text-base sm:text-xs font-semibold uppercase tracking-wider text-neutral-900 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-neutral-500 border border-neutral-300 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 disabled:bg-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => void validateCode(code)}
                  disabled={disabled || loading || !code.trim()}
                  className={`min-h-[44px] min-w-[72px] px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-[0.08em] hover:bg-neutral-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 ${focusRing}`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    "Pakai"
                  )}
                </button>
              </div>

              {errorMsg && (
                <p
                  id={errorId}
                  role="alert"
                  className="text-xs text-red-700 mt-2 font-medium"
                >
                  {errorMsg}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-neutral-600 w-full">
                  Promo tersedia:
                </span>
                {QUICK_VOUCHERS.map((v) => {
                  const belowMin = subtotal < v.minSubtotal;
                  const shortfall = v.minSubtotal - subtotal;
                  return (
                    <button
                      key={v.code}
                      type="button"
                      disabled={disabled || loading || belowMin}
                      onClick={() => {
                        setCode(v.code);
                        void validateCode(v.code);
                      }}
                      title={
                        belowMin
                          ? `Tambah ${formatCurrency(shortfall)} lagi untuk ${v.code}`
                          : `Gunakan kode ${v.code}`
                      }
                      className={`min-h-[44px] min-w-[44px] px-3 py-1.5 text-left text-xs tabular-nums border transition-colors inline-flex flex-col justify-center ${
                        belowMin
                          ? "bg-neutral-100 text-neutral-500 border-neutral-200 cursor-not-allowed"
                          : "bg-neutral-50 text-neutral-900 border-neutral-300 hover:bg-neutral-100 hover:border-black"
                      } disabled:opacity-75 ${focusRing}`}
                    >
                      <span className="font-bold leading-tight">{v.label}</span>
                      <span className="text-[11px] font-normal text-neutral-600 leading-tight mt-0.5">
                        {v.rule}
                        {belowMin ? ` · kurang ${formatCurrency(shortfall)}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
