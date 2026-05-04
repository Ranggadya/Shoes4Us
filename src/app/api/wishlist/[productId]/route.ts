import { NextRequest } from "next/server";
import { WishlistController } from "@/layers/controllers/WishlistController";
import { handleError } from "@/exceptions/handlerError";

/** ✅ DELETE /api/wishlist/:productId — hapus 1 item */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    return await WishlistController.removeFromWishlist(req, { params: resolvedParams });
  } catch (error) {
    return handleError(error);
  }
}
