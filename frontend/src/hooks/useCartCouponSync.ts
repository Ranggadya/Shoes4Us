import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ApiError, api } from "@/services/api";
import { formatCurrency } from "@/utils/format";
import type { CouponValidationResult } from "@/types";

export const SAVED_COUPON_STORAGE_KEY = "shoes4us_applied_coupon";
export const SAVED_COUPON_META_KEY = "shoes4us_applied_coupon_meta";

const COUPON_REVALIDATE_DEBOUNCE_MS = 300;

type CouponValidationMeta = {
  code: string;
  subtotal: number;
  shippingFee: number;
};

/** Persist applied coupon and the subtotal/shipping context it was validated against. */
export function savePersistedCoupon(
  coupon: CouponValidationResult | null,
  subtotal?: number,
  shippingFee = 0
): void {
  try {
    if (!coupon) {
      sessionStorage.removeItem(SAVED_COUPON_STORAGE_KEY);
      sessionStorage.removeItem(SAVED_COUPON_META_KEY);
      return;
    }

    sessionStorage.setItem(SAVED_COUPON_STORAGE_KEY, JSON.stringify(coupon));
    if (typeof subtotal === "number" && Number.isFinite(subtotal)) {
      const meta: CouponValidationMeta = {
        code: coupon.code,
        subtotal,
        shippingFee,
      };
      sessionStorage.setItem(SAVED_COUPON_META_KEY, JSON.stringify(meta));
    } else {
      sessionStorage.removeItem(SAVED_COUPON_META_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function loadPersistedCoupon(): CouponValidationResult | null {
  try {
    const raw = sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CouponValidationResult) : null;
  } catch {
    return null;
  }
}

function loadPersistedValidationKey(
  coupon: CouponValidationResult | null
): string | null {
  if (!coupon) return null;
  try {
    const raw = sessionStorage.getItem(SAVED_COUPON_META_KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw) as Partial<CouponValidationMeta>;
    if (
      meta.code === coupon.code &&
      typeof meta.subtotal === "number" &&
      typeof meta.shippingFee === "number"
    ) {
      return `${meta.code}:${meta.subtotal}:${meta.shippingFee}`;
    }
    return null;
  } catch {
    return null;
  }
}

type UseCartCouponSyncOptions = {
  subtotal: number;
  shippingFee?: number;
  isReady: boolean;
  /** Disable revalidation once an order has been submitted on checkout. */
  frozen?: boolean;
};

/**
 * Synchronizes session-persisted promo coupons with the active cart subtotal
 * and shipping fee, revalidating debounced on drift or mount mismatch while
 * preserving valid coupons across transient 5xx/network errors.
 */
export function useCartCouponSync({
  subtotal,
  shippingFee = 0,
  isReady,
  frozen = false,
}: UseCartCouponSyncOptions) {
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(() => loadPersistedCoupon());

  const appliedCouponRef = useRef<CouponValidationResult | null>(appliedCoupon);
  appliedCouponRef.current = appliedCoupon;

  // Track exact `${code}:${subtotal}:${shippingFee}` that the server actually confirmed.
  const lastValidatedKeyRef = useRef<string | null>(
    loadPersistedValidationKey(appliedCoupon)
  );

  const applyCoupon = useCallback(
    (nextCoupon: CouponValidationResult | null) => {
      lastValidatedKeyRef.current = nextCoupon
        ? `${nextCoupon.code}:${subtotal}:${shippingFee}`
        : null;
      savePersistedCoupon(nextCoupon, subtotal, shippingFee);
      setAppliedCoupon(nextCoupon);
    },
    [subtotal, shippingFee]
  );

  const restoreCouponSnapshot = useCallback(
    (previousCoupon: CouponValidationResult | null) => {
      if (!previousCoupon || appliedCouponRef.current) return;
      lastValidatedKeyRef.current = null;
      savePersistedCoupon(previousCoupon);
      setAppliedCoupon(previousCoupon);
    },
    []
  );

  const clearCoupon = useCallback(() => {
    lastValidatedKeyRef.current = null;
    savePersistedCoupon(null);
    setAppliedCoupon(null);
  }, []);

  useEffect(() => {
    if (!isReady || frozen || !appliedCoupon) return;

    if (subtotal === 0) {
      lastValidatedKeyRef.current = null;
      savePersistedCoupon(null);
      setAppliedCoupon(null);
      return;
    }

    if (subtotal < appliedCoupon.minOrderAmount) {
      const droppedCode = appliedCoupon.code;
      const minSpend = appliedCoupon.minOrderAmount;
      lastValidatedKeyRef.current = null;
      savePersistedCoupon(null);
      setAppliedCoupon(null);
      toast.error(
        `Voucher ${droppedCode} dilepas karena minimal belanja ${formatCurrency(
          minSpend
        )} belum terpenuhi.`
      );
      return;
    }

    const validationKey = `${appliedCoupon.code}:${subtotal}:${shippingFee}`;
    if (lastValidatedKeyRef.current === validationKey) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.post<{
          success: boolean;
          data: CouponValidationResult;
        }>("/coupons/validate", {
          code: appliedCoupon.code,
          subtotal,
          shippingFee,
        });

        if (cancelled) return;
        if (res?.data) {
          lastValidatedKeyRef.current = validationKey;
          savePersistedCoupon(res.data, subtotal, shippingFee);
          setAppliedCoupon((prev) => {
            if (
              prev &&
              prev.code === res.data.code &&
              prev.discountAmount === res.data.discountAmount &&
              prev.description === res.data.description
            ) {
              return prev;
            }
            return res.data;
          });
        }
      } catch (err) {
        if (cancelled) return;
        // Only strip an active coupon on explicit 4xx validation rejection; preserve across 5xx/offline blips.
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          lastValidatedKeyRef.current = null;
          savePersistedCoupon(null);
          setAppliedCoupon(null);
          toast.error(err.message);
        }
      }
    }, COUPON_REVALIDATE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isReady, frozen, subtotal, shippingFee, appliedCoupon]);

  const isCouponEligible = Boolean(
    appliedCoupon && subtotal >= appliedCoupon.minOrderAmount
  );

  return {
    appliedCoupon,
    appliedCouponRef,
    isCouponEligible,
    applyCoupon,
    restoreCouponSnapshot,
    clearCoupon,
  };
}
