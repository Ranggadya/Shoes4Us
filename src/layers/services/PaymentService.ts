// src/layers/services/PaymentService.ts
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { AppError } from "@/exceptions/AppError";
import { OrderStatus } from "@prisma/client";

export class PaymentService {
  /** 🔹 Membuat transaksi ke Midtrans */
  async createPayment(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) throw new AppError("Order tidak ditemukan", 404);
    if (order.userId !== userId) throw new AppError("Tidak memiliki izin", 403);
    if (order.status !== "PENDING") throw new AppError("Order sudah dibayar atau dibatalkan", 400);

    // 🔹 Konversi Decimal ke number
    const totalAmount = Number(order.totalAmount);

    // 🔹 Konfigurasi transaksi Midtrans
    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: order.user.name ?? "User",
        email: order.user.email,
      },
      item_details: [
        {
          id: order.id,
          price: totalAmount,
          quantity: 1,
          name: `Pembayaran Order #${order.id}`,
        },
      ],
    };

    // 🔹 Buat transaksi Midtrans
    const transaction = await snap.createTransaction(parameter);

    // 🔹 Simpan URL pembayaran ke database
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentUrl: transaction.redirect_url },
    });

    return {
      orderId: order.id,
      paymentUrl: transaction.redirect_url,
    };
  }

  /** 🔹 Callback dari Midtrans (notifikasi status) */
  async handleNotification(notification: Record<string, unknown>) {
    const order_id = notification["order_id"] as string;
    const transaction_status = notification["transaction_status"] as string;

    if (!order_id) throw new AppError("Notifikasi tidak valid", 400);

    let newStatus: OrderStatus = OrderStatus.PENDING;

    if (transaction_status === "settlement") newStatus = OrderStatus.PAID;
    else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    )
      newStatus = OrderStatus.CANCELLED;

    await prisma.order.update({
      where: { id: order_id },
      data: { status: newStatus },
    });

    return { orderId: order_id, status: newStatus };
  }
}
