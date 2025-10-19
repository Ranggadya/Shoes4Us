import { NextRequest } from "next/server";
import { ProductController } from "@/layers/controllers/ProductController";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/exceptions/handlerError";

const controller = new ProductController();

/**
 * PATCH /api/admin/products/:id
 * ✅ Update data produk (admin only)
 */
export const PATCH = async (
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> => {
  try {
    await requireAdmin(req);
    const { id } = context.params;
    return controller.update(id, req);
  } catch (e) {
    return handleError(e);
  }
};

/**
 * DELETE /api/admin/products/:id
 * ✅ Menghapus produk (admin only)
 */
export const DELETE = async (
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> => {
  try {
    await requireAdmin(req);
    const { id } = context.params;
    return controller.delete(id);
  } catch (e) {
    return handleError(e);
  }
};
