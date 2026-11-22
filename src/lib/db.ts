import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Standard PrismaClient. Uses the DATABASE_URL env var.
//
// LOCAL DEV:  DATABASE_URL=file:./db/portfolio.db  (SQLite file)
// VERCEL:     Will not persist writes (read-only filesystem) — see README
//             for instructions on enabling Turso for production tracking.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
