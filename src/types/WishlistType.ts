// src/types/WishlistType.ts
import { Product } from "@prisma/client";

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  product?: Product; // ✅ Include relasi produk jika di-join
}

export interface AddWishlistInput {
  productId: string;
}

export interface RemoveWishlistInput {
  productId: string;
}
