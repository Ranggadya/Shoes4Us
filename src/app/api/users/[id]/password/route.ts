import { NextRequest } from "next/server";
import { UsersController } from "@/layers/controllers/UsersController";
import { handleError } from "@/exceptions/handlerError";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    return await UsersController.changePassword(req, resolvedParams);
  } catch (error) {
    return handleError(error);
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
