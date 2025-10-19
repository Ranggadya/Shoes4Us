import { z } from "zod";
import { ValidationError } from "@/exceptions/ValidationError";

export const AddWishlistSchema = z.object({
  productId: z
    .string()
    .uuid("Product ID tidak valid")
    .refine((val) => val.trim().length > 0, {
      message: "Product ID wajib diisi",
    }),
});

export const RemoveWishlistSchema = z.object({
  productId: z
    .string()
    .uuid("Product ID tidak valid")
    .refine((val) => val.trim().length > 0, {
      message: "Product ID wajib diisi",
    }),
});

export type AddWishlistInput = z.infer<typeof AddWishlistSchema>;
export type RemoveWishlistInput = z.infer<typeof RemoveWishlistSchema>;

export function validateAddWishlist(data: unknown): AddWishlistInput {
  const result = AddWishlistSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const message = Object.values(errors).flat().join(", ");
    throw new ValidationError(message || "Input tidak valid");
  }
  return result.data;
}

export function validateRemoveWishlist(data: unknown): RemoveWishlistInput {
  const result = RemoveWishlistSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const message = Object.values(errors).flat().join(", ");
    throw new ValidationError(message || "Input tidak valid");
  }
  return result.data;
}
