import { CartRepository } from "../repositories/CartRepository";
import { ProductRepository } from "../repositories/ProductRepository";
import { AppError } from "@/exceptions/AppError";

export class CartService {
  private readonly cartRepo = new CartRepository();
  private readonly productRepo = new ProductRepository();

  async getCart(userId: string) {
    const cart = await this.cartRepo.findByUserId(userId);

    if (!cart) {
      return {
        id: "",
        items: [],
        totals: { subtotal: 0, totalItems: 0 },
      };
    }

    // Transform data and calculate totals
    const items = cart.items.map((item) => {
      const price = Number(item.product.price);
      const lineTotal = price * item.quantity;
      return {
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: price,
          imageUrl: item.product.imageUrl,
        },
        quantity: item.quantity,
        size: item.size,
        lineTotal: lineTotal,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items,
      totals: {
        subtotal,
        totalItems,
      },
    };
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    size?: string | null
  ) {
    const cart = await this.cartRepo.getOrCreateCart(userId);

    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new AppError("Produk tidak ditemukan", 404);
    }

    const priceSnap = Number(product.price);
    
    // Optional: Check stock before adding
    const isAvailable = await this.productRepo.checkStockAvailability(productId, quantity);
    if (!isAvailable) {
      throw new AppError(`Stok produk "${product.name}" tidak mencukupi`, 400);
    }

    return await this.cartRepo.upsertItem(cart.id, productId, priceSnap, quantity, size ?? null);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.cartRepo.getOrCreateCart(userId);
    
    // Logic setItemQuantity in repository already handles deletion if quantity <= 0
    return await this.cartRepo.setItemQuantity(cart.id, itemId, quantity);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.cartRepo.getOrCreateCart(userId);
    return await this.cartRepo.setItemQuantity(cart.id, itemId, 0);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepo.findByUserId(userId);
    if (cart) {
      await this.cartRepo.clear(cart.id);
    }
    return { message: "Cart cleared" };
  }
}
