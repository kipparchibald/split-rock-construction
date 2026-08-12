import { useState } from "react";
import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authEnabled, signInWithEmailPassword } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { OPERATOR_AUTH, COMPANY } from "@/lib/company";
import { DEMO_OPERATORS, type DemoOperatorKey } from "@/lib/demo-credentials";
import { isDemoDataEnabled } from "@/lib/runtime-config";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState<string>(OPERATOR_AUTH.kipp.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!authEnabled) {
    return <Navigate to="/app" />;
  }
  if (!isPending && user && !user.isDevFallback) {
    return <Navigate to="/app" />;
  }

  async function signInWith(emailValue: string, passwordValue: string) {
    setError(null);
    setBusy(true);
    try {
      // Auth POST handler awaits ensureOperatorAccounts before credential check,
      // so cold-start seed no longer races demo buttons.
      const result = await signInWithEmailPassword(emailValue, passwordValue);
      if (!result.ok) {
        // Single delayed retry for transient seed / DB races.
        if (
          isDemoDataEnabled &&
          /invalid email or password|invalid credentials/i.test(result.message)
        ) {
          await new Promise((r) => setTimeout(r, 500));
          const retry = await signInWithEmailPassword(emailValue, passwordValue);
          if (!retry.ok) {
            setError(retry.message);
            return;
          }
        } else {
          setError(result.message);
          return;
        }
      }
      void navigate({ to: "/app" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWith(email, password);
  }

  async function fillAndSignIn(operator: DemoOperatorKey) {
    if (!isDemoDataEnabled) return;
    const creds = DEMO_OPERATORS[operator];
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
    await signInWith(creds.email, creds.password);
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
          Field suite for {COMPANY.legalName}. Use your operator email (
          {OPERATOR_AUTH.kipp.email} / {OPERATOR_AUTH.kyle.email}).
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
              data-testid="operator-login-email"
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
              data-testid="operator-login-password"
            />
          </div>

          {error ? (
            <p
              className="text-[12px] text-red-600 dark:text-red-400"
              role="alert"
              data-testid="operator-login-error"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy} data-testid="operator-login-submit">
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          {isDemoDataEnabled ? (
            <div className="space-y-2 border-t border-border pt-4" data-testid="operator-demo-section">
              <p className="text-[11px] text-fg-subtle">
                Demo mode: one click fills credentials and signs you in.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  data-testid="operator-demo-kipp"
                  onClick={() => void fillAndSignIn("kipp")}
                >
                  Sign in as Kipp (demo)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  data-testid="operator-demo-kyle"
                  onClick={() => void fillAndSignIn("kyle")}
                >
                  Sign in as Kyle (demo)
                </Button>
              </div>
              <p className="text-[10px] leading-relaxed text-fg-subtle">
                Kipp · {DEMO_OPERATORS.kipp.email}
                <br />
                Kyle · {DEMO_OPERATORS.kyle.email}
              </p>
            </div>
          ) : null}
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-fg-subtle">
          {isDemoDataEnabled
            ? "Demo operators are seeded automatically. Client portal: use /portal/login with demo client buttons."
            : "Live mode: password fill helpers are disabled. Use rotated credentials only."}
        </p>

        {isDemoDataEnabled ? (
          <p className="mt-3 text-center text-[12px]">
            <Link
              to="/portal/login"
              className="text-fg-muted underline-offset-2 hover:text-fg hover:underline"
            >
              Client portal demo sign-in →
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}
