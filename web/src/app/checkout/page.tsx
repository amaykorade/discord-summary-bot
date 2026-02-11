"use client";

import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface RazorpayInstance {
  on: (event: string, handler: () => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
    }) => RazorpayInstance;
  }
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: "STARTER ($12/mo)",
  PRO: "PRO ($39/mo)",
};

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serverId = searchParams.get("serverId");
  const plan = searchParams.get("plan");
  const serverName = searchParams.get("serverName") ?? "your server";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async () => {
    if (!serverId || !plan || !["STARTER", "PRO"].includes(plan)) {
      setError("Invalid server or plan. Go back to the dashboard and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create order");
      }

      const { orderId, amount, currency, keyId } = data;

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay checkout is loading. Please try again.");
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "SmartMod Summary",
        description: `${PLAN_LABELS[plan]} for ${serverName}`,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setSuccess(true);
              setTimeout(() => router.push("/dashboard"), 2000);
            } else {
              setError(verifyData.error ?? "Payment verification failed. Your plan will be activated shortly via webhook.");
              setSuccess(true); // Webhook will handle it
            }
          } catch {
            setError("Verification failed. Your plan will be activated shortly.");
            setSuccess(true);
          }
        },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-white">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-slate-400">Sign in with Discord to upgrade a server.</p>
        <Link
          href="/api/auth/signin"
          className="rounded-lg bg-[#5865F2] px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Login with Discord
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!serverId || !plan || !["STARTER", "PRO"].includes(plan)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-white">
        <h1 className="text-2xl font-bold">Invalid checkout</h1>
        <p className="text-slate-400">
          Missing server or plan. Go to the dashboard and click Upgrade on a server.
        </p>
        <Link href="/dashboard" className="text-[#5865F2] hover:underline">
          Go to dashboard →
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-white">
        <h1 className="text-2xl font-bold text-green-400">Payment successful!</h1>
        <p className="text-slate-400">
          {serverName} has been upgraded to {plan}. Redirecting to dashboard...
        </p>
        <Link href="/dashboard" className="text-[#5865F2] hover:underline">
          Go to dashboard now →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold">Upgrade server</h1>
        <p className="mt-2 text-slate-400">
          Upgrade <strong className="text-white">{serverName}</strong> to {PLAN_LABELS[plan]}
        </p>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-300">
            Plan: <span className="font-semibold text-white">{plan}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            You will be redirected to Razorpay to complete the payment.
          </p>
          {error && (
            <p className="mt-4 rounded bg-red-500/20 p-3 text-sm text-red-400">{error}</p>
          )}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#5865F2] py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Opening checkout…" : "Pay with Razorpay"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure payment via Razorpay. Your card details are never stored.
        </p>
      </main>
    </div>
  );
}
