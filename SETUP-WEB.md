# SmartMod Setup Guide

## Overview

- **Root `.env`** – Used by the Discord bot and Prisma CLI (`db:push`, `db:migrate`, etc.)
- **`web/.env`** – Used by the Next.js web app (NextAuth, Razorpay, etc.)
- The bot loads from both: root `.env` first, then `web/.env` as fallback, so you can keep secrets in either place.

---

## 1. Root .env (Bot + Prisma)

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase, etc.) |
| `DISCORD_TOKEN` | Bot token from Developer Portal → Bot → Reset Token |
| `OPENAI_API_KEY` | Required for AI-powered daily summaries |

---

## 2. Web .env

```bash
cp web/.env.example web/.env
```

Edit `web/.env` and set:

| Variable | Description |
|----------|-------------|
| `DISCORD_CLIENT_ID` | Application ID (same as bot app) |
| `DISCORD_CLIENT_SECRET` | OAuth2 → Client Secret |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Same as `DISCORD_CLIENT_ID` |
| `NEXTAUTH_SECRET` | e.g. `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (or your domain) |
| `DATABASE_URL` | Same PostgreSQL URL as root `.env` |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret (for billing) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_WEBHOOK_SECRET` | For webhook verification (optional in dev) |

Optional (bot can load from root): `DISCORD_TOKEN`, `OPENAI_API_KEY`.

---

## 3. Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. **Bot** → Reset Token → copy to `DISCORD_TOKEN`
4. Enable **Message Content Intent**
5. **OAuth2** → Redirects → Add `http://localhost:3000/api/auth/callback/discord`
6. Invite bot with scopes: `bot`, `applications.commands`

---

## 4. Database Setup

```bash
npm install
npm run db:push
```

`db:push` applies the Prisma schema (including `summary_hour`, `summary_timezone`, `summary_runs`). Regenerates both root and web Prisma clients.

---

## 5. Run Bot + Web

Use two terminals:

| Terminal 1 | Terminal 2 |
|------------|------------|
| `npm run dev` (Discord bot) | `npm run web:dev` (Web UI) |

Web runs at **http://localhost:3000**.

---

## Discord Commands

| Command | Description |
|---------|-------------|
| `/set-summary-channel [channel]` | Set channel for daily summaries |
| `/set-summary-time [hour] [timezone]` | Per-server summary time (0–23, IANA timezone) |
| `/send-summary-now` | Trigger a summary immediately (respects plan limits) |

---

## SaaS Plans

| Plan | Messages/day | Summaries/day |
|------|--------------|---------------|
| FREE | 1,000 | 1 |
| STARTER | 5,000 | 2 |
| PRO | 25,000 | 4 |

Billing is via Razorpay. See `/checkout?serverId=...&plan=...` and webhooks at `/api/webhooks/razorpay`.
