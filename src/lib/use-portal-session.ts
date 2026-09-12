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
import { isDemoDataEnabled } from "@/lib/runtime-config";

type LiveSessionResponse = {
  ok: boolean;
  session: {
    clientId: string;
    name: string;
    email: string;
    signedInAt: string;
    authMode: "live";
  } | null;
};

/** Live portal session bound to a single client (isolated from other clients). */
export function usePortalSession(): {
  session: PortalSession | null;
  client: Client | null;
  isClientUser: boolean;
  signOut: () => void;
  setSession: (s: PortalSession) => void;
} {
  const clients = useAppStore((s) => s.clients);
  const [session, setSessionState] = useState<PortalSession | null>(null);

  const refreshDemo = useCallback(() => {
    setSessionState(readPortalSession());
  }, []);

  const refreshLive = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/session", { credentials: "same-origin" });
      if (!res.ok) {
        setSessionState(null);
        return;
      }
      const data = (await res.json()) as LiveSessionResponse;
      if (!data.session) {
        setSessionState(null);
        return;
      }
      setSessionState({
        clientId: data.session.clientId,
        name: data.session.name,
        email: data.session.email,
        signedInAt: data.session.signedInAt,
        authMode: "live",
      });
    } catch {
      setSessionState(null);
    }
  }, []);

  useEffect(() => {
    if (isDemoDataEnabled) {
      refreshDemo();
      window.addEventListener("storage", refreshDemo);
      window.addEventListener("src-portal-session", refreshDemo);
      return () => {
        window.removeEventListener("storage", refreshDemo);
        window.removeEventListener("src-portal-session", refreshDemo);
      };
    }
    void refreshLive();
    const onLive = () => {
      void refreshLive();
    };
    window.addEventListener("src-portal-session", onLive);
    return () => {
      window.removeEventListener("src-portal-session", onLive);
    };
  }, [refreshDemo, refreshLive]);

  const client = resolvePortalClient(clients, session);

  useEffect(() => {
    if (isDemoDataEnabled && session && !client) {
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
      if (!isDemoDataEnabled) {
        void fetch("/api/portal/sign-out", { method: "POST", credentials: "same-origin" });
      }
    },
    setSession: (s) => {
      if (s.authMode === "live") {
        clearPortalSession();
        setSessionState(s);
        window.dispatchEvent(new Event("src-portal-session"));
        return;
      }
      writePortalSession(s);
      setSessionState(s);
    },
  };
}
