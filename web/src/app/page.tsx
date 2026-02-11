import Link from "next/link";
import { AddToDiscordButton } from "@/components/AddToDiscordButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">

      <main className="mx-auto max-w-6xl px-4 py-24">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered Moderation
            <br />
            <span className="text-[#5865F2]">for Your Discord Server</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Collect messages, generate daily AI summaries, detect toxicity, and
            send actionable reports to admins. Set up in seconds.
          </p>
          <div className="mt-10">
            <AddToDiscordButton className="!px-8 !py-4 text-lg" />
          </div>
        </section>

        <section className="mt-32 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Message Collection",
              desc: "Collect messages from all channels and store them securely for analysis.",
              icon: "📥",
            },
            {
              title: "Daily AI Summaries",
              desc: "Get concise summaries, main topics, and most active channels every day.",
              icon: "📊",
            },
            {
              title: "Toxicity Detection",
              desc: "Identify concerning behavior and flag toxic users automatically.",
              icon: "🛡️",
            },
            {
              title: "Admin Reports",
              desc: "Formatted reports delivered to your chosen channel or mod-log.",
              icon: "📬",
            },
            {
              title: "Slash Commands",
              desc: "Configure the summary channel with /set-summary-channel.",
              icon: "⚙️",
            },
            {
              title: "Pro Plans",
              desc: "Unlimited messages and summaries when you upgrade.",
              icon: "✨",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-32 rounded-2xl border border-slate-800 bg-slate-900/30 p-8 md:p-12">
          <h2 className="text-center text-2xl font-bold">Simple Pricing</h2>
          <p className="mt-2 text-center text-slate-400">
            Per server · Upgrade anytime
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="text-xl font-semibold">FREE</h3>
              <p className="mt-2 text-slate-400">
                1,000 msgs/day · 1 summary/day
              </p>
              <p className="mt-4 text-3xl font-bold">$0</p>
              <p className="text-sm text-slate-500">forever</p>
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-900/50 p-6">
              <h3 className="text-xl font-semibold">STARTER</h3>
              <p className="mt-2 text-slate-400">
                5,000 msgs/day · 2 summaries/day
              </p>
              <p className="mt-4 text-3xl font-bold">$12</p>
              <p className="text-sm text-slate-500">/month</p>
            </div>
            <div className="rounded-xl border border-[#5865F2] bg-[#5865F2]/10 p-6">
              <h3 className="text-xl font-semibold">PRO</h3>
              <p className="mt-2 text-slate-400">
                25,000 msgs/day · 4 summaries/day
              </p>
              <p className="mt-4 text-3xl font-bold">$39</p>
              <p className="text-sm text-slate-500">/month</p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/pricing" className="text-[#5865F2] hover:underline">
              View full pricing →
            </Link>
          </p>
        </section>

        <section className="mt-24 text-center">
          <AddToDiscordButton className="!px-10 !py-4 text-lg" />
        </section>
      </main>

      <footer className="mt-24 border-t border-slate-800 py-8 text-center text-slate-500">
        <p>SmartMod Summary Bot · Discord Moderation SaaS</p>
      </footer>
    </div>
  );
}
