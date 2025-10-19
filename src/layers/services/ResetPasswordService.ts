// src/layers/services/ResetPasswordService.ts
import { prisma } from "@/lib/prisma";
import { jwtVerify, JWTPayload } from "jose";
import { BcryptUtil } from "@/lib/BcryptUtil";
import { AppError } from "@/exceptions/AppError";

/** Struktur payload token reset password */
interface ResetTokenPayload extends JWTPayload {
  userId: string;
  email?: string;
}

export class ResetPasswordService {
  async resetPassword(token: string, newPassword: string) {
    try {
      // 🔐 Decode token JWT
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Validasi payload & casting aman
      const { userId } = payload as ResetTokenPayload;
      if (!userId) {
        throw new AppError("Token tidak valid atau rusak", 400);
      }

      // 🔍 Cek user berdasarkan ID
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError("User tidak ditemukan", 404);
      }

      // 🔑 Hash password baru
      const hashedPassword = await BcryptUtil.hashPassword(newPassword);

      // 💾 Update password user
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        message: `Password berhasil diperbarui untuk ${user.email}`,
        userId,
      };
    } catch (error) {
      // Ketatkan tipe error jadi Error
      if (error instanceof Error) {
        if ("code" in error && (error as Record<string, unknown>).code === "ERR_JWT_EXPIRED") {
          throw new AppError("Token sudah kedaluwarsa", 401);
        }
        throw new AppError(error.message || "Gagal memperbarui password", 400);
      }

      throw new AppError("Terjadi kesalahan yang tidak diketahui", 500);
    }
  }
}
