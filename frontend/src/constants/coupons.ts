export type PromoVoucherItem = {
  code: string;
  label: string;
  title: string;
  rule: string;
  benefit: string;
  minSubtotal: number;
  ctaHref: string;
};

/**
 * Canonical Shoes4Us promotional vouchers aligned with backend `domain.DefaultCoupons`.
 */
export const PROMO_VOUCHERS: readonly PromoVoucherItem[] = [
  {
    code: "DISKON10",
    label: "DISKON10 (10%)",
    title: "Diskon 10% Semua Koleksi",
    rule: "Min. Rp 100rb",
    benefit: "Potongan hingga Rp 50.000",
    minSubtotal: 100000,
    ctaHref: "/product",
  },
  {
    code: "HEMAT50RB",
    label: "HEMAT50RB (Rp 50rb)",
    title: "Potongan Langsung Rp 50.000",
    rule: "Min. Rp 300rb",
    benefit: "Berlaku untuk pesanan >= Rp 300rb",
    minSubtotal: 300000,
    ctaHref: "/product?sortBy=price-desc",
  },
  {
    code: "GRATISONGKIR",
    label: "GRATISONGKIR",
    title: "Subsidi Ongkir s.d. Rp 25.000",
    rule: "Min. Rp 150rb",
    benefit: "Otomatis dipotong di Checkout",
    minSubtotal: 150000,
    ctaHref: "/product?collection=new-arrivals",
  },
];
