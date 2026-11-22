# Mohamed Saafan — Portfolio Tracker

A portfolio landing page with built-in visit + download tracking.
When someone opens the page or downloads the PDF, you get an email and
a row in your private dashboard.

## Deploy to Vercel (free, ~5 minutes)

1. Push this folder's CONTENTS (not the folder itself) to a new GitHub repo
   named `portfolio`.
2. Go to vercel.com → Sign Up → Continue with GitHub.
3. Click "Add New" → Project → Import your `portfolio` repo.
4. Click "Deploy". Vercel auto-detects Next.js and deploys in ~60 seconds.
5. You'll get a URL like `portfolio-xyz.vercel.app`.

## Activate email alerts (free, 3,000 emails/month)

1. Sign up at resend.com using Mousa3fan@gmail.com.
2. Copy your API key from resend.com/api-keys.
3. In Vercel: Project Settings → Environment Variables → add:
   - `OWNER_EMAIL` = `Mousa3fan@gmail.com`
   - `ADMIN_PIN` = `8426`
   - `RESEND_API_KEY` = (paste from Resend)
   - `FROM_EMAIL` = `onboarding@resend.dev`
4. Click "Redeploy" in Vercel.

## Use it

- Portfolio: `https://your-project.vercel.app/`
- Dashboard: `https://your-project.vercel.app/?admin=1` → enter PIN `8426`

## Custom domain (optional)

In Vercel: Project Settings → Domains → Add `msaafan.com` (or whatever you own).
Vercel shows you the DNS records to add at your registrar.
