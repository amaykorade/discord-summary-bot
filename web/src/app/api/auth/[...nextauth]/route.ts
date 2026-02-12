import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// trustHost: true required behind Render's proxy - NextAuth reads it at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const optionsWithTrustHost = { ...authOptions, trustHost: true } as any;
const handler = NextAuth(optionsWithTrustHost);

export { handler as GET, handler as POST };
