import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/exceptions/handlerError";
import { OrderController } from "@/layers/controllers/OrderController";
import { OrderStatus } from "@prisma/client";

const controller = new OrderController();

export const GET = async (req: NextRequest): Promise<Response> => {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const statusParam = searchParams.get("status");
    const status = statusParam ? (statusParam.toUpperCase() as OrderStatus) : undefined;

    const result = await controller.getAllOrdersForAdmin(page, limit, status);

    return Response.json({
      success: true,
      message: "Daftar pesanan berhasil diambil",
      data: result,
    });
  } catch (e) {
    return handleError(e);
  }
};
