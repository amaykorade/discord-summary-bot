import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DISCORD_API = "https://discord.com/api/v10";

async function getGuilds(accessToken: string): Promise<{ id: string; name: string; permissions: string }[] | { error: string; status: number }> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: body || `Discord API returned ${res.status}`, status: res.status };
  }
  return res.json() as Promise<{ id: string; name: string; permissions: string }[]>;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as { accessToken?: string }).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as { accessToken?: string }).accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }
  const guildsResult = await getGuilds(accessToken);

  if (!Array.isArray(guildsResult)) {
    console.error("[/api/servers] Discord API error:", guildsResult);
    return NextResponse.json(
      { error: `Discord API error ${guildsResult.status}: ${guildsResult.error}` },
      { status: guildsResult.status === 401 ? 401 : 502 }
    );
  }

  const ADMINISTRATOR = BigInt(0x8);
  const MANAGE_GUILD = BigInt(0x20);
  const adminGuilds = guildsResult.filter((g) => {
    const perms = BigInt(g.permissions);
    return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
  });

  const serverIds = adminGuilds.map((g) => g.id);
  const servers = await prisma.server.findMany({
    where: { serverId: { in: serverIds } },
    select: { serverId: true, name: true, plan: true, summaryChannelId: true, lastSummaryAt: true },
  });

  type ServerRow = (typeof servers)[number];
  const serverMap = new Map<string, ServerRow>(servers.map((s: ServerRow) => [s.serverId, s]));

  const result = adminGuilds
    .filter((g) => serverMap.has(g.id))
    .map((g) => {
    const db = serverMap.get(g.id);
    return {
      id: g.id,
      name: g.name,
      plan: db?.plan ?? "FREE",
      summaryChannelId: db?.summaryChannelId ?? null,
      lastSummaryAt: db?.lastSummaryAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(result);
}
