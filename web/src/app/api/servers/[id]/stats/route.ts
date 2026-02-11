import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: serverId } = await params;

  const server = await prisma.server.findUnique({
    where: { serverId },
    select: { plan: true },
  });

  if (!server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const since = startOfToday();

  const [messagesToday, totalMessages, summariesToday] = await Promise.all([
    prisma.message.count({
      where: { serverId, createdAt: { gte: since } },
    }),
    prisma.message.count({ where: { serverId } }),
    prisma.summaryRun.count({
      where: { serverId, runAt: { gte: since } },
    }),
  ]);

  const planLimits: Record<string, { messagesPerDay: number | null; summariesPerDay: number | null }> = {
    FREE: { messagesPerDay: 1000, summariesPerDay: 1 },
    STARTER: { messagesPerDay: 5000, summariesPerDay: 2 },
    PRO: { messagesPerDay: 25000, summariesPerDay: 4 },
  };
  const limits = planLimits[server.plan] ?? planLimits.FREE;

  return NextResponse.json({
    serverId,
    plan: server.plan,
    messagesToday,
    totalMessages,
    summariesToday,
    limits,
  });
}
