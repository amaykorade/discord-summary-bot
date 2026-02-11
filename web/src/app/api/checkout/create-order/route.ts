import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

const DISCORD_API = "https://discord.com/api/v10";

const PLAN_AMOUNTS: Record<string, number> = {
  STARTER: 1200, // $12.00 (amount in cents for Razorpay USD)
  PRO: 3900,     // $39.00 (amount in cents for Razorpay USD)
};

async function getAdminGuildIds(accessToken: string): Promise<string[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const guilds = (await res.json()) as { id: string; permissions: string }[];
  const ADMIN_PERMISSION = BigInt(0x8);
  return guilds
    .filter((g) => (BigInt(g.permissions) & ADMIN_PERMISSION) === ADMIN_PERMISSION)
    .map((g) => g.id);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as { accessToken?: string }).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { serverId, plan } = body as { serverId?: string; plan?: string };

  if (!serverId || !plan || !["STARTER", "PRO"].includes(plan)) {
    return NextResponse.json(
      { error: "Invalid serverId or plan. Use STARTER or PRO." },
      { status: 400 }
    );
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  const adminGuildIds = await getAdminGuildIds(accessToken!);
  if (!adminGuildIds.includes(serverId)) {
    return NextResponse.json({ error: "You do not have admin access to this server." }, { status: 403 });
  }

  const amount = PLAN_AMOUNTS[plan];
  if (!amount) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const receipt = `sm_${serverId}_${plan}_${Date.now()}`.slice(0, 40);

  try {
    const order = await rzp.orders.create({
      amount, // Razorpay expects amount in smallest unit: USD cents → $12 = 1200
      currency: "USD",
      receipt,
      notes: { serverId, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
