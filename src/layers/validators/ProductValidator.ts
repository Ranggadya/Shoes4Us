
import { z } from 'zod';

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
});

export const updateProductSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  price: z.number().positive().min(0.01).optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const productFilterSchema = z
  .object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
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
