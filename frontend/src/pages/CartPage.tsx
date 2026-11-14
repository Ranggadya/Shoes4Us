import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart, type CartItem } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { api } from "@/services/api";
import { formatCurrency, resolveProductBrand } from "@/utils/format";
import { formatShoeSizeLabel } from "@/utils/size-converter";
import SEO from "@/components/SEO";
import CartSkeleton from "@/components/skeletons/CartSkeleton";
import EmptyCart from "@/components/empty-states/EmptyCart";
import CouponInput, { SAVED_COUPON_STORAGE_KEY } from "@/components/CouponInput";
import { buildWhatsAppSupportUrl } from "@/components/WhatsAppSupportButton";
import type { CouponValidationResult } from "@/types";

const FALLBACK_SHOE_IMAGE = "/sepatu1.jpeg";
const COUPON_REVALIDATE_DEBOUNCE_MS = 300;
const ESTIMATED_MIN_SHIPPING_FEE = 16000;

function persistCoupon(coupon: CouponValidationResult | null) {
  try {
    if (coupon) {
      sessionStorage.setItem(SAVED_COUPON_STORAGE_KEY, JSON.stringify(coupon));
    } else {
      sessionStorage.removeItem(SAVED_COUPON_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    isLoading,
    error,
    syncWarnings,
    clearSyncWarnings,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    refresh,
  } = useCart();
  const { isWishlisted, toggleProduct } = useWishlist();

  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidationResult | null>(() => {
      try {
        const raw = sessionStorage.getItem(SAVED_COUPON_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as CouponValidationResult) : null;
      } catch {
        return null;
      }
    });

  const [pendingItemIds, setPendingItemIds] = useState<Record<string, boolean>>(
    {}
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const clearTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelDialogBtnRef = useRef<HTMLButtonElement>(null);
  const wasConfirmOpenRef = useRef(false);

  const subtotal = cart?.totals?.subtotal ?? 0;
  const totalItems = cart?.totals?.totalItems ?? 0;
  const items = cart?.items ?? [];

  const appliedCouponRef = useRef<CouponValidationResult | null>(appliedCoupon);
  appliedCouponRef.current = appliedCoupon;

  const lastValidatedKeyRef = useRef<string | null>(
    appliedCoupon ? `${appliedCoupon.code}:${subtotal}` : null
  );

  const handleApplyCoupon = useCallback(
    (nextCoupon: CouponValidationResult | null) => {
      lastValidatedKeyRef.current = nextCoupon
        ? `${nextCoupon.code}:${subtotal}`
        : null;
      persistCoupon(nextCoupon);
      setAppliedCoupon(nextCoupon);
    },
    [subtotal]
  );

  useEffect(() => {
    if (isLoading || error || !cart || !appliedCoupon) return;

    if (subtotal === 0) {
      lastValidatedKeyRef.current = null;
      persistCoupon(null);
      setAppliedCoupon(null);
      return;
    }

    if (subtotal < appliedCoupon.minOrderAmount) {
      const droppedCode = appliedCoupon.code;
      const minSpend = appliedCoupon.minOrderAmount;
      lastValidatedKeyRef.current = null;
      persistCoupon(null);
      setAppliedCoupon(null);
      toast.error(
        `Voucher ${droppedCode} dilepas karena minimal belanja ${formatCurrency(
          minSpend
        )} belum terpenuhi.`
      );
      return;
    }

    const validationKey = `${appliedCoupon.code}:${subtotal}`;
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
          shippingFee: 0,
        });

        if (cancelled) return;
        lastValidatedKeyRef.current = validationKey;
        if (res?.data) {
          persistCoupon(res.data);
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
        const msg = err instanceof Error ? err.message : "";
        const lowerMsg = msg.toLowerCase();
        // Only invalidate voucher on explicit server rejection, preserve on transient network errors.
        if (
          msg &&
          !lowerMsg.includes("network") &&
          !lowerMsg.includes("failed to fetch")
        ) {
          lastValidatedKeyRef.current = null;
          persistCoupon(null);
          setAppliedCoupon(null);
          toast.error(msg);
        }
      }
    }, COUPON_REVALIDATE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLoading, error, cart, subtotal, appliedCoupon]);

  useEffect(() => {
    if (showClearConfirm) {
      wasConfirmOpenRef.current = true;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      cancelDialogBtnRef.current?.focus();

      const getFocusableElements = () => {
        if (!dialogRef.current) return [];
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        return Array.from(nodes);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !isClearing) {
          setShowClearConfirm(false);
          return;
        }

        if (event.key === "Tab") {
          const focusable = getFocusableElements();
          if (focusable.length === 0) {
            event.preventDefault();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement as HTMLElement | null;

          if (event.shiftKey) {
            if (active === first || !dialogRef.current?.contains(active)) {
              event.preventDefault();
              last.focus();
            }
          } else if (active === last || !dialogRef.current?.contains(active)) {
            event.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else if (wasConfirmOpenRef.current) {
      wasConfirmOpenRef.current = false;
      clearTriggerRef.current?.focus();
    }
  }, [showClearConfirm, isClearing]);

  const isCouponEligible = Boolean(
    appliedCoupon && subtotal >= appliedCoupon.minOrderAmount
  );
  const isFreeShippingCoupon =
    isCouponEligible && appliedCoupon?.discountType === "FREE_SHIPPING";
  const productDiscountAmount =
    isCouponEligible && appliedCoupon && !isFreeShippingCoupon
      ? appliedCoupon.discountAmount
      : 0;
  const finalTotal = Math.max(0, subtotal - productDiscountAmount);

  const setItemPending = (itemId: string, busy: boolean) => {
    setPendingItemIds((prev) => {
      if (busy) {
        return { ...prev, [itemId]: true };
      }
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleDecrease = async (item: CartItem) => {
    if (item.quantity <= 1 || pendingItemIds[item.id] || isClearing) return;
    setItemPending(item.id, true);
    try {
      await updateItemQuantity(item.id, item.quantity - 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah jumlah produk."
      );
    } finally {
      setItemPending(item.id, false);
    }
  };

  const handleIncrease = async (item: CartItem) => {
    if (pendingItemIds[item.id] || isClearing) return;
    setItemPending(item.id, true);
    try {
      await updateItemQuantity(item.id, item.quantity + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengubah jumlah produk."
      );
    } finally {
      setItemPending(item.id, false);
    }
  };

  const handleMoveToWishlist = async (item: CartItem) => {
    if (!user) {
      toast("Silakan login untuk menyimpan ke Wishlist.");
      navigate("/login?redirect=/cart");
      return;
    }
    if (pendingItemIds[item.id] || isClearing) return;

    setItemPending(item.id, true);
    try {
      const alreadyWishlisted = isWishlisted(item.product.id);
      if (!alreadyWishlisted) {
        await toggleProduct(item.product.id);
      }
      await removeItem(item.id);
      toast.success(
        alreadyWishlisted
          ? `${item.product.name} sudah ada di Wishlist Anda.`
          : `${item.product.name} dipindahkan ke Wishlist.`
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memindahkan produk ke Wishlist."
      );
    } finally {
      setItemPending(item.id, false);
    }
  };

  const handleRemove = async (item: CartItem) => {
    if (pendingItemIds[item.id] || isClearing) return;
    setItemPending(item.id, true);

    const couponBeforeRemove = appliedCouponRef.current;
    const snapshot = {
      productId: item.product.id,
      quantity: item.quantity,
      size: item.size ?? undefined,
      productSnapshot: item.product,
    };

    try {
      await removeItem(item.id);
      toast(
        (t) => (
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="font-medium">
              {item.product.name} dihapus dari keranjang.
            </span>
            <button
              type="button"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await addItem(snapshot);
                  if (couponBeforeRemove && !appliedCouponRef.current) {
                    lastValidatedKeyRef.current = null;
                    persistCoupon(couponBeforeRemove);
                    setAppliedCoupon(couponBeforeRemove);
                  }
                  toast.success("Produk dikembalikan ke keranjang.");
                } catch (restoreErr) {
                  toast.error(
                    restoreErr instanceof Error
                      ? restoreErr.message
                      : "Gagal mengembalikan produk."
                  );
                }
              }}
              className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-white underline underline-offset-4 hover:text-neutral-200 min-h-[32px] px-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Urungkan</span>
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus produk."
      );
    } finally {
      setItemPending(item.id, false);
    }
  };

  const handleConfirmClear = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearCart();
      lastValidatedKeyRef.current = null;
      persistCoupon(null);
      setAppliedCoupon(null);
      setShowClearConfirm(false);
      toast.success("Keranjang berhasil dikosongkan");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengosongkan keranjang."
      );
    } finally {
      setIsClearing(false);
    }
  };

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await refresh();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Keranjang masih kosong.");
      return;
    }

    if (!user) {
      toast("Silakan login untuk melanjutkan pembayaran.");
      navigate("/login?redirect=/payment");
      return;
    }

    navigate("/payment");
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === "1") return;
    img.dataset.fallbackApplied = "1";
    img.src = FALLBACK_SHOE_IMAGE;
  };

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  const hasItems = !isLoading && !error && items.length > 0;
  const whatsappHelpUrl = buildWhatsAppSupportUrl(
    undefined,
    typeof window !== "undefined" ? window.location.href : undefined
  );

  return (
    <section
      aria-labelledby="cart-page-heading"
      className={`bg-white text-neutral-900 max-w-6xl mx-auto px-4 sm:px-6 my-8 ${
        hasItems ? "pb-28 lg:pb-6" : ""
      }`}
    >
      <SEO
        title="Keranjang Belanja"
        description="Periksa kembali sepatu pilihan Anda, terapkan kode voucher promo, dan lanjutkan ke pengiriman di Shoes4Us."
      />

      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-neutral-200 pb-4 mb-6">
        <div className="flex items-baseline gap-3">
          <h1
            id="cart-page-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-neutral-900"
          >
            KERANJANG ANDA
          </h1>
          {hasItems && (
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600 tabular-nums">
              ({totalItems} Produk)
            </span>
          )}
        </div>

        {hasItems && (
          <Link
            to="/product"
            className={`min-h-[44px] px-2 -mr-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-neutral-800 hover:text-black hover:underline underline-offset-4 transition-colors ${focusRing}`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Lanjut Belanja</span>
          </Link>
        )}
      </div>

      {syncWarnings.length > 0 && (
        <div
          role="alert"
          className="border border-amber-700 bg-amber-50 p-4 mb-6 flex items-start justify-between gap-3 text-amber-950"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle
              className="w-5 h-5 text-amber-800 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-sm space-y-1">
              <p className="font-bold">
                Sebagian item keranjang tamu tidak dapat disinkronkan:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-xs sm:text-sm">
                {syncWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSyncWarnings}
            aria-label="Tutup peringatan sinkronisasi"
            className={`min-w-[44px] min-h-[44px] -my-1.5 -mr-1.5 inline-flex items-center justify-center text-amber-900 hover:text-black shrink-0 ${focusRing}`}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {isLoading ? (
        <CartSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4 my-8"
        >
          <div className="w-12 h-12 border border-red-300 bg-white mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-700" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-red-900">
              Gagal Memuat Keranjang
            </h2>
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleRetry()}
            disabled={isRetrying}
            className={`min-h-[44px] px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-[0.08em] hover:bg-neutral-800 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors ${focusRing}`}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{isRetrying ? "Memuat ulang..." : "Muat Ulang Keranjang"}</span>
          </button>
        </div>
      ) : !cart || items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 min-w-0">
            <h2 className="sr-only">Daftar Produk di Keranjang</h2>
            <ul className="divide-y divide-neutral-200 border border-neutral-200 bg-white">
              {items.map((item) => {
                const isItemBusy =
                  Boolean(pendingItemIds[item.id]) || isClearing;
                const itemLabel = item.size
                  ? `${item.product.name} ukuran ${item.size}`
                  : item.product.name;
                const itemBrand = resolveProductBrand(
                  item.product.name,
                  item.product.brand,
                  null,
                  "Shoes4Us"
                );
                const formattedSize = formatShoeSizeLabel(item.size);

                return (
                  <li
                    key={item.id}
                    aria-busy={isItemBusy}
                    className="p-4 sm:p-5 flex flex-col gap-3.5"
                  >
                    {/* Tier 1: Product visual, details, and line total */}
                    <div className="flex items-start justify-between gap-3.5 sm:gap-4 w-full">
                      <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                        <Link
                          to={`/product/${item.product.id}`}
                          tabIndex={-1}
                          aria-hidden="true"
                          className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white overflow-hidden shrink-0 border border-neutral-200 p-1.5 flex items-center justify-center"
                        >
                          <img
                            src={item.product.imageUrl || FALLBACK_SHOE_IMAGE}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            width={96}
                            height={96}
                            onError={handleImageError}
                            className="w-full h-full object-contain"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base sm:text-lg leading-snug text-neutral-900 line-clamp-2 break-words">
                            <Link
                              to={`/product/${item.product.id}`}
                              className={`hover:underline underline-offset-4 ${focusRing}`}
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="text-neutral-600 text-xs sm:text-sm mt-1 tabular-nums">
                            {itemBrand}
                            {formattedSize ? ` · Ukuran: ${formattedSize}` : ""}
                          </p>
                          <p className="text-neutral-600 text-xs sm:text-sm mt-0.5 tabular-nums">
                            Harga satuan: {formatCurrency(item.product.price)}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-sm sm:text-base text-neutral-900 tabular-nums shrink-0 text-right">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>

                    {/* Tier 2: Deterministic quantity stepper and item actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100 sm:pl-28">
                      <div className="inline-flex items-center border border-neutral-300 bg-white">
                        <button
                          type="button"
                          className={`min-w-[44px] min-h-[44px] px-3 py-2 text-base font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent inline-flex items-center justify-center transition-colors ${focusRing}`}
                          onClick={() => void handleDecrease(item)}
                          disabled={item.quantity <= 1 || isItemBusy}
                          aria-label={`Kurangi jumlah ${itemLabel}`}
                        >
                          −
                        </button>
                        <span
                          className="min-w-[2.5rem] px-2 py-2 text-center text-sm font-semibold tabular-nums border-x border-neutral-300"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className={`min-w-[44px] min-h-[44px] px-3 py-2 text-base font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent inline-flex items-center justify-center transition-colors ${focusRing}`}
                          onClick={() => void handleIncrease(item)}
                          disabled={isItemBusy}
                          aria-label={`Tambah jumlah ${itemLabel}`}
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          className={`min-w-[44px] min-h-[44px] px-2.5 py-2 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-black hover:underline underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${focusRing}`}
                          onClick={() => void handleMoveToWishlist(item)}
                          disabled={isItemBusy}
                          aria-label={`Simpan ${item.product.name} ke Wishlist`}
                        >
                          <Bookmark className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Simpan
                            <span className="hidden sm:inline"> ke Wishlist</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`min-w-[44px] min-h-[44px] px-2.5 sm:px-3 py-2 inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-red-700 hover:text-red-800 hover:underline underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${focusRing}`}
                          onClick={() => void handleRemove(item)}
                          disabled={isItemBusy}
                          aria-label={`Hapus ${itemLabel} dari keranjang`}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex justify-end">
              <button
                ref={clearTriggerRef}
                type="button"
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing}
                className={`min-h-[44px] px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-red-700 hover:underline underline-offset-4 transition-colors disabled:opacity-45 ${focusRing}`}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kosongkan Keranjang</span>
              </button>
            </div>
          </div>

          <aside aria-label="Ringkasan Pesanan" className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
              <h2 className="text-base font-bold uppercase tracking-[0.08em] text-neutral-900 pb-3 mb-4 border-b border-neutral-200">
                Ringkasan Pesanan
              </h2>

              <div aria-live="polite" className="space-y-2.5 mb-4 text-sm">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Jumlah Produk</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {totalItems}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Estimasi Ongkir</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    Mulai {formatCurrency(ESTIMATED_MIN_SHIPPING_FEE)}
                  </span>
                </div>
                {productDiscountAmount > 0 && appliedCoupon && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Diskon ({appliedCoupon.code})</span>
                    <span className="tabular-nums">
                      - {formatCurrency(productDiscountAmount)}
                    </span>
                  </div>
                )}
                {isFreeShippingCoupon && appliedCoupon && (
                  <div className="flex justify-between gap-2 text-emerald-800 font-semibold">
                    <span>Subsidi Ongkir ({appliedCoupon.code})</span>
                    <span className="tabular-nums text-right">
                      s.d. {formatCurrency(appliedCoupon.discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              <CouponInput
                subtotal={subtotal}
                appliedCoupon={appliedCoupon}
                onApply={handleApplyCoupon}
                collapsible
              />

              <div
                aria-live="polite"
                className="border-t border-neutral-300 pt-4 mb-4 space-y-1"
              >
                <div className="flex justify-between items-baseline font-bold text-base text-neutral-900">
                  <span>Estimasi Total</span>
                  <span className="text-lg tabular-nums">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  {isFreeShippingCoupon
                    ? "Subsidi ongkir akan memotong biaya kurir dan dihitung di checkout."
                    : "Tarif pasti dipilih sesuai kurir di halaman pengiriman."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className={`w-full min-h-[44px] bg-black text-white py-3 px-4 font-bold uppercase tracking-[0.08em] hover:bg-neutral-800 transition-colors text-xs ${focusRing}`}
              >
                {user
                  ? "Lanjut ke Pengiriman →"
                  : "Login & Lanjut ke Pengiriman →"}
              </button>

              {!user && (
                <p className="text-xs text-neutral-600 text-center mt-2.5">
                  Keranjang Anda akan otomatis tersimpan ke akun setelah login.
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="w-4 h-4 text-neutral-900 shrink-0"
                    aria-hidden="true"
                  />
                  <span>100% Original · Tukar ukuran 7 hari</span>
                </div>
                <p className="text-neutral-600 pl-6">
                  Pembayaran: QRIS · Transfer Bank · Kartu Kredit
                </p>
                <a
                  href={whatsappHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-h-[44px] inline-flex items-center gap-2 text-xs font-semibold text-neutral-800 hover:text-black underline underline-offset-4 ${focusRing}`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Butuh bantuan ukuran? Chat CS WhatsApp</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {hasItems && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur-sm border-t border-neutral-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                Estimasi Total
              </p>
              <p className="text-base font-extrabold text-neutral-900 tabular-nums truncate">
                {formatCurrency(finalTotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              aria-label={
                user
                  ? "Lanjut ke pengiriman sekarang"
                  : "Login dan lanjut ke pengiriman"
              }
              className={`min-h-[44px] shrink-0 bg-black text-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] hover:bg-neutral-800 transition-colors ${focusRing}`}
            >
              {user ? "Checkout →" : "Login & Lanjut →"}
            </button>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/55"
          onClick={() => {
            if (!isClearing) setShowClearConfirm(false);
          }}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-cart-title"
            aria-describedby="clear-cart-desc"
            className="w-full max-w-md bg-white border border-neutral-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="clear-cart-title"
              className="text-lg font-extrabold uppercase tracking-tight text-neutral-900"
            >
              Kosongkan Seluruh Keranjang?
            </h2>
            <p
              id="clear-cart-desc"
              className="mt-2 text-sm text-neutral-600"
            >
              Semua {totalItems} produk di keranjang Anda akan dihapus dan kupon
              aktif ikut dilepas. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
              <button
                ref={cancelDialogBtnRef}
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirm(false)}
                className={`min-h-[44px] px-4 py-2.5 border border-neutral-300 bg-white text-neutral-900 text-xs font-bold uppercase tracking-[0.08em] hover:bg-neutral-100 disabled:opacity-50 transition-colors ${focusRing}`}
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={() => void handleConfirmClear()}
                className={`min-h-[44px] px-4 py-2.5 bg-red-700 text-white text-xs font-bold uppercase tracking-[0.08em] hover:bg-red-800 disabled:opacity-50 transition-colors ${focusRing}`}
              >
                {isClearing
                  ? "Mengosongkan..."
                  : "Ya, Kosongkan Keranjang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
