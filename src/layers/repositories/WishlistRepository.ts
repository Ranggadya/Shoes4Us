import { prisma } from "@/lib/prisma";

export class WishlistRepository {
  async findByUser(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findItem(userId: string, productId: string) {
    return prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  async addItem(userId: string, productId: string) {
    return prisma.wishlist.create({
      data: { userId, productId },
      include: { product: true },
    });
  }

  async removeItem(userId: string, productId: string) {
    return prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async clearWishlist(userId: string) {
    return prisma.wishlist.deleteMany({
      where: { userId },
    });
  }
}
