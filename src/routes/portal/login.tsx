import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/data/store";
import type { Client } from "@/data/types";
import {
  authenticateClientPortal,
  clearPortalSession,
  normalizeToken,
  readPortalSession,
  writePortalSession,
} from "@/lib/client-portal";
import { COMPANY } from "@/lib/company";
import { DEMO_PORTAL_CLIENTS } from "@/lib/demo-credentials";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/login")({
  validateSearch: (search: Record<string, unknown>): { client?: string; code?: string } => ({
    client: typeof search.client === "string" ? search.client : undefined,
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const { client: preClientId, code: preCode } = Route.useSearch();
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const markClientPortalLogin = useAppStore((s) => s.markClientPortalLogin);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(preCode ? normalizeToken(preCode) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Demo buttons: prefer live store clients; fall back to hardcoded seed tokens
  // so demo mode still works if the CRM was cleared.
  const demoClients = useMemo(() => {
    if (!isDemoDataEnabled) return [] as Array<{ id: string; name: string; email: string; portalToken: string }>;

    const fromStore = clients
      .filter((c) => c.portalToken && (c.portalStatus === "active" || c.portalStatus === "invited"))
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        portalToken: c.portalToken!,
      }));

    if (fromStore.length > 0) return fromStore;

    return DEMO_PORTAL_CLIENTS.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      portalToken: c.portalToken,
    }));
  }, [clients]);

  // Auth list: store clients, or inject demo fallbacks so authenticate can match.
  const authClients: Client[] = useMemo(() => {
    if (clients.length > 0) return clients;
    if (!isDemoDataEnabled) return clients;
    return DEMO_PORTAL_CLIENTS.map(
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
  }, [clients]);

  // Prefill email from invite deep link
  useEffect(() => {
    if (preClientId) {
      const c =
        authClients.find((x) => x.id === preClientId) ??
        DEMO_PORTAL_CLIENTS.find((x) => x.id === preClientId);
      if (c) setEmail(c.email);
    }
  }, [preClientId, authClients]);

  // Already signed in as client → portal
  useEffect(() => {
    const existing = readPortalSession();
    if (existing) {
      void navigate({ to: "/app/portal" });
    }
  }, [navigate]);

  function completeLogin(emailIn: string, codeIn: string) {
    setBusy(true);
    setError(null);
    try {
      // Drop any previous portal session so token rotation always rebinds cleanly.
      clearPortalSession();

      const result = authenticateClientPortal(authClients, emailIn, codeIn);
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      writePortalSession(result.session);
      try {
        markClientPortalLogin(result.client.id);
      } catch {
        /* store may not have this client if using demo fallback */
      }
      toast.success(`Welcome, ${result.client.name.split("&")[0]?.trim()}`);
      void navigate({ to: "/app/portal" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    completeLogin(email, code);
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
          <strong className="text-fg">your</strong> jobs — never another homeowner's information.
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
                    onClick={() => completeLogin(c.email, c.portalToken)}
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
        ) : null}

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
