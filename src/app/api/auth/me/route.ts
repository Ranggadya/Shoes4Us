import { NextRequest } from "next/server";
import { AuthService } from "@/layers/services/AuthService";
import { handleError } from "@/exceptions/handlerError";
import { requireAuth } from "@/lib/auth";

const service = new AuthService();

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth(req);
    const data = await service.getProfile(user.userId);
    return new Response(
      JSON.stringify({ success: true, data: { user: data } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return handleError(e);
  }
}
