import { NextRequest } from "next/server";
import { ForgotPasswordController } from "@/layers/controllers/ForgotPasswordController";
import { handleError } from "@/exceptions/handlerError";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await ForgotPasswordController.handle(req);
  } catch (error) {
    return handleError(error);
  }
}

/** ✅ Optional: dukungan CORS */
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
