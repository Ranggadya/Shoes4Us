import { NextRequest } from "next/server";
import { AuthService } from "@/layers/services/AuthService";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} from "@/layers/validators/AuthValidator";
import {
  successResponse,
  createdResponse,
} from "@/utils/api-response";
import { handleError } from "@/exceptions/handlerError";
import { ValidationError } from "@/exceptions/ValidationError";
import { NotFoundError } from "@/exceptions/NotFoundError";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";
import { BcryptUtil } from "@/lib/BcryptUtil";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export class AuthController {
  private readonly authService = new AuthService();

  async register(request: NextRequest): Promise<Response> {
    try {
      const rawBody = await request.json();

      const validated = registerSchema.safeParse(rawBody);
      if (!validated.success) {
        throw new ValidationError("Data registrasi tidak valid");
      }

      const result = await this.authService.register(validated.data);
      return createdResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  async login(request: NextRequest): Promise<Response> {
    try {
      const rawBody = await request.json();

      const validated = loginSchema.safeParse(rawBody);
      if (!validated.success) {
        throw new ValidationError("Data login tidak valid");
      }

      const result = await this.authService.login(validated.data);
      const cookieStore = await cookies();
      cookieStore.set("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 hari
      });

      return successResponse(result);
    } catch (error) {
      return handleError(error);
    }
  }

  async forgotPassword(req: NextRequest): Promise<Response> {
    try {
      const body = await req.json();

      const parsed = forgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError("Email tidak valid");
      }

      const { email } = parsed.data;
      const result = await this.authService.forgotPassword(email);

      return successResponse({
        ...result,
        message: "Link reset password telah dikirim ke email Anda.",
      });
    } catch (e) {
      return handleError(e);
    }
  }
  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      throw new NotFoundError("Token tidak ditemukan atau tidak valid");
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new UnauthorizedError("Token sudah kadaluarsa");
    }

    const hashed = await BcryptUtil.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashed },
    });

    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return { success: true };
  }
}
