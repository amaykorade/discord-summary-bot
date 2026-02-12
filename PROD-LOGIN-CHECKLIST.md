# Production Login Fix Checklist

If Discord login works locally but **not on production**, verify these:

## 0. Diagnostic – Check Your Config

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

## 4. Quick Test

Visit: `https://YOUR-URL/api/auth/session`

- If logged in: you should see `{"user":{...}}`
- If not logged in: you should see `{}`
- If you get an error: check Render logs for details
