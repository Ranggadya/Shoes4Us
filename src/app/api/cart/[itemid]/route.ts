import { NextRequest } from "next/server";
import { CartController } from "@/layers/controllers/CartController";
import { handleError } from "@/exceptions/handlerError";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
): Promise<Response> {
  try {
    return await CartController.updateItem(req, params);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
): Promise<Response> {
  try {
    return await CartController.removeItem(req, params);
  } catch (e) {
    return handleError(e);
  }
}
