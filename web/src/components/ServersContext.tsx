"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Server {
  id: string;
  name: string;
  plan: string;
  summaryChannelId: string | null;
  lastSummaryAt: string | null;
}

interface ServersContextValue {
  servers: Server[];
  loading: boolean;
  error: string | null;
  needsReauth: boolean;
  refresh: () => void;
}

const ServersContext = createContext<ServersContextValue>({
  servers: [],
  loading: false,
  error: null,
  needsReauth: false,
  refresh: () => {},
});

export function ServersProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsReauth(false);
    try {
      const r = await fetch("/api/servers", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) {
        if (data?.reauth) {
          setNeedsReauth(true);
        }
        setError(data?.error ?? `Error ${r.status}`);
        setServers([]);
      } else {
        setServers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load servers");
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setServers([]);
      setError(null);
      setNeedsReauth(false);
      return;
    }
    fetchServers();
  }, [session, status, fetchServers]);

  return (
    <ServersContext.Provider value={{ servers, loading, error, needsReauth, refresh: fetchServers }}>
      {children}
    </ServersContext.Provider>
  );
}

export function useServers() {
  return useContext(ServersContext);
}
