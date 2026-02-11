"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Navbar } from "./Navbar";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <Navbar />
      {children}
    </SessionProvider>
  );
}
