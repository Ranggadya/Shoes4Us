import { NextRequest } from "next/server";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { ForgotPasswordService } from "@/layers/services/ForgotPasswordService";
import { ValidationError } from "@/exceptions/ValidationError";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

const service = new ForgotPasswordService();

export class ForgotPasswordController {
  static async handle(req: NextRequest): Promise<Response> {
    try {
      const body = await req.json();
      const parsed = forgotSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("Email tidak valid");

      const result = await service.sendResetLink(parsed.data.email);
      return createSuccessResponse(result, "Tautan reset password telah dikirim ke email");
    } catch (e) {
      return handleError(e);
    }
  }
}
