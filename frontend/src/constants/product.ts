import type { ProductAudience, ProductSegment, ProductSizeStock } from "@/types";

export interface CatalogCategoryOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export const CATALOG_CATEGORIES: CatalogCategoryOption[] = [
  { value: "Sneakers", label: "Sneakers", icon: "S", description: "Sneakers dan lifestyle" },
  { value: "Sport", label: "Sport", icon: "P", description: "Sepatu olahraga & atletik" },
  { value: "Running", label: "Running", icon: "R", description: "Sepatu lari dan marathon" },
  { value: "Casual", label: "Casual", icon: "C", description: "Sepatu kasual sehari-hari" },
  { value: "Formal", label: "Formal", icon: "F", description: "Sepatu formal & kerja" },
  { value: "Basketball", label: "Basketball", icon: "B", description: "Sepatu basket performa tinggi" },
  { value: "Football", label: "Football", icon: "O", description: "Sepatu sepak bola & futsal" },
  { value: "Training", label: "Training", icon: "T", description: "Sepatu gym & training" },
  { value: "Lifestyle", label: "Lifestyle", icon: "L", description: "Koleksi fashion & streetwear" },
  { value: "Other", label: "Other", icon: "+", description: "Kategori lainnya" },
];

export const PRODUCT_CATEGORIES: string[] = CATALOG_CATEGORIES.map((item) => item.value);

export const PRODUCT_AUDIENCES: Array<{ value: ProductAudience; label: string }> = [
  { value: "UNISEX", label: "Unisex" },
  { value: "MEN", label: "Pria" },
  { value: "WOMEN", label: "Wanita" },
  { value: "KIDS", label: "Anak-Anak" },
];

export const PRODUCT_SEGMENTS: Array<{ value: ProductSegment; label: string }> = [
  { value: "SHOES", label: "Sepatu" },
  { value: "APPAREL", label: "Pakaian" },
  { value: "ACCESSORIES", label: "Aksesoris" },
];

export const DEFAULT_SHOE_SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"] as const;
export const DEFAULT_APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const DEFAULT_ACCESSORIES_SIZES = ["One Size"] as const;

export function getDefaultSizesForSegment(
  segment: ProductSegment | string = "SHOES"
): readonly string[] {
  const normalized = String(segment || "SHOES").toUpperCase();
  if (normalized === "APPAREL") return DEFAULT_APPAREL_SIZES;
  if (normalized === "ACCESSORIES") return DEFAULT_ACCESSORIES_SIZES;
  return DEFAULT_SHOE_SIZES;
}

export const createDefaultSizeStocks = (
  segment: ProductSegment | string = "SHOES"
): ProductSizeStock[] =>
  getDefaultSizesForSegment(segment).map((size) => ({
    size,
    stock: 0,
  }));

/**
 * Merges default segment sizes with existing product_sizes so non-EU sizes
 * (e.g. "42.5", "S", "M", "One Size") are preserved intact across edits.
 */
export function buildEditableSizeStocks(
  segment: ProductSegment | string = "SHOES",
  existingSizes?: ProductSizeStock[] | null
): ProductSizeStock[] {
  const existingMap = new Map<string, ProductSizeStock>();
  const extraSizes: ProductSizeStock[] = [];
  const defaults = getDefaultSizesForSegment(segment);
  const defaultSet = new Set(defaults);

  for (const entry of existingSizes ?? []) {
    const cleanSize = String(entry.size ?? "").trim();
    if (!cleanSize) continue;
    const normalizedEntry: ProductSizeStock = {
      ...(entry.id ? { id: entry.id } : {}),
      size: cleanSize,
      stock: Number(entry.stock ?? 0),
    };
    existingMap.set(cleanSize, normalizedEntry);
    if (!defaultSet.has(cleanSize)) {
      extraSizes.push(normalizedEntry);
    }
  }

  const baseSizes: ProductSizeStock[] = defaults.map((size) => {
    const match = existingMap.get(size);
    return match ? match : { size, stock: 0 };
  });

  return [...baseSizes, ...extraSizes];
}

export function formatSizeLabel(
  size: string,
  segment: ProductSegment | string = "SHOES"
): string {
  const clean = String(size).trim();
  const normalizedSegment = String(segment || "SHOES").toUpperCase();
  if (normalizedSegment === "SHOES" && /^\d+(\.\d+)?$/.test(clean)) {
    return `EU ${clean}`;
  }
  return clean;
}

