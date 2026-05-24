import { NextRequest } from "next/server";
import { AuthService } from "@/layers/services/AuthService";
import { createSuccessResponse } from "@/exceptions/handlerError";
import { handleError } from "@/exceptions/handlerError";
import { forgotPasswordSchema } from "@/layers/validators/AuthValidator";
import { ValidationError } from "@/exceptions/ValidationError";

const authService = new AuthService();

export class ForgotPasswordController {
  static async handle(req: NextRequest) {
    try {
      const body = await req.json();

      const parsed = forgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Format email tidak valid");
      }

      const result = await authService.forgotPassword(parsed.data.email);

      return createSuccessResponse({
        message: result.message,
      });
    } catch (error) {
      return handleError(error);
    }
  }
}
