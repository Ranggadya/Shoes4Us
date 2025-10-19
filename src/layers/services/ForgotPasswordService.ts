import { prisma } from "@/lib/prisma";
import { AppError } from "@/exceptions/AppError";
import { SignJWT } from "jose";
import { sendEmail } from "@/lib/sendEmail"; 

const RESET_TOKEN_EXPIRATION = "15m"; 
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export class ForgotPasswordService {
  async sendResetLink(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Email tidak ditemukan", 404);

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(RESET_TOKEN_EXPIRATION)
      .sign(secret);

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset Password",
      html: `
        <p>Halo ${user.name || "User"},</p>
        <p>Kami menerima permintaan untuk mengatur ulang password Anda.</p>
        <p>Silakan klik tautan di bawah ini untuk melanjutkan:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>Tautan ini berlaku selama 15 menit.</p>
        <br/>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr/>
        <p>Terima kasih,<br/>Tim Support</p>
      `,
    });

    return { message: "Email reset password telah dikirim" };
  }
}
