"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const messages: Record<string, string> = {
    OAuthCallback:
      "Discord login failed. If you see 429 Too Many Requests in logs, Discord is rate-limiting — wait 1–2 minutes and try again.",
    OAuthCreateAccount: "Could not create user account.",
    Callback:
      "Discord login failed. If you see 429 in logs, wait 1–2 minutes and try again.",
    OAuthAccountNotLinked: "This Discord account is already linked to another user.",
    EmailCreateAccount: "Could not create user.",
    CallbackRouteError: "Error in the callback route.",
  };

  const isRateLimit = error?.toLowerCase().includes("429");
  const message =
    (error && messages[error]) ??
    (isRateLimit
      ? "Discord is rate-limiting. Wait 1–2 minutes and try again."
      : "An authentication error occurred.");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/50 p-8">
        <h1 className="text-xl font-semibold text-red-400">Login Error</h1>
        <p className="mt-4 text-slate-300">{message}</p>
        {error && !messages[error] && !isRateLimit && (
          <p className="mt-2 text-xs text-slate-500">Error code: {error}</p>
        )}
        {(error === "OAuthCallback" || isRateLimit) && (
          <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-slate-400">
            <li>429 Too Many Requests → wait 1–2 min, then retry</li>
            <li>Check deployment logs for details</li>
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

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
