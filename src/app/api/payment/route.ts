// src/app/api/payment/route.ts
import { NextRequest } from "next/server";
import { PaymentService } from "@/layers/services/PaymentService";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { requireAuth } from "@/lib/auth";

const paymentService = new PaymentService();

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, message: "orderId wajib diisi" }),
        { status: 400 }
      );
    }

    const result = await paymentService.createPayment(orderId, user.userId);
    return createSuccessResponse(result, "Transaksi pembayaran berhasil dibuat");
  } catch (error) {
    return handleError(error);
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
