import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevels: ("error" | "warn" | "info" | "query")[] =
  process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"];

function createPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // ── PRODUCTION (Vercel): Turso (hosted SQLite) ─────────────────────
  // Vercel's filesystem is read-only, so a local SQLite file can't persist.
  // When TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set, writes go to Turso
  // (free tier is plenty for a portfolio site).
  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter, log: logLevels });
  }

  // ── LOCAL DEV fallback: plain SQLite file ──────────────────────────
  // Uses DATABASE_URL from .env (e.g. file:./db/portfolio.db)
  return new PrismaClient({ log: logLevels });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
