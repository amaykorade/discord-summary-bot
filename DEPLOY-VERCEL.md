# Deploy Web App to Vercel

Deploy the SmartMod web dashboard to Vercel to fix Discord OAuth 429 rate limits (Render shared IP issue).

## Prerequisites

- GitHub account (repo pushed to GitHub)
- Vercel account (free at [vercel.com](https://vercel.com))
- Discord app configured
- Database (Neon, etc.) and env vars ready

---

## Step 1: Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repo (`Discord-bot` or your repo name)
3. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** Click **Edit** → set to `web`
   - **Build Command:** `prisma generate --schema=../prisma/schema.prisma && next build` (or leave default — `vercel.json` has it)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. Click **Deploy** (it may fail until env vars are added — that’s okay)

---

## Step 2: Add Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Your Neon/Postgres URL (same as Render) |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` | Replace with your Vercel URL after first deploy |
| `NEXTAUTH_SECRET` | (random string) | e.g. `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` | |
| `DISCORD_CLIENT_ID` | Your Discord Application ID | |
| `DISCORD_CLIENT_SECRET` | Your Discord Client Secret | |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Same as `DISCORD_CLIENT_ID` | |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret | |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Your Razorpay key ID | |

Apply to **Production**, **Preview**, and **Development** as needed.

---

## Step 3: Update Discord Redirect URI

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → your app
2. **OAuth2** → **Redirects** → **Add Redirect**
3. Add: `https://YOUR-PROJECT.vercel.app/api/auth/callback/discord`
4. **Save Changes**

Use your actual Vercel URL (e.g. `https://smartmod-web.vercel.app`).

---

## Step 4: Update NEXTAUTH_URL

After the first deploy, Vercel gives you a URL like `https://smartmod-web-xxx.vercel.app` or a custom domain.

1. In Vercel → Settings → Environment Variables
2. Set `NEXTAUTH_URL` to that URL (no trailing slash)
3. Update the Discord redirect URI to match
4. **Redeploy** (Deployments → ⋮ → Redeploy)

---

## Step 5: Redeploy

After adding env vars and updating Discord:

1. Vercel Dashboard → **Deployments**
2. Click **⋮** on latest → **Redeploy**
3. Or push a commit to trigger a new deploy

---

## Architecture After Deploy

| Component | Host | URL |
|-----------|------|-----|
| **Web dashboard** | Vercel | `https://YOUR-PROJECT.vercel.app` |
| **Discord bot** | Render | (unchanged) |

The web app runs on Vercel; the bot stays on Render. Both use the same database (Neon).

---

## Razorpay Webhooks (if used)

1. Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://YOUR-VERCEL-URL.vercel.app/api/webhooks/razorpay`
3. Set `RAZORPAY_WEBHOOK_SECRET` in Vercel env vars

---

## Troubleshooting

**Build fails with "prisma not found"**  
- Root Directory must be `web`
- Build Command: `prisma generate --schema=../prisma/schema.prisma && next build`

**OAuth still fails**  
- Confirm `NEXTAUTH_URL` matches the deployed URL
- Confirm the Discord redirect URI matches exactly
- Check Vercel logs for errors

**Database connection fails**  
- Ensure `DATABASE_URL` is set
- Neon allows connections from Vercel by default (public IPs)
