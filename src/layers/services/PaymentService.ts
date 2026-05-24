import { AppError } from "@/exceptions/AppError";
import { OrderRepository } from "../repositories/OrderRepository";
import { CartService } from "./CartService";
import { OrderStatus } from "@prisma/client";

export class PaymentService {
  private readonly orderRepo = new OrderRepository();
  private readonly cartService = new CartService();

  async createPayment(orderId: string, userId: string) {
    if (!orderId) throw new AppError("Order ID wajib diisi", 400);

    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError("Pesanan tidak ditemukan", 404);
    if (order.userId !== userId) throw new AppError("Unauthorized", 403);

    await this.orderRepo.updateStatus(orderId, OrderStatus.PAID);
    await this.cartService.clearCart(userId);

    // Dummy midtrans integration
    return {
      token: "dummy-midtrans-token-" + orderId,
      redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/dummy-token"
    };
  }

  async handleNotification(_body: Record<string, unknown>) {
    // Dummy notification handler
    return { message: "Notification handled" };
  }
}
