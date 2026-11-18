import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import { useCartDrawer } from "@/context/CartDrawerContext";
import { formatCurrency } from "@/utils/format";
import { formatShoeSizeLabel } from "@/utils/size-converter";

export default function CartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawer();
  const { cart, updateItemQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  const items = cart?.items ?? [];
  const totalItems = cart?.totals.totalItems ?? 0;
  const subtotal = cart?.totals.subtotal ?? 0;

  const handleQuantityChange = async (itemId: string, nextQuantity: number) => {
    if (busyItemId) return;
    setBusyItemId(itemId);
    try {
      await updateItemQuantity(itemId, nextQuantity);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui jumlah item"
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (busyItemId) return;
    setBusyItemId(itemId);
    try {
      await removeItem(itemId);
      toast.success("Item dihapus dari keranjang");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus item keranjang"
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-heading"
        className="relative z-10 w-full max-w-md h-full bg-white border-l border-neutral-900 shadow-2xl flex flex-col selection:bg-black selection:text-white"
      >
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShoppingBag className="w-5 h-5 text-black shrink-0" aria-hidden="true" />
            <h2
              id="cart-drawer-heading"
              className="text-sm font-extrabold uppercase tracking-[0.08em] text-neutral-950 truncate"
            >
              Keranjang Belanja
            </h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-black text-white tabular-nums">
              {totalItems}
            </span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Tutup keranjang samping"
            className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors ${focusRing}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-14 h-14 border border-neutral-200 bg-neutral-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-neutral-400" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.06em] text-neutral-900 mb-1.5">
                Keranjang Anda Masih Kosong
              </p>
              <p className="text-xs text-neutral-600 max-w-[26ch] leading-relaxed mb-6">
                Jelajahi koleksi sneakers dan sepatu pilihan kami untuk mulai berbelanja.
              </p>
              <Link
                to="/product"
                onClick={closeDrawer}
                className={`min-h-[44px] px-6 bg-black text-white text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center hover:bg-neutral-800 transition-colors ${focusRing}`}
              >
                Lihat Katalog
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {items.map((item) => {
                const isBusy = busyItemId === item.id;
                const imgSrc =
                  item.product.imageUrl &&
                  (item.product.imageUrl.startsWith("http") ||
                    item.product.imageUrl.startsWith("/"))
                    ? item.product.imageUrl
                    : "/sepatu1.jpeg";

                return (
                  <li key={item.id} className="py-4 first:pt-1 last:pb-1">
                    <div className="flex gap-3.5 items-start">
                      <Link
                        to={`/product/${item.product.id}`}
                        onClick={closeDrawer}
                        className="w-20 h-20 border border-neutral-200 bg-neutral-50 shrink-0 overflow-hidden"
                      >
                        <img
                          src={imgSrc}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith("/sepatu1.jpeg")) {
                              target.src = "/sepatu1.jpeg";
                            }
                          }}
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${item.product.id}`}
                            onClick={closeDrawer}
                            className="text-sm font-semibold text-neutral-950 hover:underline line-clamp-2 leading-snug"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleRemove(item.id)}
                            aria-label={`Hapus ${item.product.name} dari keranjang`}
                            className={`min-w-[44px] min-h-[44px] -mt-2 -mr-2 inline-flex items-center justify-center text-neutral-500 hover:text-[#dc2626] disabled:opacity-40 transition-colors shrink-0 ${focusRing}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

                        {item.size && (
                          <p className="text-xs text-neutral-600 mt-0.5 tabular-nums">
                            Ukuran: {formatShoeSizeLabel(item.size)}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center border border-neutral-300 bg-white">
                            <button
                              type="button"
                              disabled={isBusy || item.quantity <= 1}
                              onClick={() =>
                                void handleQuantityChange(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                              aria-label={`Kurangi jumlah ${item.product.name}`}
                              className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-neutral-800 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${focusRing}`}
                            >
                              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <span
                              data-testid={`drawer-qty-${item.id}`}
                              className="w-8 text-center text-xs font-bold text-neutral-950 tabular-nums"
                            >
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleQuantityChange(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                              aria-label={`Tambah jumlah ${item.product.name}`}
                              className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-neutral-800 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${focusRing}`}
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-neutral-950 tabular-nums">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-200 bg-[#fafafa] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 font-medium">
                Subtotal ({totalItems} item)
              </span>
              <span className="text-base font-extrabold text-neutral-950 tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/cart"
                onClick={closeDrawer}
                className={`min-h-[44px] px-3 border border-neutral-300 bg-white text-neutral-900 text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center hover:border-black hover:bg-neutral-50 transition-colors ${focusRing}`}
              >
                Lihat Keranjang
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  navigate("/payment");
                }}
                className={`min-h-[44px] px-3 bg-black text-white text-xs font-bold uppercase tracking-[0.08em] inline-flex items-center justify-center hover:bg-neutral-800 transition-colors ${focusRing}`}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
