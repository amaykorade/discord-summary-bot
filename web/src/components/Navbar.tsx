"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { AddToDiscordButton } from "./AddToDiscordButton";

const DISCORD_ADD_URL =
  process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    ? `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=277025508352&scope=bot%20applications.commands`
    : "/";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "text-white" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const right = session?.user ? (
    <>
      <a
        href={DISCORD_ADD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4752c4]"
      >
        Add to Server
      </a>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/50"
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-8 w-8 rounded-full ring-1 ring-slate-700"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300">
              {(session.user.name ?? session.user.email ?? "?")[0]}
            </div>
          )}
          <span className="hidden max-w-[120px] truncate text-sm text-slate-300 sm:block">
            {session.user.name ?? session.user.email ?? "User"}
          </span>
          <svg
            className={`h-4 w-4 text-slate-500 transition ${userMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 py-1 shadow-xl">
            <div className="border-b border-slate-800 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">
                {session.user.name ?? "User"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {session.user.email ?? "Discord user"}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  ) : (
    <AddToDiscordButton className="!py-2 !px-4 text-sm" />
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition hover:text-slate-200"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5865F2] text-sm font-bold">
            S
          </span>
          SmartMod
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/setup">Setup</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
        </nav>
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
