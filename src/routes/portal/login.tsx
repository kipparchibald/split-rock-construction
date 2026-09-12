import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientsForPortalAuth, ensureHolwegeForPortal } from "@/data/holwege-portal";
import { useAppStore } from "@/data/store";
import type { Client } from "@/data/types";
import {
  authenticateClientPortal,
  clearPortalSession,
  normalizeToken,
  readPortalSession,
  type PortalSession,
  writePortalSession,
} from "@/lib/client-portal";
import { COMPANY } from "@/lib/company";
import { DEMO_PORTAL_CLIENTS } from "@/lib/demo-credentials";
import { ModeCallout } from "@/components/layout/mode-callout";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/login")({
  validateSearch: (search: Record<string, unknown>): { client?: string; code?: string } => ({
    client: typeof search.client === "string" ? search.client : undefined,
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  component: PortalLoginPage,
});

type DemoPortalRow = { id: string; name: string; email: string; portalToken: string };

function PortalLoginPage() {
  const { client: preClientId, code: preCode } = Route.useSearch();
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const markClientPortalLogin = useAppStore((s) => s.markClientPortalLogin);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(preCode ? normalizeToken(preCode) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const demoClients = useMemo(() => {
    if (!isDemoDataEnabled) return [] as DemoPortalRow[];

    const byId = new Map<string, DemoPortalRow>(
      DEMO_PORTAL_CLIENTS.map((c) => [
        c.id,
        { id: c.id, name: c.name, email: c.email, portalToken: c.portalToken },
      ]),
    );
    for (const c of clients) {
      if (!c.portalToken) continue;
      if (c.portalStatus !== "active" && c.portalStatus !== "invited") continue;
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        email: c.email,
        portalToken: c.portalToken,
      });
    }
    return Array.from(byId.values());
  }, [clients]);

  useEffect(() => {
    if (isDemoDataEnabled) return;
    ensureHolwegeForPortal(useAppStore);
  }, []);

  const authClients: Client[] = useMemo(() => {
    if (!isDemoDataEnabled) {
      return clientsForPortalAuth(clients);
    }
    const fallback = DEMO_PORTAL_CLIENTS.map(
      (c): Client => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: "",
        type: "homeowner",
        address: "",
        notes: "Demo fallback client",
        portalToken: c.portalToken,
        portalStatus: "active",
      }),
    );
    if (clients.length === 0) return fallback;
    return clients.map((c) => {
      const demo = DEMO_PORTAL_CLIENTS.find(
        (d) => d.id === c.id || d.email.toLowerCase() === c.email.trim().toLowerCase(),
      );
      if (!demo) return c;
      return {
        ...c,
        portalToken: c.portalToken || demo.portalToken,
        portalStatus:
          c.portalStatus === "revoked"
            ? "revoked"
            : c.portalStatus === "active"
              ? "active"
              : "invited",
      };
    });
  }, [clients]);

  useEffect(() => {
    if (preClientId) {
      const c =
        authClients.find((x) => x.id === preClientId) ??
        DEMO_PORTAL_CLIENTS.find((x) => x.id === preClientId);
      if (c) setEmail(c.email);
    }
  }, [preClientId, authClients]);

  useEffect(() => {
    if (isDemoDataEnabled) {
      const existing = readPortalSession();
      if (existing) void navigate({ to: "/app/portal" });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/portal/session", { credentials: "same-origin" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { session?: { clientId?: string } | null };
        if (data.session?.clientId && !cancelled) {
          void navigate({ to: "/app/portal" });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function completeLoginLive(emailIn: string, codeIn: string) {
    clearPortalSession();
    ensureHolwegeForPortal(useAppStore);
    const res = await fetch("/api/portal/sign-in", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailIn, code: codeIn }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      session?: {
        clientId: string;
        name: string;
        email: string;
        signedInAt: string;
        authMode: "live";
      };
    };
    if (!res.ok || !data.ok || !data.session) {
      setError(data.error ?? "Portal sign-in failed");
      return;
    }
    const session: PortalSession = {
      clientId: data.session.clientId,
      name: data.session.name,
      email: data.session.email,
      signedInAt: data.session.signedInAt,
      authMode: "live",
    };
    clearPortalSession();
    window.dispatchEvent(new Event("src-portal-session"));
    try {
      markClientPortalLogin(session.clientId);
    } catch {
      /* store may not have this client yet */
    }
    toast.success(`Welcome, ${session.name.split("&")[0]?.trim()}`);
    void navigate({ to: "/app/portal" });
  }

  function completeLoginDemo(emailIn: string, codeIn: string) {
    clearPortalSession();
    const result = authenticateClientPortal(authClients, emailIn, codeIn);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    writePortalSession(result.session);
    try {
      markClientPortalLogin(result.client.id);
    } catch {
      /* demo fallback */
    }
    toast.success(`Welcome, ${result.client.name.split("&")[0]?.trim()}`);
    void navigate({ to: "/app/portal" });
  }

  async function completeLogin(emailIn: string, codeIn: string) {
    setBusy(true);
    setError(null);
    try {
      if (isDemoDataEnabled) {
        completeLoginDemo(emailIn, codeIn);
      } else {
        await completeLoginLive(emailIn, codeIn);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void completeLogin(email, code);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-border bg-bg-elevated px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Logo className="h-9" />
          <Link to="/login" className="text-[12px] text-fg-subtle hover:text-fg">
            Operator sign-in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
        <p className="label-caps">Client portal</p>
        <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em]">Sign in to your build</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          Use the email on your contract and the access code Split Rock sent you. You only see{" "}
          <strong className="text-fg">your</strong> jobs — never another homeowner&apos;s information.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 border border-border bg-bg-elevated p-5">
          <div>
            <Label htmlFor="portal-email">Email</Label>
            <Input
              id="portal-email"
              type="email"
              autoComplete="username"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="portal-login-email"
            />
          </div>
          <div>
            <Label htmlFor="portal-code">Access code</Label>
            <Input
              id="portal-code"
              className="mt-1.5 font-mono uppercase tracking-widest"
              value={code}
              onChange={(e) => setCode(normalizeToken(e.target.value))}
              placeholder="8-character code"
              required
              autoComplete="one-time-code"
              data-testid="portal-login-code"
            />
          </div>
          {error ? (
            <p className="text-[12px] text-danger" role="alert" data-testid="portal-login-error">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full min-h-11" disabled={busy} data-testid="portal-login-submit">
            {busy ? "Signing in…" : "Open my portal"}
          </Button>
        </form>

        {isDemoDataEnabled && demoClients.length > 0 ? (
          <div className="mt-6 border border-border bg-bg-elevated p-4" data-testid="portal-demo-clients">
            <p className="label-caps">Demo client sign-in</p>
            <p className="mt-1 text-[11px] text-fg-subtle">
              Each button signs in as a different client — data is isolated.
            </p>
            <ul className="mt-3 space-y-2">
              {demoClients.map((c) => (
                <li key={c.id}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-h-10 justify-start"
                    data-testid={`portal-demo-${c.id}`}
                    disabled={busy}
                    onClick={() => void completeLogin(c.email, c.portalToken)}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-fg-subtle">{c.portalToken}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : isDemoDataEnabled ? (
          <div className="mt-6 border border-border bg-bg-elevated p-4" data-testid="portal-demo-empty">
            <p className="text-[12px] text-fg-muted">
              Demo data is on, but no portal clients are available. Reload the page or re-open demo mode.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            <ModeCallout empty audience="client" testId="portal-live-hint" />
            <p className="text-[11px] text-fg-subtle">
              Use the email on your contract and the access code Split Rock sent you. Need a code? Call{" "}
              <a href={COMPANY.phoneHref} className="text-fg underline-offset-2 hover:underline">
                {COMPANY.phone}
              </a>
              .
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-fg-subtle">
          Need help?{" "}
          <a href={COMPANY.phoneHref} className="underline-offset-2 hover:underline">
            {COMPANY.phone}
          </a>{" "}
          ·{" "}
          <a href={`mailto:${COMPANY.email}`} className="underline-offset-2 hover:underline">
            {COMPANY.email}
          </a>
        </p>
      </main>
    </div>
  );
}
