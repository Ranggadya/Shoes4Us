export type ProductAudience = "UNISEX" | "MEN" | "WOMEN" | "KIDS";
export type ProductSegment = "SHOES" | "APPAREL" | "ACCESSORIES";
export type ProductCollection = "new-arrivals" | "exclusive" | "coming-soon" | "sale";

export interface ProductSizeStockInput {
  size: string;
  stock: number;
}

export interface ProductCreateInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
  brand?: string | null;
  segment?: ProductSegment;
  audience?: ProductAudience;
  isNewArrival?: boolean;
  isExclusive?: boolean;
  isComingSoon?: boolean;
  isSale?: boolean;
  sizes?: ProductSizeStockInput[];
}

export interface ProductUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string | null;
  categoryId?: string;
  brand?: string | null;
  segment?: ProductSegment;
  audience?: ProductAudience;
  isNewArrival?: boolean;
  isExclusive?: boolean;
  isComingSoon?: boolean;
  isSale?: boolean;
  isActive?: boolean;
  sizes?: ProductSizeStockInput[];
}

export interface ProductFilterInput {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  segment?: ProductSegment;
  audience?: ProductAudience;
  brand?: string;
  collection?: ProductCollection;
  isNewArrival?: boolean;
  isExclusive?: boolean;
  isComingSoon?: boolean;
  isSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}
