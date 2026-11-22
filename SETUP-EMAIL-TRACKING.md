# Visitor Tracking + Email Notifications — Setup

Makes tracking persist on Vercel and sends you an email every time someone
new opens your portfolio. ~10 minutes, one time.

**What you'll get:**
- Every NEW visitor session → email to Mousa3fan@gmail.com (location, device, browser, referrer)
- Every download → logged in your dashboard (no email, so you don't get spammed)
- All data stored permanently in a free Turso database (Vercel's filesystem is
  read-only, which is why nothing persisted before)

---

## ★ EASY WAY — do this instead of everything below

If you already created the Turso database in Vercel (Storage tab) and it's
connected to your project, the computer work is now ONE command:

**Before you start (2 min):** go to **resend.com** → Sign up (use
**Mousa3fan@gmail.com**) → API Keys → Create API Key → copy the `re_...` key.

Then, in your project folder:

```bash
node setup-tracking.mjs
```

It connects to Vercel (browser login if needed), pulls the Turso credentials,
creates the tables, adds OWNER_EMAIL / ADMIN_PIN / FROM_EMAIL for you, and
asks you to paste the `re_...` key. Finally:

1. Vercel → Deployments → latest → "⋯" → **Redeploy**
2. Open your site in an incognito window → email arrives in ~15 seconds.
3. Dashboard: `saafan-plum.vercel.app/?admin=1` (PIN 8426)

(The manual steps below still work if you prefer them.)

---

## Manual path

### Step 1 — Create a free Turso database

**Option A (easiest — right inside Vercel):**
1. Vercel Dashboard → your project → **Storage** tab → **Create Database**
2. Choose **Turso** from the marketplace → name it `portfolio` → create
3. Open it → you'll see the connection env vars (URL + auth token)

**Option B (Turso CLI):**
```bash
curl -sSfL https://get.turso.app | sh
turso auth signup            # login with GitHub works too
turso db create portfolio
turso db show portfolio --url        # copy this
turso db tokens create portfolio     # copy this
```

You now have two values: a URL like `libsql://portfolio-xxx.turso.io` and a
token like `eyJhbGciOi...`.

## Step 2 — Create the tables in that database (one command)

In your project folder, add the two values to a `.env` file:

```
TURSO_DATABASE_URL=libsql://portfolio-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOi...
```

Then run:

```bash
node scripts/push-schema.mjs
```

You should see: `✓ Done. Tables in your Turso database: Download, Visit`

## Step 3 — Resend (for the emails)

1. Go to **resend.com** → Sign up — **IMPORTANT: use Mousa3fan@gmail.com**
   (Resend's free test sender `onboarding@resend.dev` can only deliver to the
   email that owns the Resend account — which is exactly your "send to me" case)
2. Dashboard → **API Keys** → Create → copy the `re_...` key

## Step 4 — Set env vars in Vercel

Project → Settings → **Environment Variables**, add all of these:

| Key | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://portfolio-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOi...` |
| `RESEND_API_KEY` | `re_...` |
| `OWNER_EMAIL` | `Mousa3fan@gmail.com` |
| `ADMIN_PIN` | `8426` |
| `FROM_EMAIL` | `onboarding@resend.dev` (can leave unset — it's the default) |

## Step 5 — Update GitHub (Vercel auto-deploys)

Extract `turso-email-update.zip` into your project folder (overwrite when
asked), then:

```bash
git add .
git commit -m "Add Turso database + email notifications for visitor tracking"
git push
```

Vercel redeploys automatically — done in ~1 minute.

---

## Verify

1. Open https://saafan-plum.vercel.app/ in an **incognito window**
2. ~15 seconds later: email arrives at Mousa3fan@gmail.com
3. Dashboard with all visits/downloads: `saafan-plum.vercel.app/?admin=1` (PIN 8426)

## Notes

- Email = 1 per new visitor **session**. Same person refreshing or scrolling
  does NOT re-email; closing the tab and coming back does.
- If your inbox ever feels noisy, ask me to switch it to a daily digest.
- Want emails from `portfolio@msaafan.com` (or to other addresses)? Verify
  msaafan.com in Resend → Domains, then set `FROM_EMAIL=portfolio@msaafan.com`.
- Local dev still works with plain SQLite — the Turso vars are only needed on Vercel.
