import { ConflictError } from "@/exceptions/ConflictError";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";
import { UserRepository } from "@/layers/repositories/UserRepostory";
import { RegisterInput, LoginInput, UserPayload } from "@/types/UserType";
import { BcryptUtil } from "@/lib/BcryptUtil";
import { SignJWT, jwtVerify } from "jose";
import { OAuth2Client } from "google-auth-library";
import { UserRole } from "@prisma/client";
import { NotFoundError } from "@/exceptions/NotFoundError";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";



const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterInput) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) throw new ConflictError("User dengan email ini sudah terdaftar");

    const hashedPassword = data.password
      ? await BcryptUtil.hashPassword(data.password)
      : undefined;

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: data.role || UserRole.USER,
    });

    const token = await this.generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name || "User",
      imageUrl: user.image || null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        role: user.role,
        imageUrl: user.image || null,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user || !user.password) {
      throw new UnauthorizedError("Email atau password salah");
    }

    const isValid = await BcryptUtil.comparePassword(data.password, user.password);
    if (!isValid) throw new UnauthorizedError("Email atau password salah");

    const token = await this.generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name || "User",
      imageUrl: user.image || null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        role: user.role,
        imageUrl: user.image || null,
      },
      token,
    };
  }

  async verifyToken(token: string): Promise<UserPayload> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const data = payload as unknown as UserPayload;

      if (!data.userId || !data.role) {
        throw new UnauthorizedError("Token tidak valid atau rusak");
      }

      return data;
    } catch {
      throw new UnauthorizedError("Token tidak valid atau sudah kadaluarsa");
    }
  }

  private async generateToken(payload: UserPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // 7 hari
      .sign(JWT_SECRET);
  }

  async loginWithGoogle(idToken: string) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedError("Token Google tidak valid");
    }
    let user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      user = await this.userRepository.create({
        name: payload.name || "User Google",
        email: payload.email,
        password: undefined,
        role: UserRole.USER,
        imageUrl: payload.picture || null,
      });
    }

    const token = await this.generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name || "User",
      imageUrl: user.image || null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "User",
        role: user.role,
        imageUrl: user.image || null,
      },
      token,
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundError("Email tidak terdaftar");
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const resetToken = randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;
    console.log("🔗 Reset link:", resetLink);
    return {
      resetLink,
      message: "Link reset password telah dikirim ke email Anda.",
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    return {
      id: user.id,
      name: user.name || "User",
      email: user.email,
      role: user.role,
      imageUrl: user.image || null,
    };
  }
}
