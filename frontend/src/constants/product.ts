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

export const createDefaultSizeStocks = (): ProductSizeStock[] =>
  DEFAULT_SHOE_SIZES.map((size) => ({
    size,
    stock: 0,
  }));

