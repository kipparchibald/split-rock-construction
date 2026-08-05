import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("kipp@splitrock.construction");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!authEnabled) {
    return <Navigate to="/app" />;
  }
  if (!isPending && user && !user.isDevFallback) {
    return <Navigate to="/app" />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signErr } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError(signErr.message ?? "Sign-in failed");
        return;
      }
      await authClient.getSession();
      void navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  function fill(operator: "kipp" | "kyle") {
    if (operator === "kipp") {
      setEmail("kipp@splitrock.construction");
      setPassword("SplitRock-Kipp-2026!");
    } else {
      setEmail("kyle@splitrock.construction");
      setPassword("SplitRock-Kyle-2026!");
    }
    setError(null);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-border bg-bg-elevated px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/" className="text-[12px] text-fg-muted hover:text-fg">
            Marketing site
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <p className="label-caps mb-2">Split Rock OS</p>
        <h1 className="text-xl font-medium tracking-[-0.02em] text-fg">Operator sign-in</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          Field suite access for owners and ops. Email and password for Kipp and Kyle are pre-seeded.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 border border-border bg-bg-elevated p-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-[12px] text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="button" size="sm" variant="outline" onClick={() => fill("kipp")}>
              Fill Kipp
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => fill("kyle")}>
              Fill Kyle
            </Button>
          </div>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-fg-subtle">
          Demo credentials are for internal ops and sandbox only. Rotate passwords before any public or production deploy.
        </p>
      </main>
    </div>
  );
}
