// src/types/order.types.ts
import { OrderStatus } from '@prisma/client';

export type CreateOrderInput = {
  shippingAddress: string;
  note?: string;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
};

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type OrderResponse = {
  id: string;
  orderNumber: string;
  userId: string;
  shippingAddress: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
};
