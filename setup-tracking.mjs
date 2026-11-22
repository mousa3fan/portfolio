// ─────────────────────────────────────────────────────────────────────
//  ONE-COMMAND SETUP — run this in your project folder:
//
//      node setup-tracking.mjs
//
//  It will:
//    1. Connect this folder to your Vercel project (opens browser if needed)
//    2. Download the Turso database URL + token
//    3. Create the visitor tables in your Turso database
//    4. Add OWNER_EMAIL, ADMIN_PIN, FROM_EMAIL to Vercel automatically
//    5. Ask you to paste ONE thing: your Resend API key (re_...)
//
//  Then you only need to click "Redeploy" in Vercel. That's it.
// ─────────────────────────────────────────────────────────────────────
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import readline from "node:readline/promises";

const say = (s) => console.log(s);
const die = (s) => { console.error("\n✗ " + s); process.exit(1); };

const ENV_FILE = ".env.setup.local"; // git-ignored automatically (.env*.local)

function parseEnvFile(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  say("\n=== Portfolio tracking setup — I'll do the boring parts ===\n");

  // ── Step 1: connect to Vercel ─────────────────────────────────────
  if (existsSync(".vercel/project.json")) {
    say("Step 1/5 — Already connected to Vercel ✓");
  } else {
    say("Step 1/5 — Connecting to Vercel (a browser window may open to log in)...");
    let r = spawnSync("npx vercel link --yes", { shell: true, stdio: "inherit" });
    if (r.status !== 0 || !existsSync(".vercel/project.json")) {
      say("\nAutomatic link didn't work — your folder name probably has spaces or brackets.");
      say("No worries — do this once:");
      say("   1. Run:  npx vercel link");
      say("   2. Answer the questions (link to EXISTING project, pick 'saafan')");
      say("   3. Run this script again — it will remember.");
      die("stopped after link step");
    }
  }

  // ── Step 2: download the Turso credentials ────────────────────────
  say("\nStep 2/5 — Downloading your Turso database URL + token...");
  r = spawnSync(
    `npx vercel env pull ${ENV_FILE} --environment=production --yes`,
    { shell: true, stdio: "inherit" }
  );
  if (r.status !== 0 || !existsSync(ENV_FILE)) {
    die("couldn't download env vars. Run:  npx vercel env pull .env.setup.local --environment=production  — and paste me the error.");
  }
  const env = parseEnvFile(ENV_FILE);
  const isPlaceholder = (v) => !v || v.includes("[SENSITIVE");
  if (isPlaceholder(env.TURSO_DATABASE_URL) || isPlaceholder(env.TURSO_AUTH_TOKEN)) {
    say("\nVercel hides these two values from downloads (they were marked 'Sensitive'),");
    say("so grab them from the Turso dashboard — takes 1 minute:");
    say("  1. Vercel → Storage → click database 'database-purple-flower'");
    say("     → look for a button that opens the TURSO dashboard and click it");
    say("     (or go to cloud.turso.tech and sign in with the same account as Vercel)");
    say("  2. Click the database 'database-purple-flower' there");
    say("  3. Copy the DATABASE URL  (starts with libsql://)");
    say("  4. Create / copy an AUTH TOKEN  (a long eyJ... string)");
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const u = (await rl2.question("\nPaste the DATABASE URL here: ")).trim();
    const t = (await rl2.question("Paste the AUTH TOKEN here: ")).trim();
    rl2.close();
    if (!u.startsWith("libsql://") || t.length < 20) {
      die("those don't look right — the URL must start with libsql:// and the token is a long eyJ... string. Run the script again.");
    }
    env.TURSO_DATABASE_URL = u;
    env.TURSO_AUTH_TOKEN = t;
    // remember for next run so it doesn't ask again
    writeFileSync(ENV_FILE, `TURSO_DATABASE_URL="${u}"\nTURSO_AUTH_TOKEN="${t}"\n`);
  }
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    die("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not found.\n  In Vercel → Storage, make sure the database is connected to project 'saafan', then run this script again.");
  }
  say("✓ Got them.");

  // ── Step 3: create the tables in Turso ────────────────────────────
  say("\nStep 3/5 — Creating the visitor tables in your Turso database...");
  if (!existsSync("node_modules/@libsql/client")) {
    say("(grabbing one small package first — a few seconds)...");
    const inst = spawnSync(
      "npm install @libsql/client --no-save --no-audit --no-fund --loglevel=error",
      { shell: true, stdio: "inherit" }
    );
    if (inst.status !== 0) {
      die("npm install failed. Run:  npm install   (takes a minute), then run this script again.");
    }
  }
  const { createClient } = await import("@libsql/client");
  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
  const DDL = `
    CREATE TABLE IF NOT EXISTS "Visit" (
      "id" TEXT NOT NULL PRIMARY KEY, "ip" TEXT, "city" TEXT, "country" TEXT,
      "region" TEXT, "latitude" REAL, "longitude" REAL, "timezone" TEXT,
      "userAgent" TEXT, "browser" TEXT, "os" TEXT, "device" TEXT,
      "referrer" TEXT, "source" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "Download" (
      "id" TEXT NOT NULL PRIMARY KEY, "ip" TEXT, "city" TEXT, "country" TEXT,
      "region" TEXT, "userAgent" TEXT, "browser" TEXT, "os" TEXT,
      "device" TEXT, "referrer" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "Visit_createdAt_idx" ON "Visit"("createdAt");
    CREATE INDEX IF NOT EXISTS "Visit_country_idx" ON "Visit"("country");
    CREATE INDEX IF NOT EXISTS "Download_createdAt_idx" ON "Download"("createdAt");
  `;
  for (const stmt of DDL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await client.execute(stmt);
  }
  const check = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  say(`✓ Tables ready: ${check.rows.map((x) => x.name).join(", ")}`);

  // ── Step 4: add the easy env vars to Vercel ───────────────────────
  say("\nStep 4/5 — Adding OWNER_EMAIL, ADMIN_PIN, FROM_EMAIL to Vercel...");
  const easyVars = {
    OWNER_EMAIL: "Mousa3fan@gmail.com",
    ADMIN_PIN: "8426",
    FROM_EMAIL: "onboarding@resend.dev",
  };
  for (const [k, v] of Object.entries(easyVars)) {
    const res = spawnSync(`npx vercel env add ${k} production`, {
      shell: true,
      input: v + "\n",
      encoding: "utf8",
    });
    if (res.status !== 0) {
      say(`  · ${k} — probably already set, skipping`);
    } else {
      say(`  ✓ ${k} added`);
    }
  }

  // ── Step 5: the Resend key (the only thing you must type) ─────────
  say("\nStep 5/5 — Resend email key");
  say("If you don't have it yet: go to resend.com → sign up with Mousa3fan@gmail.com");
  say("→ API Keys → Create API Key → copy the key that starts with re_");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const key = (await rl.question("\nPaste your re_... key here (or press Enter to skip): ")).trim();
  rl.close();
  if (key) {
    const res = spawnSync(`npx vercel env add RESEND_API_KEY production`, {
      shell: true,
      input: key + "\n",
      encoding: "utf8",
    });
    say(res.status === 0 ? "✓ RESEND_API_KEY added" : "  · RESEND_API_KEY — probably already set, skipping");
  } else {
    say("· Skipped — no emails until you add RESEND_API_KEY (run this script again later).");
  }

  // ── Done ──────────────────────────────────────────────────────────
  say("\n═══════════════════════════════════════════════════════");
  say("ALL DONE on the computer side! Two clicks left:");
  say("1. Vercel → Deployments → latest → '⋯' → Redeploy");
  say("2. Open saafan-plum.vercel.app in an INCOGNITO window.");
  say("   Email arrives at Mousa3fan@gmail.com in ~15 seconds.");
  say("   Dashboard: saafan-plum.vercel.app/?admin=1  (PIN 8426)");
  say("═══════════════════════════════════════════════════════");
}

main().catch((e) => die(e.message));
