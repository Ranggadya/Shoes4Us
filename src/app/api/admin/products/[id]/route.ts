import { NextRequest } from "next/server";
import { ProductController } from "@/layers/controllers/ProductController";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/exceptions/handlerError";

const controller = new ProductController();

export const PATCH = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    await requireAdmin(req);
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    return controller.update(id, req);
  } catch (e) {
    return handleError(e);
  }
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> => {
  try {
    await requireAdmin(req);
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    return controller.delete(id);
  } catch (e) {
    return handleError(e);
  }
};
