import { NextRequest } from "next/server";
import { UsersController } from "@/layers/controllers/UsersController";
import { handleError } from "@/exceptions/handlerError";
import { requireAdmin } from "@/lib/auth";

const controller = UsersController;

export async function GET(req: NextRequest): Promise<Response> {
  try {
    await requireAdmin(req);
    return await controller.getAll(req);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    await requireAdmin(req);
    return await controller.createUser(req);
  } catch (error) {
    return handleError(error);
  }
}
