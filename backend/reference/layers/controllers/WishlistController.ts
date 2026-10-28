import { NextRequest } from "next/server";
import { createSuccessResponse } from "@/exceptions/handlerError";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";

export class WishlistController {
  static async getMyWishlist(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    const fields = req.nextUrl.searchParams.get("fields");

    if (fields === "ids") {
      const items = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
      });

      return createSuccessResponse({ items });
    }

    const items = await prisma.wishlist.findMany({
      where: { userId },
      select: {
        id: true,
        productId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            stock: true,
            slug: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });
    return createSuccessResponse({ items });
  }

  static async addToWishlist(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    const body = await req.json();
    const item = await prisma.wishlist.create({
      data: {
        userId,
        productId: body.productId,
      }
    });
    return createSuccessResponse(item);
  }

  static async clearWishlist(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    await prisma.wishlist.deleteMany({
      where: { userId }
    });
    return createSuccessResponse({ message: "Wishlist cleared" });
  }

  static async removeFromWishlist(req: NextRequest, context: { params: { productId: string } }) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();
    await prisma.wishlist.deleteMany({
      where: {
        userId,
        productId: context.params.productId
      }
    });
    return createSuccessResponse({ message: "Item removed from wishlist" });
  }
}
