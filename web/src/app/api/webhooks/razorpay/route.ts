import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!webhookSecret) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
  return expected === signature;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: { payment?: { entity: { order_id: string } }; order?: { entity: { notes: Record<string, string> } } } };
  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }

  const rzp = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: keySecret,
  });

  try {
    const order = await rzp.orders.fetch(orderId);
    const notes = (order.notes ?? {}) as Record<string, string>;
    const serverId = notes.serverId;
    const plan = notes.plan;

    if (!serverId || !plan || !["STARTER", "PRO"].includes(plan)) {
      return NextResponse.json({ error: "Invalid order notes" }, { status: 400 });
    }

    await prisma.server.upsert({
      where: { serverId },
      create: { serverId, name: "", plan },
      update: { plan },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Razorpay webhook failed:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
