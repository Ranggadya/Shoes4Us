import { NextRequest } from "next/server";
import { OrderService } from "../services/OrderService";
import { createSuccessResponse } from "@/exceptions/handlerError";
import { OrderStatus } from "@prisma/client";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";

export class OrderController {
  private readonly orderService = new OrderService();

  async getMyOrders(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");
    if (!userId) throw new UnauthorizedError();

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const status = url.searchParams.get("status") as OrderStatus | undefined;

    if (scope === "all" && role === "ADMIN") {
      const result = await this.orderService.getAllOrdersForAdmin(page, limit, status);
      return createSuccessResponse({ orders: result.data }, `Berhasil mengambil ${result.data.length} pesanan (Admin)`, result.pagination);
    }

    const result = await this.orderService.listMine(userId, page, limit);

    // Kembalikan data + pagination meta secara konsisten
    return createSuccessResponse({ orders: result.data }, `Berhasil mengambil ${result.data.length} pesanan`, result.pagination);
  }

  async createOrder(req: NextRequest) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();

    const body = await req.json();
    const result = await this.orderService.checkout(userId, body);
    return createSuccessResponse(result);
  }

  async getAllOrdersForAdmin(page: number, limit: number, status?: OrderStatus) {
    const result = await this.orderService.getAllOrdersForAdmin(page, limit, status);
    // Kembalikan object dengan data + pagination, bukan raw prisma result
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }

  async getOrderDetail(req: NextRequest, params: { orderId: string }) {
    const order = await this.orderService.get(params.orderId);
    return createSuccessResponse(order);
  }

  async cancelOrder(req: NextRequest, params: { orderId: string }) {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError();

    const result = await this.orderService.updateStatus(params.orderId, "CANCELLED");
    return createSuccessResponse(result);
  }
}
