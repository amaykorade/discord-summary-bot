"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useServers } from "@/components/ServersContext";

interface Server {
  id: string;
  name: string;
  plan: string;
  summaryChannelId: string | null;
  lastSummaryAt: string | null;
}

interface Stats {
  messagesToday: number;
  totalMessages: number;
  summariesToday: number;
  limits: { messagesPerDay: number | null; summariesPerDay: number | null };
}

const DISCORD_ADD_URL = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  ? `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=277025508352&scope=bot%20applications.commands`
  : "/";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { servers, loading, error: fetchError, refresh } = useServers();

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-[#5865F2]" />
            <p className="text-sm text-slate-400">Loading your servers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800">
              <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Sign in with Discord to view your servers and usage.
            </p>
            <button
              onClick={() => signIn("discord")}
              className="mt-6 w-full rounded-lg bg-[#5865F2] px-6 py-3 font-semibold text-white transition hover:bg-[#4752c4]"
            >
              Login with Discord
            </button>
            <div className="mt-6 flex justify-center gap-4 text-sm">
              <Link href="/setup" className="text-slate-500 hover:text-white">
                Setup Guide
              </Link>
              <Link href="/" className="text-slate-500 hover:text-white">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Your Servers</h1>
            <button
              onClick={refresh}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-500 hover:text-white transition"
            >
              Refresh
            </button>
          </div>
          <p className="mt-1 text-slate-400">
            Manage your Discord servers. Add the bot to more servers, then run{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-slate-300">/set-summary-channel</code>{" "}
            in each to configure.
          </p>
          {servers.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Your plans:</span>
              {["PRO", "STARTER", "FREE"].map((plan) => {
                const count = servers.filter((s) => s.plan === plan).length;
                if (count === 0) return null;
                const style =
                  plan === "PRO"
                    ? "bg-[#5865F2]/20 text-[#5865F2]"
                    : plan === "STARTER"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-800 text-slate-400";
                return (
                  <span
                    key={plan}
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${style}`}
                  >
                    {plan} × {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {fetchError && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Error loading servers: {fetchError}
          </div>
        )}

        {servers.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center sm:p-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">No servers yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-slate-400">
              Add the bot to a server where you&apos;re an admin, then run{" "}
              <code className="rounded bg-slate-800 px-1 text-slate-300">/set-summary-channel</code> to configure.
            </p>
            <a
              href={DISCORD_ADD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-6 py-3 font-semibold text-white transition hover:bg-[#4752c4]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Add to Discord
            </a>
            <p className="mt-4 text-sm text-slate-500">
              <Link href="/setup" className="text-[#5865F2] hover:underline">View setup guide</Link> for multiple servers
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {servers.map((s) => (
              <ServerCard key={s.id} server={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ServerCard({ server }: { server: Server }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadStats = () => {
    setStatsError(false);
    setErrorMessage("");
    setStatsLoading(true);
    fetch(`/api/servers/${server.id}/stats`, { credentials: "include" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = data?.error ?? (r.status === 401 ? "Unauthorized" : r.status === 404 ? "Server not found" : `Error ${r.status}`);
          throw new Error(msg);
        }
        if (data && typeof data.messagesToday === "number") {
          setStats(data as Stats);
        } else {
          throw new Error("Invalid response");
        }
      })
      .catch((err) => {
        setStatsError(true);
        setStats(null);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, [server.id]);

  const msgLimit = stats?.limits?.messagesPerDay;
  const messagesToday = stats?.messagesToday ?? 0;
  const totalMessages = stats?.totalMessages ?? 0;
  const summariesToday = stats?.summariesToday ?? 0;
  const msgPct =
    msgLimit != null && msgLimit > 0 ? Math.min(100, (messagesToday / msgLimit) * 100) : 0;
  const sumLimit = stats?.limits?.summariesPerDay;
  const sumStr =
    sumLimit != null
      ? `${summariesToday} / ${sumLimit} summaries today`
      : `${summariesToday} summaries today`;

  const planStyle =
    server.plan === "PRO"
      ? "bg-[#5865F2]/20 text-[#5865F2] ring-1 ring-[#5865F2]/30"
      : server.plan === "STARTER"
        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
        : "bg-slate-800 text-slate-400 ring-1 ring-slate-700";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm transition hover:border-slate-700">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-slate-300">
          {(server.name[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{server.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${planStyle}`}>
              {server.plan}
            </span>
            {server.summaryChannelId ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Channel set
              </span>
            ) : (
              <span className="text-xs text-amber-600/90">No summary channel</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {statsLoading && !stats ? (
          <>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Messages today</span>
              <span className="animate-pulse">—</span>
            </div>
            <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-800" />
            <div className="flex justify-between text-sm text-slate-500">
              <span>Summaries today</span>
              <span className="animate-pulse">—</span>
            </div>
            <div className="text-xs text-slate-500">Total messages: —</div>
          </>
        ) : statsError ? (
          <div className="rounded-lg bg-slate-800/50 py-4 text-center">
            <p className="text-sm text-slate-400">{errorMessage || "Couldn't load usage"}</p>
            <button
              type="button"
              onClick={loadStats}
              className="mt-2 text-xs text-[#5865F2] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : stats ? (
          <>
            <div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Messages today</span>
                <span className="text-slate-300">
                  {msgLimit != null
                    ? `${messagesToday.toLocaleString()} / ${msgLimit.toLocaleString()}`
                    : messagesToday.toLocaleString()}
                </span>
              </div>
              {msgLimit != null && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-[#5865F2] transition-all duration-300"
                    style={{ width: `${msgPct}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400">{sumStr}</p>
            <p className="text-xs text-slate-500">
              {totalMessages.toLocaleString()} total messages
            </p>
          </>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-4">
        {server.plan === "FREE" && (
          <Link
            href={`/checkout?serverId=${encodeURIComponent(server.id)}&plan=STARTER&serverName=${encodeURIComponent(server.name)}`}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-center text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
          >
            Upgrade to STARTER — $12/mo
          </Link>
        )}
        {(server.plan === "FREE" || server.plan === "STARTER") && (
          <Link
            href={`/checkout?serverId=${encodeURIComponent(server.id)}&plan=PRO&serverName=${encodeURIComponent(server.name)}`}
            className="rounded-lg border border-[#5865F2]/40 bg-[#5865F2]/10 py-2.5 text-center text-sm font-medium text-[#5865F2] transition hover:bg-[#5865F2]/20"
          >
            Upgrade to PRO — $39/mo
          </Link>
        )}
        <a
          href={DISCORD_ADD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 text-center text-sm text-slate-500 transition hover:text-[#5865F2]"
        >
          Add to another server
        </a>
      </div>
    </div>
  );
}
