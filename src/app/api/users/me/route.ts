import { NextRequest } from "next/server";
import { UsersController } from "@/layers/controllers/UsersController";
import { handleError } from "@/exceptions/handlerError";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await UsersController.getProfile(req);
  } catch (error) {
    return handleError(error);
  }
}
