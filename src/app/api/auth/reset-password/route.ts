// src/app/api/auth/reset-password/route.ts
import { NextRequest } from "next/server";
import { ResetPasswordController } from "@/layers/controllers/ResetPasswordController";
import { handleError } from "@/exceptions/handlerError";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await ResetPasswordController.handle(req);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * ✅ (Opsional) Tambahkan OPTIONS handler untuk CORS
 */
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
