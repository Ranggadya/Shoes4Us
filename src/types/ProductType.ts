export interface ProductCreateInput {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
}

export interface ProductUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string | null;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductFilterInput {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}