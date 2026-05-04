import { NextRequest } from "next/server";
import { CartController } from "@/layers/controllers/CartController";
import { handleError } from "@/exceptions/handlerError";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ itemid: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    return await CartController.updateItem(req, { itemId: resolvedParams.itemid });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ itemid: string }> }
): Promise<Response> {
  try {
    const resolvedParams = await context.params;
    return await CartController.removeItem(req, { itemId: resolvedParams.itemid });
  } catch (e) {
    return handleError(e);
  }
}
