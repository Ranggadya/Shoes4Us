
import { prisma } from "@/lib/prisma";

export class CartRepository {
  async findByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                imageUrl: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }
  async createCart(userId: string) {
    return prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                imageUrl: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async getOrCreateCart(userId: string) {
    let cart = await this.findByUserId(userId);
    if (!cart) cart = await this.createCart(userId);
    return cart;
  }

  async upsertItem(
    cartId: string,
    productId: string,
    priceSnap: number,
    quantity: number
  ) {
    return prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity, priceSnap },
      update: { quantity: { increment: quantity } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    });
  }

  async setItemQuantity(cartId: string, itemId: string, quantity: number) {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return null;
    }

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    });
  }
  async removeItem(cartId: string, productId: string) {
    return prisma.cartItem.delete({
      where: { cartId_productId: { cartId, productId } },
    });
  }

  async clear(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async findCartItem(cartId: string, productId: string) {
    return prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    });
  }
}
