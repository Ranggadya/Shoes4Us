import { NextRequest } from "next/server";
import { WishlistController } from "@/layers/controllers/WishlistController";
import { handleError } from "@/exceptions/handlerError";

/** ✅ GET /api/wishlist — ambil semua wishlist user */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await WishlistController.getMyWishlist(req);
  } catch (error) {
    return handleError(error);
  }
}

/** ✅ POST /api/wishlist — tambah produk ke wishlist */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await WishlistController.addToWishlist(req);
  } catch (error) {
    return handleError(error);
  }
}

/** ✅ DELETE /api/wishlist — kosongkan wishlist */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    return await WishlistController.clearWishlist(req);
  } catch (error) {
    return handleError(error);
  }
}
