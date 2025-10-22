import { OrderRepository } from "@/layers/repositories/OrderRepository";
import { ProductRepository } from "@/layers/repositories/ProductRepostory";
import { CartRepository } from "@/layers/repositories/CartRepostory";
import { AppError } from "@/exceptions/AppError";
import { CreateOrderInput } from "@/types/OrderType";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export class OrderService {
  private readonly orderRepo = new OrderRepository();
  private readonly productRepo = new ProductRepository();
  private readonly cartRepo = new CartRepository();

  private readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["PAID", "CANCELLED"],
    PAID: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  async listMine(userId: string, page = 1, limit = 20) {
    if (!userId) throw new AppError("User ID wajib diisi", 400);
    return this.orderRepo.findAllOrders(userId, page, limit);
  }

  async listAll(page = 1, limit = 20, status?: OrderStatus) {
    return this.orderRepo.findAllOrders(undefined, page, limit, status);
  }

  async get(orderId: string) {
    if (!orderId) throw new AppError("Order ID wajib diisi", 400);
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError("Pesanan tidak ditemukan", 404);
    return order;
  }

  async checkout(userId: string, orderData: CreateOrderInput) {
    if (!userId) throw new AppError("User ID wajib diisi", 400);

    const cart = await this.cartRepo.findByUserId(userId);
    if (!cart || cart.items.length === 0)
      throw new AppError("Keranjang Anda kosong", 400);

    const items = cart.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      price: Number(it.product.price),
      size: it.size ?? null,
    }));

    const totalAmount = items.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const order = await this.orderRepo.createOrder(
      userId,
      orderData,
      items,
      totalAmount
    );

    await Promise.all(
      order.items.map((item) =>
        this.productRepo.adjustStock(item.productId, -item.quantity)
      )
    );

    await this.cartRepo.clear(cart.id);

    return {
      message: "Pesanan berhasil dibuat",
      order,
    };
  }

  async updateStatus(orderId: string, newStatus: OrderStatus, userRole: string = "USER") {
    if (!orderId) throw new AppError("Order ID wajib diisi", 400);

    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError("Pesanan tidak ditemukan", 404);

    const allowedTransitions = this.ALLOWED_TRANSITIONS[order.status as OrderStatus];

    if (userRole !== "ADMIN" && !allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Perubahan status tidak valid: ${order.status} → ${newStatus}`,
        400
      );
    }
    if (newStatus === "CANCELLED") {
      await Promise.all(
        order.items.map((item) =>
          this.productRepo.adjustStock(item.productId, item.quantity)
        )
      );
    }

    const updatedOrder = await this.orderRepo.updateStatus(orderId, newStatus);

    return {
      message: `Status pesanan berhasil diubah menjadi ${newStatus}`,
      order: updatedOrder,
    };
  }

}
