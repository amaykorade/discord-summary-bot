# SmartMod Summary Bot

A production-ready Discord bot SaaS that collects messages, stores them in a database, generates daily AI summaries, detects toxicity, and sends reports to admins.

## Features

- ✅ **Collect messages** from all channels (non-bot messages only)
- ✅ **Store in database** via Prisma ORM
- ✅ **Daily AI summary** – automated daily report generation
- ✅ **Basic toxicity detection** – keyword and pattern-based detection
- ✅ **Send report to admins** – daily summaries sent to admin channels

## Tech Stack

- **Node.js** (v18+)
- **TypeScript**
- **discord.js v14**
- **Prisma ORM** (SQLite by default, PostgreSQL for production)

## Project Structure

```
├── web/                   # Next.js frontend (landing, dashboard)
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── events/            # Discord event handlers
│   │   ├── messageCreate.ts
│   │   └── ready.ts
│   ├── scheduler/         # Cron-like jobs
│   │   └── dailySummary.ts
│   ├── services/          # Report service (uses summary + toxicity)
│   │   └── report.service.ts
│   └── index.ts           # Bot entry point
├── services/              # Core business logic
│   ├── message.service.ts
│   ├── summary.service.ts
│   └── toxicity.service.ts
├── db/
│   └── client.ts          # Prisma client
├── utils/
│   ├── config.ts          # Environment config
│   └── logger.ts
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18 or higher
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### 2. Clone & Install

```bash
cd Discord-bot
npm install
```

### 3. Environment Variables

**Root `.env`** (bot + Prisma CLI):

```bash
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL`, `DISCORD_TOKEN`, `OPENAI_API_KEY`.

**Web `web/.env`** – For the dashboard, see `SETUP-WEB.md`. The bot loads from both root `.env` and `web/.env`.

### 4. Database Setup

```bash
npm run db:push
```

Applies the schema (PostgreSQL). Creates tables including `messages`, `servers`, `summary_runs`.

### 5. Discord Bot Configuration

In the [Discord Developer Portal](https://discord.com/developers/applications):

1. Create a new application (or use existing)
2. Go to **Bot** → **Reset Token** and copy the token
3. Enable **Message Content Intent** (required for reading messages)
4. Invite the bot to your server with scopes: `bot` and `applications.commands`
5. Bot permissions: `Read Messages/View Channels`, `Send Messages`, `Read Message History`

### 6. Run the Bot

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Database Schema

```prisma
model Message {
  id        String   @id @default(cuid())
  serverId  String
  channelId String
  userId    String
  username  String
  content   String
  createdAt DateTime @default(now())
}
```

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/set-summary-channel [channel]` | Set the channel where daily summaries are posted. Omit `channel` to use the current channel. | Administrator |
| `/set-summary-time [hour] [timezone]` | Per-server summary time (0–23) and IANA timezone (e.g. `America/New_York`). | Administrator |
| `/send-summary-now` | Trigger a summary immediately (respects plan limits). | Administrator |

## User Setup (in web app)

The web app includes a **Setup Guide** at `/setup` with step-by-step instructions for server admins:

1. Add the bot to their Discord server
2. Run `/set-summary-channel` to choose where summaries are posted
3. The bot runs automatically from there

## How It Works

1. **Message listener** – Every non-bot message is saved to the database (within plan limits).
2. **Toxicity check** – Messages are checked against a basic keyword/pattern list.
3. **Daily summary** – Per-server scheduled summaries at the time set via `/set-summary-time` (default 0:00 UTC).
4. **Report delivery** – Posted to the channel set via `/set-summary-channel`, or falls back to `mod-log`, `admin`, `reports`, or `bot`.

## Web Dashboard

A Next.js frontend provides a landing page, Add to Discord button, dashboard, and Razorpay checkout.

See **SETUP-WEB.md** for full setup. Summary:
1. Copy `web/.env.example` to `web/.env`
2. Add Discord OAuth2, NextAuth, Razorpay, and `DATABASE_URL`
3. Run `npm run web:dev`

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run bot with hot reload |
| `npm run web:dev` | Run web dashboard (Next.js) |
| `npm run web:build` | Build web for production |
| `npm run web:start` | Run built web app |
| `npm run build` | Compile bot TypeScript |
| `npm start` | Run compiled bot |
| `npm run db:push` | Push schema to DB (run after schema changes) |
| `npm run db:generate` | Regenerate Prisma clients (root + web) |
| `npm run db:studio` | Open Prisma Studio |

## SaaS Plans

| Plan | Messages/day | Summaries/day |
|------|--------------|---------------|
| **FREE** | 1,000 | 1 |
| **STARTER** | 5,000 | 2 |
| **PRO** | 25,000 | 4 |

Billing is via Razorpay. Checkout: `/checkout?serverId=...&plan=...`. Webhook: `/api/webhooks/razorpay`.

## Deployment

See **[DEPLOY-RENDER.md](./DEPLOY-RENDER.md)** for a step-by-step guide to deploy on Render (Web Service + Background Worker).

## Production Notes

- Use **PostgreSQL** instead of SQLite: set `DATABASE_URL` to your Postgres connection string and change `provider = "postgresql"` in `prisma/schema.prisma`.
- For advanced AI summaries and toxicity, add an `OPENAI_API_KEY` and integrate the OpenAI Moderation API or chat completions.
- Consider a process manager (PM2, systemd) for production deployment.

## License

MIT
