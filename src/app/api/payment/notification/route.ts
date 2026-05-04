// src/app/api/payment/notification/route.ts
import { NextRequest } from "next/server";
import { PaymentService } from "@/layers/services/PaymentService";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";

const paymentService = new PaymentService();

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const result = await paymentService.handleNotification(body);

    return createSuccessResponse(result, "Status pembayaran diperbarui");
  } catch (error) {
    return handleError(error);
  }
}
