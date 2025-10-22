import { NextRequest } from "next/server";
import { OrderController } from "@/layers/controllers/OrderController";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { requireAuth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

const controller = new OrderController();

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth(req);
    if (user.role === "ADMIN") {
      const { searchParams } = new URL(req.url);
      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 100);
      const statusParam = searchParams.get("status");
      const status = statusParam && statusParam !== "ALL" 
        ? (statusParam as OrderStatus) 
        : undefined;

      console.log("🔍 [API] Admin fetching ALL orders");
      console.log("📊 [API] Params:", { page, limit, status });
      const result = await controller.getAllOrdersForAdmin(page, limit, status);
      
      console.log("📦 [API] Total orders found:", result.data?.length || 0);
      return createSuccessResponse(result, "Daftar pesanan berhasil diambil");
    } else {
      console.log("🔍 [API] User fetching own orders");
      return await controller.getMyOrders(req);
    }
  } catch (error) {
    console.error("❌ [API] Error in GET /api/orders:", error);
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