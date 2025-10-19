import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/test-supabase",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
      },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production"
  );

  try {
    const { payload } = await jwtVerify(token, secret);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-user-role", payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    console.error("❌ Invalid token:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Token tidak valid atau sudah kedaluwarsa.",
      },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    "/api/cart/:path*", 
    "/api/orders/:path*",  
    "/api/users/:path*",   
    "/api/admin/:path*",    
  ],
};
