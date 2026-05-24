import { NextRequest } from "next/server";
import { CartService } from "../services/CartService";
import { createSuccessResponse } from "@/exceptions/handlerError";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";
import { ValidationError } from "@/exceptions/ValidationError";
import { addToCartSchema, updateCartItemSchema } from "@/layers/validators/CartValidator";

export class CartController {
  private static readonly cartService = new CartService();

  static async getMyCart(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    
    const result = await this.cartService.getCart(userId);
    return createSuccessResponse(result);
  }

  static async addToCart(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();

    const rawBody = await req.json();

    const parsed = addToCartSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((issue) => issue.message).join(", ")
      );
    }

    const { productId, quantity, size } = parsed.data;
    const result = await this.cartService.addToCart(userId, productId, quantity, size ?? null);
    
    return createSuccessResponse(result);
  }

  static async clearCart(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    
    const result = await this.cartService.clearCart(userId);
    return createSuccessResponse(result);
  }

  static async updateItem(req: NextRequest, params: { itemId: string }) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();

    const rawBody = await req.json();

    const parsed = updateCartItemSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((issue) => issue.message).join(", ")
      );
    }

    const result = await this.cartService.updateItem(userId, params.itemId, parsed.data.quantity);
    return createSuccessResponse(result);
  }

  static async removeItem(req: NextRequest, params: { itemId: string }) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    
    const result = await this.cartService.removeItem(userId, params.itemId);
    return createSuccessResponse(result);
  }
}
