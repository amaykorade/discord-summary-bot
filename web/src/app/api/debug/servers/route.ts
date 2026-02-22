import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as { accessToken?: string })?.accessToken;

  if (!session) return NextResponse.json({ error: "No session" });
  if (!accessToken) return NextResponse.json({ error: "No accessToken in session", session });

  // Step 1: fetch guilds from Discord
  const discordRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const discordStatus = discordRes.status;
  const rawGuilds = discordRes.ok ? await discordRes.json() : await discordRes.text();

  if (!discordRes.ok) {
    return NextResponse.json({ error: "Discord API failed", discordStatus, rawGuilds });
  }

  const guilds = rawGuilds as { id: string; name: string; permissions: string }[];

  // Step 2: permission filter
  const ADMINISTRATOR = BigInt(0x8);
  const MANAGE_GUILD = BigInt(0x20);
  const adminGuilds = guilds.filter((g) => {
    const perms = BigInt(g.permissions);
    return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
  });

  // Step 3: DB lookup
  const serverIds = adminGuilds.map((g) => g.id);
  const dbServers = await prisma.server.findMany({
    where: { serverId: { in: serverIds.length ? serverIds : ["__none__"] } },
    select: { serverId: true, name: true, plan: true },
  });

  // Step 4: all DB servers (to check if server exists at all)
  const allDbServers = await prisma.server.findMany({
    select: { serverId: true, name: true, plan: true },
    take: 20,
  });

  return NextResponse.json({
    totalGuilds: guilds.length,
    adminGuilds: adminGuilds.map((g) => ({ id: g.id, name: g.name, permissions: g.permissions })),
    dbMatchedServers: dbServers,
    allDbServers,
  });
}
