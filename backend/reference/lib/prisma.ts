import { PrismaClient } from "@prisma/client/index";

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl =
  process.env.NODE_ENV !== "production" && process.env.DATABASE_URL_LOCAL
    ? process.env.DATABASE_URL_LOCAL
    : process.env.DATABASE_URL;

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Hanya log error; logging "query" di development sangat memperlambat response
    log: ["error"],
    ...(databaseUrl
      ? {
          datasources: {
            db: {
              url: databaseUrl,
            },
          },
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
