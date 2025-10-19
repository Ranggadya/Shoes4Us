import { PrismaClient } from "@prisma/client";

declare global {
  // Gunakan singleton supaya tidak membuat koneksi baru di setiap hot reload
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
