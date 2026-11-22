// ─────────────────────────────────────────────────────────────────────
// One-time setup: creates the Visit + Download tables in your Turso DB.
//
// Usage:
//   1. Create your Turso database (see SETUP-EMAIL-TRACKING.md)
//   2. Put TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env file
//   3. Run:  node scripts/push-schema.mjs
//
// You only need to run this once (or after changing prisma/schema.prisma).
// Safe to re-run — it will not delete or overwrite existing data.
// ─────────────────────────────────────────────────────────────────────
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";

// Minimal .env loader (no extra dependency needed)
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url || !token) {
  console.error(
    "✗ Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.\n" +
      "  Add them to your .env file first (copy the values from your\n" +
      "  Turso database, see SETUP-EMAIL-TRACKING.md step 2)."
  );
  process.exit(1);
}

console.log(`Connecting to ${url.replace(/\/\/.*@/, "//***@")} ...`);

const client = createClient({ url, authToken: token });

const DDL = `
CREATE TABLE IF NOT EXISTS "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT,
    "city" TEXT,
    "country" TEXT,
    "region" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "timezone" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "referrer" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Download" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT,
    "city" TEXT,
    "country" TEXT,
    "region" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "referrer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Visit_createdAt_idx" ON "Visit"("createdAt");
CREATE INDEX IF NOT EXISTS "Visit_country_idx" ON "Visit"("country");
CREATE INDEX IF NOT EXISTS "Download_createdAt_idx" ON "Download"("createdAt");
`;

for (const stmt of DDL.split(";")
  .map((s) => s.trim())
  .filter(Boolean)) {
  await client.execute(stmt);
}

const res = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
const tables = res.rows.map((r) => r.name).join(", ");
console.log(`✓ Done. Tables in your Turso database: ${tables}`);
console.log("  (You should see: Download, Visit)");
