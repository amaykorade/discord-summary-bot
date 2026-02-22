import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// Ensure no trailing slash - causes double slash in callback URL
if (typeof process.env.NEXTAUTH_URL === "string" && process.env.NEXTAUTH_URL.endsWith("/")) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(/\/+$/, "");
}

export const authOptions: NextAuthOptions = {
  debug: false,
  // false avoids __Host-/__Secure- prefixes that can cause OAuthCallback errors behind Render's proxy
  useSecureCookies: false,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: { scope: "identify guilds" },
      },
      token: {
        url: "https://discord.com/api/oauth2/token",
        async request({ client, provider, params, checks }) {
          const maxRetries = 5;
          let lastError: unknown;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const tokens = await client.oauthCallback(
                provider.callbackUrl,
                params,
                checks
              );
              return { tokens };
            } catch (err) {
              lastError = err;
              const msg = String((err as Error)?.message ?? "");
              const is429 = msg.includes("429");
              if (is429 && attempt < maxRetries) {
                const waitMs = Math.min(15000 * attempt, 60000);
                await new Promise((r) => setTimeout(r, waitMs));
              } else {
                throw err;
              }
            }
          }
          throw lastError;
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // On first login, store access token, refresh token, and expiry
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // Discord tokens expire in 604800s (7 days); store expiry with 1 min buffer
        token.accessTokenExpires = Date.now() + (Number(account.expires_in ?? 604800) - 60) * 1000;
      }
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // Token still valid
      if (Date.now() < (token.accessTokenExpires as number ?? 0)) return token;

      // Token expired — refresh it
      try {
        const res = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });
        const refreshed = await res.json();
        if (!res.ok) throw refreshed;
        token.accessToken = refreshed.access_token;
        token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
        token.accessTokenExpires = Date.now() + (Number(refreshed.expires_in ?? 604800) - 60) * 1000;
      } catch {
        // Refresh failed — clear token so user is prompted to re-login
        token.accessToken = undefined;
        token.refreshToken = undefined;
        token.accessTokenExpires = 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, {
          id: token.id,
          name: token.name ?? session.user.name,
          email: token.email ?? session.user.email,
          image: token.picture ?? session.user.image,
        });
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: { signIn: "/", error: "/auth/error" },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        maxAge: 60 * 15,
      },
    },
  },
};
