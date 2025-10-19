import { NextRequest } from "next/server";
import { WishlistService } from "@/layers/services/WishlistService";
import { requireAuth } from "@/lib/auth";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { validateAddWishlist } from "@/layers/validators/WishlistValidator";

export class WishlistController {
    private static readonly service = new WishlistService();

    /** ✅ Ambil semua wishlist milik user */
    static async getMyWishlist(req: NextRequest) {
        try {
            const user = await requireAuth(req);
            const result = await this.service.getMyWishlist(user.userId);
            return createSuccessResponse(result, "Wishlist berhasil dimuat");
        } catch (error) {
            return handleError(error);
        }
    }

    /** ✅ Tambahkan produk ke wishlist */
    static async addToWishlist(req: NextRequest) {
        try {
            const user = await requireAuth(req);
            const body = await req.json();
            const parsed = validateAddWishlist(body);

            const result = await this.service.addToWishlist(user.userId, parsed.productId);
            return createSuccessResponse(result, "Produk berhasil ditambahkan ke wishlist");
        } catch (error) {
            return handleError(error);
        }
    }

    /** ✅ Hapus 1 produk dari wishlist */
    static async removeFromWishlist(
        req: NextRequest,
        { params }: { params: { productId: string } }
    ) {
        try {
            const user = await requireAuth(req);
            const result = await this.service.removeFromWishlist(user.userId, params.productId);
            return createSuccessResponse(result, "Produk berhasil dihapus dari wishlist");
        } catch (e) {
            return handleError(e);
        }
    }


    /** ✅ Kosongkan seluruh wishlist */
    static async clearWishlist(req: NextRequest) {
        try {
            const user = await requireAuth(req);
            const result = await this.service.clearWishlist(user.userId);
            return createSuccessResponse(result, "Wishlist berhasil dikosongkan");
        } catch (error) {
            return handleError(error);
        }
    }
}
