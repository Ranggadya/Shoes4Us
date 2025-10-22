import { NextRequest } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { OrderService } from "@/layers/services/OrderService";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "@/layers/validators/OrderValidator";
import { ValidationError } from "@/exceptions/ValidationError";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";
import { OrderStatus } from "@prisma/client";

export class OrderController {
  private readonly service = new OrderService();

  async getMyOrders(req: NextRequest): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const { searchParams } = new URL(req.url);

      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 20);

      const result = await this.service.listMine(user.userId, page, limit);
      const response = {
        orders: result.data,
        total: result.pagination.total,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
      };

      return createSuccessResponse(response, "Daftar pesanan berhasil diambil");
    } catch (e) {
      return handleError(e);
    }
  }

  async getOrderDetail(
    req: NextRequest,
    params: { orderId: string }
  ): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const order = await this.service.get(params.orderId);

      if (order.userId !== user.userId && user.role !== "ADMIN") {
        throw new UnauthorizedError("Anda tidak memiliki akses ke pesanan ini");
      }

      return createSuccessResponse(order, "Detail pesanan berhasil diambil");
    } catch (e) {
      return handleError(e);
    }
  }

  async createOrder(req: NextRequest): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const body = await req.json();

      const parsed = createOrderSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Data pesanan tidak valid");
      }

      const order = await this.service.checkout(user.userId, parsed.data);
      return createSuccessResponse(order, "Pesanan berhasil dibuat");
    } catch (e) {
      return handleError(e);
    }
  }

  async updateOrderStatus(
    req: NextRequest,
    params: { orderId: string }
  ): Promise<Response> {
    try {
      const user = await requireAuth(req);
      if (user.role !== "ADMIN") {
        throw new UnauthorizedError("Hanya admin yang dapat mengubah status pesanan");
      }

      const body = await req.json();
      const parsed = updateOrderStatusSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Data status tidak valid");
      }
      const updated = await this.service.updateStatus(
        params.orderId,
        parsed.data.status,
        user.role
      );

      return createSuccessResponse(
        updated,
        "Status pesanan berhasil diperbarui"
      );
    } catch (e) {
      return handleError(e);
    }
  }

  async cancelOrder(
    req: NextRequest,
    params: { orderId: string }
  ): Promise<Response> {
    try {
      const user = await requireAuth(req);
      const order = await this.service.get(params.orderId);

      if (order.userId !== user.userId && user.role !== "ADMIN") {
        throw new UnauthorizedError(
          "Anda tidak memiliki izin untuk membatalkan pesanan ini"
        );
      }

      const result = await this.service.updateStatus(
        params.orderId,
        "CANCELLED",
        user.role
      );
      return createSuccessResponse(result, "Pesanan berhasil dibatalkan");
    } catch (e) {
      return handleError(e);
    }
  }

  async getAllOrdersForAdmin(
    page = 1,
    limit = 100,
    status?: OrderStatus
  ) {
    const result = await this.service.listAll(page, limit, status);
    return {
      data: result.data,
      pagination: result.pagination,
    };
  }
}
