import { NextRequest } from "next/server";
import { AuthController } from "@/layers/controllers/AuthController";
import { createSuccessResponse } from "@/exceptions/handlerError";
import { handleError } from "@/exceptions/handlerError";
import { resetPasswordSchema } from "@/layers/validators/AuthValidator";
import { ValidationError } from "@/exceptions/ValidationError";

const authController = new AuthController();

export class ResetPasswordController {
  static async handle(req: NextRequest) {
    try {
      const body = await req.json();

      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Token atau password tidak valid");
      }

      const result = await authController.resetPassword(
        parsed.data.token,
        parsed.data.password
      );

      return createSuccessResponse({
        success: result.success,
        message: "Password berhasil direset. Silakan login dengan password baru.",
      });
    } catch (error) {
      return handleError(error);
    }
  }
}
