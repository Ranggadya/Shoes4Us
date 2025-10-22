import { CartService } from "@/layers/services/CartService";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "@/layers/validators/CartValidator";
import { ValidationError } from "@/exceptions/ValidationError";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";

const service = new CartService();

export class CartController {
  static async getMyCart(req: NextRequest): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const result = await service.getMyCart(user.userId);
      return createSuccessResponse(result, "Keranjang berhasil dimuat");
    } catch (e) {
      return handleError(e);
    }
  }

  static async addToCart(req: NextRequest): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const body = await req.json();

      const parsed = addToCartSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Data input tidak valid");
      }

      const { productId, quantity } = parsed.data;
      const result = await service.addToCart(user.userId, productId, quantity);
      return createSuccessResponse(result, "Produk berhasil ditambahkan ke keranjang");
    } catch (e) {
      return handleError(e);
    }
  }

  static async updateItem(req: NextRequest, params: { id: string }): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const body = await req.json();

      const parsed = updateCartItemSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Data input tidak valid");
      }

      const { quantity } = parsed.data;
      const result = await service.updateItemQuantity(user.userId, params.id, quantity);
      return createSuccessResponse(result, "Jumlah item diperbarui");
    } catch (e) {
      return handleError(e);
    }
  }

  static async removeItem(req: NextRequest, params: { id: string }): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const result = await service.removeItem(user.userId, params.id);
      return createSuccessResponse(result, "Item berhasil dihapus dari keranjang");
    } catch (e) {
      return handleError(e);
    }
  }

  static async clearCart(req: NextRequest): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const result = await service.clearCart(user.userId);
      return createSuccessResponse(result, "Keranjang berhasil dikosongkan");
    } catch (e) {
      return handleError(e);
    }
  }
}
