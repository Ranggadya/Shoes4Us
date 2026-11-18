export const RECENTLY_VIEWED_STORAGE_KEY = "shoes4us_recently_viewed_v1";
export const RECENTLY_VIEWED_UPDATED_EVENT = "shoes4us:recently-viewed-updated";
const MAX_RECENTLY_VIEWED = 6;

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  brand?: string | null;
  audience?: string | null;
  isSale?: boolean;
  averageRating?: number;
  reviewCount?: number;
  viewedAt: number;
}

function parseStoredProducts(raw: string | null): RecentlyViewedProduct[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentlyViewedProduct =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as RecentlyViewedProduct).id === "string" &&
        typeof (item as RecentlyViewedProduct).name === "string" &&
        typeof (item as RecentlyViewedProduct).price === "number" &&
        Number.isFinite((item as RecentlyViewedProduct).price)
    );
  } catch {
    return [];
  }
}

export function loadRecentlyViewed(
  excludeProductId?: string
): RecentlyViewedProduct[] {
  try {
    const items = parseStoredProducts(
      localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY)
    );
    const filtered = excludeProductId
      ? items.filter((item) => item.id !== excludeProductId)
      : items;
    return filtered.slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(
  product: Omit<RecentlyViewedProduct, "viewedAt">
): RecentlyViewedProduct[] {
  if (!product?.id || !product?.name || !Number.isFinite(product.price)) {
    return loadRecentlyViewed();
  }

  const sanitized: RecentlyViewedProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl ?? null,
    brand: product.brand ?? null,
    audience: product.audience ?? null,
    isSale: Boolean(product.isSale),
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    viewedAt: Date.now(),
  };

  try {
    const existing = parseStoredProducts(
      localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY)
    ).filter((item) => item.id !== sanitized.id);

    const next = [sanitized, ...existing].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT));
    }
    return next;
  } catch {
    return [sanitized];
  }
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_UPDATED_EVENT));
    }
  } catch {
    // Ignore storage errors
  }
}
