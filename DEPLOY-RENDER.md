# Deploy SmartMod Summary Bot on Render

This guide walks you through deploying the Discord bot + Next.js web app on [Render](https://render.com). You'll create **two services**: a Web Service for the dashboard and a Background Worker for the bot.

## Login works locally but not in production?

Ensure these **exact** env vars in Render → Web Service → Environment:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | `https://YOUR-SERVICE.onrender.com` (your exact URL, no trailing slash) |
| `AUTH_TRUST_HOST` | `true` |

And in **Discord Developer Portal** → OAuth2 → Redirects, add:
`https://YOUR-SERVICE.onrender.com/api/auth/callback/discord`

Save, redeploy, then clear cookies and try again.

---

## Prerequisites

Before starting, make sure you have:

1. **GitHub account** – Code pushed to a GitHub repository
2. **Render account** – Sign up at [render.com](https://render.com)
3. **Discord Application** – From [Discord Developer Portal](https://discord.com/developers/applications)
4. **PostgreSQL database** – [Neon](https://neon.tech), [Supabase](https://supabase.com), or any PostgreSQL
5. **Razorpay account** – For payments ([razorpay.com](https://razorpay.com))
6. **OpenAI API key** – For AI summaries ([platform.openai.com](https://platform.openai.com))

---

## Part 1: One-time setup

### 1.1 Database

1. Create a PostgreSQL database (e.g. Neon, Supabase).
2. Copy the connection string (e.g. `postgresql://user:pass@host/db?sslmode=require`).
3. Save it as `DATABASE_URL` – you'll add it to Render later.

### 1.2 Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → your application.
2. **Bot** tab → Reset Token → copy and save as `DISCORD_TOKEN`.
3. Enable **Message Content Intent**.
4. **OAuth2** tab → note your **Client ID** and **Client Secret**.
5. **OAuth2 → Redirects** → Add redirect (you'll update this after deployment):
   - `https://YOUR-WEB-SERVICE.onrender.com/api/auth/callback/discord`
   - Replace `YOUR-WEB-SERVICE` with your actual Render web service URL.

### 1.3 Razorpay

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys.
2. Generate/copy **Key ID** and **Key Secret**.
3. Webhooks → Add Webhook:
   - URL: `https://YOUR-WEB-SERVICE.onrender.com/api/webhooks/razorpay`
   - Event: `payment.captured`
   - Copy the **Webhook Secret**.

### 1.4 Push database schema

Before deploying, ensure your database has the schema. Locally:

```bash
npm install
DATABASE_URL="your-neon-url" npx prisma db push
```

---

## Part 2: Create Render services

### 2.1 Connect GitHub

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New** → **Web Service**.
3. Connect your GitHub account and select this repository.

---

### 2.2 Web Service (Next.js dashboard)

1. **New** → **Web Service**.
2. Connect the repo.
3. Use these settings:

| Field | Value |
|-------|-------|
| **Name** | `smartmod-web` (or your choice) |
| **Region** | Choose nearest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | *(leave empty)* |
| **Runtime** | Node |
| **Build Command** | `npm install && cd web && npm install && npm run build` |
| **Start Command** | `cd web && npm start` |

4. **Instance type**: Free or paid.

5. Add **Environment Variables**:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Your PostgreSQL connection string |
| `DISCORD_CLIENT_ID` | Your Discord Application ID | |
| `DISCORD_CLIENT_SECRET` | Your Discord OAuth2 Client Secret | |
| `NEXTAUTH_SECRET` | Random string | e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://YOUR-SERVICE.onrender.com` | **Must match your Render URL exactly** (no trailing slash) |
| `AUTH_TRUST_HOST` | `true` | **Required for Render** - enables proxy trust |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Same as `DISCORD_CLIENT_ID` | |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID | |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | Optional but recommended |

6. Click **Create Web Service**. Render will build and deploy.

7. Copy the service URL (e.g. `https://smartmod-web.onrender.com`).

---

### 2.3 Background Worker (Discord bot)

1. **New** → **Background Worker**.
2. Connect the **same** repository.
3. Use these settings:

| Field | Value |
|-------|-------|
| **Name** | `smartmod-bot` (or your choice) |
| **Region** | Same as web service |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

4. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Same PostgreSQL connection string |
| `DISCORD_TOKEN` | Your Discord bot token |
| `OPENAI_API_KEY` | Your OpenAI API key |

5. Click **Create Background Worker**. The bot will build and start.

---

## Part 3: Post-deploy setup

### 3.1 Update Discord redirect

1. Discord Developer Portal → OAuth2 → Redirects.
2. Ensure you have: `https://YOUR-RENDER-WEB-URL/api/auth/callback/discord`
3. Use the real URL from your Render web service.

### 3.2 Update Razorpay webhook

1. Razorpay Dashboard → Webhooks.
2. Set URL to: `https://YOUR-RENDER-WEB-URL/api/webhooks/razorpay`
3. Event: `payment.captured`.

### 3.3 Invite the bot

1. Discord Developer Portal → OAuth2 → URL Generator.
2. Scopes: `bot`, `applications.commands`.
3. Bot Permissions: Read Messages, Send Messages, Read Message History, Use Slash Commands.
4. Use the generated URL to add the bot to your server.

---

## Part 4: Verify

1. **Web**: Open `https://YOUR-WEB-URL` – you should see the landing page.
2. **Login**: Click Login with Discord – OAuth should work.
3. **Dashboard**: After login, you should see your servers (where the bot is added).
4. **Bot**: Check Render logs for the Background Worker – you should see `Logged in as ...`.
5. **Discord**: Run `/set-summary-channel` in a server where the bot is added.

---

## Troubleshooting

### Bot shows "Disconnected" or crashes

- Confirm `DISCORD_TOKEN` is correct (no extra spaces, no quotes in the value).
- Check Render logs for the Background Worker.
- Verify Message Content Intent is enabled in Discord Developer Portal.

### OAuth login fails

- Ensure `NEXTAUTH_URL` matches your Render web URL exactly (including `https://`).
- Add the correct redirect URL in Discord OAuth2 → Redirects.
- Regenerate Discord Client Secret if needed.

### Database errors

- Run `npx prisma db push` locally with `DATABASE_URL` to apply the schema.
- Ensure `DATABASE_URL` is set correctly on both Render services.
- For Neon: use the **pooled** connection string (with `-pooler` in the host).

### Razorpay webhook 400

- Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay Dashboard.
- Ensure the webhook URL is exactly `https://YOUR-URL/api/webhooks/razorpay`.

### Login shows "Login" instead of account after Discord OAuth

- **NEXTAUTH_URL** must be exactly `https://YOUR-RENDER-URL.onrender.com` (no trailing slash, use your actual URL)
- **AUTH_TRUST_HOST** must be `true` (add as env var in Render)
- In Discord Developer Portal → OAuth2 → Redirects, add: `https://YOUR-RENDER-URL/api/auth/callback/discord`
- Clear cookies and try again after fixing env vars
- Redeploy after changing env vars

### Free tier spin-down

- Render free tier spins down after inactivity. First requests may be slow.
- Consider upgrading to paid for production use.

---

## Quick reference: environment variables

**Web Service**
```
DATABASE_URL
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_DISCORD_CLIENT_ID
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

**Background Worker (Bot)**
```
DATABASE_URL
DISCORD_TOKEN
OPENAI_API_KEY
```

---

## Alternative: Blueprint (render.yaml)

This repo includes a `render.yaml` blueprint. To use it:

1. Push your code to GitHub.
2. Render Dashboard → **New** → **Blueprint**.
3. Connect the repo. Render will detect `render.yaml` and create both services.
4. Add all environment variables in each service's **Environment** tab (the blueprint does not include secrets).

The Blueprint creates the same Web Service + Background Worker with the correct build/start commands. You still need to set env vars and run `prisma db push` before or after first deploy.
