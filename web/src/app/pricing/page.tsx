import Link from "next/link";
import { AddToDiscordButton } from "@/components/AddToDiscordButton";

export const metadata = {
  title: "Pricing | SmartMod Summary",
  description: "Pricing plans for SmartMod Summary Discord bot.",
};

const PLANS = [
  {
    name: "FREE",
    price: "$0",
    period: "forever",
    limits: ["1,000 messages/day", "1 summary/day", "Toxicity detection", "All features"],
  },
  {
    name: "STARTER",
    price: "$12",
    period: "/month",
    limits: ["5,000 messages/day", "2 summaries/day", "Toxicity detection", "All features"],
    popular: false,
  },
  {
    name: "PRO",
    price: "$39",
    period: "/month",
    limits: ["25,000 messages/day", "4 summaries/day", "Toxicity detection", "All features", "Priority support"],
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-3xl font-bold text-center">Pricing</h1>
        <p className="mt-2 text-center text-slate-400">
          Per server · Upgrade when you need more
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 ${
                plan.popular
                  ? "border-[#5865F2] bg-[#5865F2]/10"
                  : "border-slate-700 bg-slate-900/50"
              }`}
            >
              {plan.popular && (
                <span className="rounded-full bg-[#5865F2] px-3 py-0.5 text-xs font-medium">
                  Popular
                </span>
              )}
              <h2 className="mt-2 text-xl font-semibold">{plan.name}</h2>
              <p className="mt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-slate-500">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.limits.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-300">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.name === "FREE" ? (
                  <AddToDiscordButton className="w-full justify-center" />
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center justify-center rounded-lg bg-[#5865F2] py-3 font-semibold text-white transition hover:opacity-90"
                  >
                    Go to Dashboard to upgrade
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-slate-500">
          All plans include toxicity detection and daily AI summaries. Limits apply per server.
          <br />
          <Link href="/setup" className="text-[#5865F2] hover:underline">
            Setup guide
          </Link>
          {" · "}
          <Link href="/dashboard" className="text-[#5865F2] hover:underline">
            Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
