"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const messages: Record<string, string> = {
    OAuthCallback:
      "Discord login failed during the callback. This is often caused by the PKCE code_verifier cookie not being sent back. Check Render logs for details (debug mode is on).",
    OAuthCreateAccount: "Could not create user account.",
    Callback: "Error in the OAuth callback handler.",
    OAuthAccountNotLinked: "This Discord account is already linked to another user.",
    EmailCreateAccount: "Could not create user.",
    CallbackRouteError: "Error in the callback route.",
    Default: "An authentication error occurred.",
  };

  const message = (error && messages[error]) ?? messages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/50 p-8">
        <h1 className="text-xl font-semibold text-red-400">Login Error</h1>
        <p className="mt-4 text-slate-300">{message}</p>
        {error === "OAuthCallback" && (
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-400">
            <li>Render Dashboard → Your service → Logs</li>
            <li>Try login again while watching logs</li>
            <li>Look for &quot;PKCE code_verifier&quot; or Discord API errors</li>
          </ul>
        )}
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#5865F2] px-4 py-2 font-medium hover:bg-[#4752C4]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
