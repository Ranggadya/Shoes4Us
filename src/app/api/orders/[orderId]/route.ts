import { NextRequest } from "next/server";
import { OrderController } from "@/layers/controllers/OrderController";
import { handleError } from "@/exceptions/handlerError";

const controller = new OrderController();

/**
 * ✅ GET /api/orders/:orderId
 * Menampilkan detail pesanan user
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    return await controller.getOrderDetail(req, resolvedParams);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    return await controller.cancelOrder(req, resolvedParams);
  } catch (error) {
    return handleError(error);
  }
}
