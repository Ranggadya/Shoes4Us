import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  shippingAddress: z
    .string()
    .min(10, { message: "Alamat pengiriman minimal 10 karakter" })
    .max(500),
  shippingCity: z.string().min(2, { message: "Kota wajib diisi" }),
  shippingPostalCode: z.string().min(3, { message: "Kode pos wajib diisi" }),
  shippingPhone: z.string().min(8, { message: "Nomor telepon wajib diisi" }),
  paymentMethod: z.enum(["Kartu Kredit", "QRIS", "Transfer Bank"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, { message: "Minimal satu item dalam pesanan" }),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
