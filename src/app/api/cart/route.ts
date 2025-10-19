import { NextRequest } from "next/server";
import { CartController } from "@/layers/controllers/CartController";
import { handleError } from "@/exceptions/handlerError";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await CartController.getMyCart(req);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await CartController.addToCart(req);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    return await CartController.clearCart(req);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * ✅ (Opsional) Tambahkan handler OPTIONS untuk CORS preflight
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
