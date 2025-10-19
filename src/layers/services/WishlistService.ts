import { WishlistRepository } from "@/layers/repositories/WishlistRepository";
import { AppError } from "@/exceptions/AppError";

export class WishlistService {
  private repo = new WishlistRepository();

  async getMyWishlist(userId: string) {
    if (!userId) throw new AppError("User ID tidak valid", 400);
    return this.repo.findByUser(userId);
  }

  async addToWishlist(userId: string, productId: string) {
    if (!userId || !productId)
      throw new AppError("User ID dan Product ID diperlukan", 400);

    const existing = await this.repo.findItem(userId, productId);
    if (existing)
      throw new AppError("Produk sudah ada di wishlist", 400);

    return this.repo.addItem(userId, productId);
  }

  async removeFromWishlist(userId: string, productId: string) {
    const item = await this.repo.findItem(userId, productId);
    if (!item)
      throw new AppError("Produk tidak ditemukan di wishlist", 404);

    return this.repo.removeItem(userId, productId);
  }

  async clearWishlist(userId: string) {
    return this.repo.clearWishlist(userId);
  }
}
