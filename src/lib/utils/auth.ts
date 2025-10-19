import { NextRequest } from "next/server";
import { AuthService } from "@/layers/services/AuthService";
import { UnauthorizedError } from "@/exceptions/UnauthorizedError";
import { UserPayload } from "@/types/UserType";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const authService = new AuthService();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function getUserFromRequest(request: NextRequest): Promise<UserPayload> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token tidak ditemukan");
  }

  const token = authHeader.substring(7);
  return authService.verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<UserPayload> {
  return getUserFromRequest(request);
}

export async function requireAdmin(request: NextRequest): Promise<UserPayload> {
  const user = await getUserFromRequest(request);

  if (user.role !== "ADMIN") {
    throw new UnauthorizedError("Akses hanya untuk admin");
  }

  return user;
}

export async function getUserFromSession(): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value; 

    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role: string };
  } catch (error) {
    console.error("Gagal verifikasi token:", error);
    return null;
  }
}
