import Link from "next/link";
import { AddToDiscordButton } from "@/components/AddToDiscordButton";

export const metadata = {
  title: "Setup Guide | SmartMod Summary",
  description: "Step-by-step guide to set up SmartMod Summary bot in your Discord server.",
};

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold">Discord Setup Guide</h1>
        <p className="mt-2 text-slate-400">
          Follow these steps to add and configure SmartMod Summary in your server.
        </p>

        <div className="mt-12 space-y-12">
          {/* Step 1 */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2] text-sm font-bold">
                1
              </span>
              <h2 className="text-xl font-semibold">Add the bot to your server</h2>
            </div>
            <ol className="list-inside list-decimal space-y-2 text-slate-300">
              <li>Click the <strong className="text-white">&quot;Add to Discord&quot;</strong> button below</li>
              <li>Select the server you want to add the bot to</li>
              <li>Review and grant the requested permissions</li>
              <li>Complete the authorization (may require solving a CAPTCHA)</li>
            </ol>
            <p className="mt-3 text-sm text-slate-400">
              <strong className="text-white">Multiple servers?</strong> Click &quot;Add to Discord&quot; again and choose a different server each time. Each server gets its own config and limits.
            </p>
            <div className="mt-4">
              <AddToDiscordButton />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              You must have <strong>Manage Server</strong> or <strong>Administrator</strong> permission to add bots.
            </p>
          </section>

          {/* Step 2 */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2] text-sm font-bold">
                2
              </span>
              <h2 className="text-xl font-semibold">Set the summary channel</h2>
            </div>
            <p className="text-slate-300">
              In <strong className="text-white">each server</strong>, run the slash command to choose where daily summaries are posted:
            </p>
            <div className="mt-4 rounded-lg bg-slate-800 p-4 font-mono text-sm">
              <code>/set-summary-channel</code>
            </div>
            <ul className="mt-4 list-inside list-disc space-y-1 text-slate-300">
              <li>Run this in the channel where you want summaries, <strong className="text-white">or</strong></li>
              <li>Use <code className="rounded bg-slate-800 px-1">/set-summary-channel channel:#your-channel</code> to pick a different channel</li>
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              Requires <strong>Administrator</strong> permission. You&apos;ll see a confirmation message when it&apos;s set.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              <strong className="text-white">Multiple servers?</strong> Join each server in Discord and run <code className="rounded bg-slate-800 px-1">/set-summary-channel</code> there. Each server has its own summary channel.
            </p>
          </section>

          {/* Step 3 */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2] text-sm font-bold">
                3
              </span>
              <h2 className="text-xl font-semibold">You&apos;re done</h2>
            </div>
            <p className="text-slate-300">
              The bot will automatically:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-slate-300">
              <li><strong className="text-white">Collect messages</strong> from all channels (non-bot messages only)</li>
              <li><strong className="text-white">Detect toxicity</strong> and flag concerning content</li>
              <li><strong className="text-white">Post a daily summary</strong> at your chosen time to your chosen channel</li>
            </ul>
          </section>

          {/* Multiple servers */}
          <section className="rounded-xl border border-[#5865F2]/50 bg-[#5865F2]/5 p-6">
            <h2 className="text-lg font-semibold">Managing multiple servers</h2>
            <p className="mt-2 text-slate-300">
              You can add the bot to as many servers as you manage. Each server is independent:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-slate-300">
              <li><strong className="text-white">Separate config</strong> – Set a different summary channel per server</li>
              <li><strong className="text-white">Separate limits</strong> – FREE plan: 1,000 msgs/day per server</li>
              <li><strong className="text-white">One dashboard</strong> – <Link href="/dashboard" className="text-[#5865F2] hover:underline">Log in</Link> to see all your servers and usage in one place</li>
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              Repeat the steps above for each server: Add to Discord → select that server → then run <code className="rounded bg-slate-800 px-1">/set-summary-channel</code> in that server.
            </p>
          </section>

          {/* FAQ / Tips */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold">Tips & limits</h2>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li><strong className="text-white">FREE plan:</strong> 1,000 messages/day per server, 1 summary/day per server</li>
              <li><strong className="text-white">Summary time:</strong> Use <code className="rounded bg-slate-800 px-1">/set-summary-time</code> to set hour and timezone. Use <code className="rounded bg-slate-800 px-1">/send-summary-now</code> to get one immediately</li>
              <li><strong className="text-white">No summary channel?</strong> The bot will try mod-log, admin, or reports channels as fallback</li>
              <li><strong className="text-white">Dashboard:</strong> <Link href="/dashboard" className="text-[#5865F2] hover:underline">Log in with Discord</Link> to view all servers and stats</li>
            </ul>
          </section>
        </div>

        <div className="mt-16 text-center">
          <AddToDiscordButton className="!px-10 !py-4 text-lg" />
          <p className="mt-4">
            <Link href="/dashboard" className="text-[#5865F2] hover:underline">
              Go to Dashboard →
            </Link>
          </p>
        </div>
      </main>

      <footer className="mt-24 border-t border-slate-800 py-8 text-center text-slate-500">
        <p>SmartMod Summary Bot · Discord Moderation SaaS</p>
      </footer>
    </div>
  );
}
