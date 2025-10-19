import { NextRequest } from "next/server";
import { ProductController } from "@/layers/controllers/ProductController";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/exceptions/handlerError";

const controller = new ProductController();

/**
 * GET /api/admin/products
 * ✅ Mendapatkan semua produk (admin only)
 */
export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireAdmin(req);
    return controller.getAll(req);
  } catch (e) {
    return handleError(e);
  }
};

/**
 * POST /api/admin/products
 * ✅ Membuat produk baru (admin only)
 */
export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    await requireAdmin(req);
    return controller.create(req);
  } catch (e) {
    return handleError(e);
  }
};
