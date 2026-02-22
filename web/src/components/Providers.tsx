"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Navbar } from "./Navbar";
import { ServersProvider } from "./ServersContext";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      <ServersProvider>
        <Navbar />
        {children}
      </ServersProvider>
    </SessionProvider>
  );
}
