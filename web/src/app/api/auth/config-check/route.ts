import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to verify auth config in production.
 * Visit: /api/auth/config-check
 * Does not expose secrets.
 */
export async function GET() {
  const nexauthUrl = process.env.NEXTAUTH_URL ?? "";
  const authTrustHost = process.env.AUTH_TRUST_HOST ?? "(not set)";
  const hasDiscordClientId = !!process.env.DISCORD_CLIENT_ID;
  const hasDiscordSecret = !!process.env.DISCORD_CLIENT_SECRET;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    NEXTAUTH_URL: nexauthUrl || "(not set - REQUIRED for prod)",
    AUTH_TRUST_HOST: authTrustHost,
    NODE_ENV: process.env.NODE_ENV,
    discord: { clientId: hasDiscordClientId, secret: hasDiscordSecret },
    nextAuthSecret: hasNextAuthSecret,
    expectedCallbackUrl: nexauthUrl ? `${nexauthUrl}/api/auth/callback/discord` : null,
  });
}
