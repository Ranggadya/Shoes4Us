
import { z } from 'zod';

const productAudienceSchema = z.enum(["UNISEX", "MEN", "WOMEN", "KIDS"]);
const productSegmentSchema = z.enum(["SHOES", "APPAREL", "ACCESSORIES"]);
const productCollectionSchema = z.enum(["new-arrivals", "exclusive", "coming-soon", "sale"]);
const productSizeStockSchema = z.object({
  size: z.string().trim().min(1).max(10),
  stock: z.number().int().min(0),
});

// Create Product
export const createProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255),
  slug: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').min(0.01),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  brand: z.string().trim().min(1).max(80).nullable().optional(),
  segment: productSegmentSchema.optional(),
  audience: productAudienceSchema.optional(),
  isNewArrival: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
  isSale: z.boolean().optional(),
  sizes: z.array(productSizeStockSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  price: z.number().positive().min(0.01).optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().trim().min(1).max(80).nullable().optional(),
  segment: productSegmentSchema.optional(),
  audience: productAudienceSchema.optional(),
  isNewArrival: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
  isComingSoon: z.boolean().optional(),
  isSale: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sizes: z.array(productSizeStockSchema).optional(),
});

export const productFilterSchema = z
  .object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().optional(),
    segment: productSegmentSchema.optional(),
    audience: productAudienceSchema.optional(),
    brand: z.string().optional(),
    collection: productCollectionSchema.optional(),
    isNewArrival: z.boolean().optional(),
    isExclusive: z.boolean().optional(),
    isComingSoon: z.boolean().optional(),
    isSale: z.boolean().optional(),
    minPrice: z.number().nonnegative().optional(),
    maxPrice: z.number().nonnegative().optional(),
    sortBy: z
      .enum([
        "newest",
        "oldest",
        "price-asc",
        "price-desc",
        "price-low",
        "price-high",
        "name-asc",
        "name-desc",
      ])
      .optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
  })
  .refine(
    (data) =>
      !data.minPrice ||
      !data.maxPrice ||
      data.minPrice <= data.maxPrice,
    {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice', 'maxPrice'],
    }
  );
