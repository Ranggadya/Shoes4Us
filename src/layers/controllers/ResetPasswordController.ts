// src/layers/controllers/ResetPasswordController.ts
import { NextRequest } from "next/server";
import { handleError, createSuccessResponse } from "@/exceptions/handlerError";
import { ResetPasswordService } from "@/layers/services/ResetPasswordService";
import { ValidationError } from "@/exceptions/ValidationError";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(10, "Token tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const service = new ResetPasswordService();

export class ResetPasswordController {
  static async handle(req: NextRequest): Promise<Response> {
    try {
      const body = await req.json();
      const parsed = resetSchema.safeParse(body);

      if (!parsed.success) {
        throw new ValidationError("Data tidak valid: token dan password wajib diisi");
      }

      const result = await service.resetPassword(
        parsed.data.token,
        parsed.data.password
      );

      return createSuccessResponse(result, "Password berhasil diperbarui");
    } catch (e) {
      return handleError(e);
    }
  }
}
