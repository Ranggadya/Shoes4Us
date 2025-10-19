// src/schemas/order.schema.ts
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

/**
 * Schema untuk membuat order baru
 */
export const createOrderSchema = z.object({
  shippingAddress: z
    .string()
    .min(10, { message: 'Shipping address must be at least 10 characters' })
    .max(500, { message: 'Shipping address cannot exceed 500 characters' }),
});

/**
 * Schema untuk update status order
 */
export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
    .refine(val => Object.values(OrderStatus).includes(val), {
      message: 'Invalid order status',
    }),
});

/**
 * Contoh type TypeScript yang bisa dipakai untuk input validasi
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;