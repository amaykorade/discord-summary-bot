import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: "Missing payment verification data" },
      { status: 400 }
    );
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", keySecret)
    .update(sign)
    .digest("hex");

  if (expectedSign !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const rzp = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: keySecret,
  });

  try {
    const order = await rzp.orders.fetch(razorpay_order_id);
    const notes = order.notes as { serverId?: string; plan?: string } | undefined;
    const serverId = notes?.serverId;
    const plan = notes?.plan;

    if (!serverId || !plan || !["STARTER", "PRO"].includes(plan)) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    if (order.status !== "paid") {
      return NextResponse.json({ error: "Order not paid" }, { status: 400 });
    }

    await prisma.server.updateMany({
      where: { serverId },
      data: { plan },
    });

    return NextResponse.json({ success: true, serverId, plan });
  } catch (err) {
    console.error("Verify payment failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
