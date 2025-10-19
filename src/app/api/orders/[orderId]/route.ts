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
  { params }: { params: { orderId: string } }
): Promise<Response> {
  try {
    return await controller.getOrderDetail(req, params);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
): Promise<Response> {
  try {
    return await controller.cancelOrder(req, params);
  } catch (error) {
    return handleError(error);
  }
}
