import { NextRequest } from "next/server";
import { WishlistController } from "@/layers/controllers/WishlistController";
import { handleError } from "@/exceptions/handlerError";

/** ✅ DELETE /api/wishlist/:productId — hapus 1 item */
export async function DELETE(
  req: NextRequest,
  context: { params: { productId: string } }
): Promise<Response> {
  try {
    return await WishlistController.removeFromWishlist(req, context);
  } catch (error) {
    return handleError(error);
  }
}
