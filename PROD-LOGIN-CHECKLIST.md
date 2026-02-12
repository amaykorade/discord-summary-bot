# Production Login Fix Checklist

If Discord login works locally but **not on production**, verify these:

## 0. Clear ALL cookies first

You had `next-auth.callback-url` with `localhost:3003` – stale cookies cause OAuthCallback errors.

**Chrome**: DevTools → Application → Cookies → `smartmod-web.onrender.com` → right‑click → Clear  
**Or** use an Incognito window for a fresh test.

## 0b. Diagnostic – Check Your Config

Visit: `https://YOUR-RENDER-URL/api/auth/config-check`

This shows whether NEXTAUTH_URL, AUTH_TRUST_HOST, etc. are set correctly.

## 1. Render Environment Variables (Web Service)

Go to Render Dashboard → Your Web Service → Environment.

| Variable | Required | Example |
|----------|----------|---------|
| **NEXTAUTH_URL** | ✅ | `https://smartmod-web.onrender.com` |
| **NEXTAUTH_SECRET** | ✅ | Any random string (e.g. `openssl rand -base64 32`) |
| **AUTH_TRUST_HOST** | ✅ | `true` |
| **DISCORD_CLIENT_ID** | ✅ | Your Discord Application ID |
| **DISCORD_CLIENT_SECRET** | ✅ | Your Discord OAuth2 Client Secret |
| **NEXT_PUBLIC_DISCORD_CLIENT_ID** | ✅ | Same as DISCORD_CLIENT_ID |

**NEXTAUTH_URL rules:**
- Must be your **exact** Render URL (e.g. `https://YOUR-SERVICE.onrender.com`)
- No trailing slash
- Must use `https://`

## 2. Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications) → your app
2. **OAuth2** → **Redirects** → Add Redirect
3. Add: `https://YOUR-RENDER-URL.onrender.com/api/auth/callback/discord`
4. Replace `YOUR-RENDER-URL` with your actual Render service URL
5. **Save Changes**

## 3. After Changing Settings

1. **Save** env vars in Render
2. **Manual Deploy** (or wait for auto-deploy) – env changes require a redeploy
3. **Clear cookies** for your site (or use incognito)
4. Try login again

## 4. Debug steps

**After clicking "Login with Discord" and authorizing:**

1. **Check the URL you're redirected to** – Any `?error=` in the URL means Discord rejected the callback.
2. **DevTools → Application → Cookies** – After redirect, do you see `__Secure-next-auth.session-token` or `next-auth.session-token`?
3. **Visit `/api/auth/session`** – Logged in = `{"user":{...}}`, not logged in = `{}`.
4. **Check Render logs during login** – Debug mode is on in production. Render Dashboard → Your service → Logs. Retry login and look for `[NextAuth]` or `PKCE code_verifier` errors.

## 5. Discord redirect URI must match exactly

In Discord Developer Portal → OAuth2 → Redirects, you must have:

```
https://smartmod-web.onrender.com/api/auth/callback/discord
```

- No trailing slash
- No double slashes
- Must be **https**

## 6. OAuthCallback / PKCE code_verifier issues

If you see `?error=OAuthCallback` and no session cookie:

- **Cause**: The `next-auth.pkce.code_verifier` cookie may not persist when redirecting from Discord back to your app (known on Render/Vercel).
- **Check**: In DevTools → Application → Cookies, right after clicking "Login with Discord" (before redirect), look for `next-auth.pkce.code_verifier`. If it's missing, the cookie isn't being set.
- **Fix to try**: Use a **custom domain** (e.g. `app.yourdomain.com`) instead of `*.onrender.com`. `onrender.com` is on the public suffixes list, which can affect cookie behavior.
- **Logs**: Render logs will show the exact error (e.g. "PKCE code_verifier cookie was missing").
