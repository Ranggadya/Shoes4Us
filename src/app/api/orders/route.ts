import { NextRequest } from "next/server";
import { OrderController } from "@/layers/controllers/OrderController";
import { handleError } from "@/exceptions/handlerError";

const controller = new OrderController();

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await controller.getMyOrders(req);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await controller.createOrder(req);
  } catch (error) {
    return handleError(error);
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
