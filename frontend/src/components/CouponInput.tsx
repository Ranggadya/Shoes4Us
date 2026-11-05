import { useState } from "react";
import { Ticket, CheckCircle2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/format";
import type { CouponValidationResult } from "@/types";

export const SAVED_COUPON_STORAGE_KEY = "shoes4us_applied_coupon";

const QUICK_VOUCHERS = [
  { code: "DISKON10", label: "DISKON10 (10%)" },
  { code: "HEMAT50RB", label: "HEMAT50RB (Rp 50rb)" },
  { code: "GRATISONGKIR", label: "GRATISONGKIR" },
];

type CouponInputProps = {
  subtotal: number;
  shippingFee?: number;
  appliedCoupon: CouponValidationResult | null;
  onApply: (result: CouponValidationResult | null) => void;
  disabled?: boolean;
};

export default function CouponInput({
  subtotal,
  shippingFee = 0,
  appliedCoupon,
  onApply,
  disabled = false,
}: CouponInputProps) {
  const [code, setCode] = useState(appliedCoupon?.code || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        onApply(res.data);
        try {
          sessionStorage.setItem(
            SAVED_COUPON_STORAGE_KEY,
            JSON.stringify(res.data)
          );
        } catch {
          // ignore storage errors
        }
        toast.success(`Voucher ${res.data.code} berhasil dipasang!`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Kode voucher tidak valid";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setErrorMsg(null);
    onApply(null);
    try {
      sessionStorage.removeItem(SAVED_COUPON_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="border border-slate-200 bg-white rounded-xl p-4 my-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Ticket size={16} className="text-blue-600" />
        <span className="text-sm font-bold text-slate-800">
          Kupon Promo / Voucher Diskon
        </span>
      </div>

      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2
              size={18}
              className="text-emerald-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold tracking-wide bg-emerald-600 text-white px-2 py-0.5 rounded">
                  {appliedCoupon.code}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  Hemat {formatCurrency(appliedCoupon.discountAmount)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                {appliedCoupon.description}
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-slate-400 hover:text-red-600 p-1 transition"
              aria-label="Hapus voucher"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (errorMsg) setErrorMsg(null);
              }}
              disabled={disabled || loading}
              placeholder="Masukkan kode (cth: DISKON10)"
              className="flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => void validateCode(code)}
              disabled={disabled || loading || !code.trim()}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Pakai"
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">
              {errorMsg}
            </p>
          )}

          {/* Quick Voucher Suggestions */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Tersedia:</span>
            {QUICK_VOUCHERS.map((v) => (
              <button
                key={v.code}
                type="button"
                disabled={disabled || loading}
                onClick={() => {
                  setCode(v.code);
                  void validateCode(v.code);
                }}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
