import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/data/store";
import type { Client } from "@/data/types";
import {
  clearPortalSession,
  readPortalSession,
  resolvePortalClient,
  type PortalSession,
  writePortalSession,
} from "@/lib/client-portal";

/** Live portal session bound to a single client (isolated from other clients). */
export function usePortalSession(): {
  session: PortalSession | null;
  client: Client | null;
  isClientUser: boolean;
  signOut: () => void;
  setSession: (s: PortalSession) => void;
} {
  const clients = useAppStore((s) => s.clients);
  // Always null on first render so SSR HTML matches the client before hydration.
  // Portal sessions live in localStorage — read after mount to avoid mismatches.
  const [session, setSessionState] = useState<PortalSession | null>(null);

  const refresh = useCallback(() => {
    setSessionState(readPortalSession());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("src-portal-session", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("src-portal-session", refresh);
    };
  }, [refresh]);

  const client = resolvePortalClient(clients, session);

  // Drop stale session if client was revoked / token rotated
  useEffect(() => {
    if (session && !client) {
      clearPortalSession();
      setSessionState(null);
    }
  }, [session, client]);

  return {
    session: client ? session : null,
    client,
    isClientUser: Boolean(client),
    signOut: () => {
      clearPortalSession();
      setSessionState(null);
    },
    setSession: (s) => {
      writePortalSession(s);
      setSessionState(s);
    },
  };
}
