
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
    quantity: number,
    size?: string | null
  ) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, productId, size },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } },
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

    return prisma.cartItem.create({
      data: { cartId, productId, quantity, priceSnap, size },
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
    const existingItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });

    if (!existingItem) {
      return null;
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
      return null;
    }

    return prisma.cartItem.update({
      where: { id: existingItem.id },
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
    return prisma.cartItem.deleteMany({
      where: { cartId, productId },
    });
  }

  async clear(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  }

  async findCartItem(cartId: string, productId: string) {
    return prisma.cartItem.findFirst({
      where: { cartId, productId },
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
