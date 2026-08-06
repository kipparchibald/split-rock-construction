import { useState } from "react";
import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { OPERATOR_AUTH, COMPANY } from "@/lib/company";
import { isDemoDataEnabled } from "@/lib/runtime-config";

export const Route = createFileRoute("/login")({ component: LoginPage });

const DEMO_PASSWORDS = {
  kipp: "SplitRock-Kipp-2026!",
  kyle: "SplitRock-Kyle-2026!",
} as const;

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState(OPERATOR_AUTH.kipp.email);
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
      const { error: signErr } = await authClient.signIn.email({
        email: emailValue.trim().toLowerCase(),
        password: passwordValue,
      });
      if (signErr) {
        setError(signErr.message ?? "Sign-in failed");
        return;
      }
      await authClient.getSession();
      void navigate({ to: "/app" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      // Surface missing API route / network failures clearly
      if (/fetch|network|failed to fetch|404|not found/i.test(msg)) {
        setError("Auth service unavailable. Try again in a moment.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWith(email, password);
  }

  async function fillAndSignIn(operator: "kipp" | "kyle") {
    if (!isDemoDataEnabled) return;
    const nextEmail = operator === "kipp" ? OPERATOR_AUTH.kipp.email : OPERATOR_AUTH.kyle.email;
    const nextPassword = DEMO_PASSWORDS[operator];
    setEmail(nextEmail);
    setPassword(nextPassword);
    setError(null);
    await signInWith(nextEmail, nextPassword);
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

          {isDemoDataEnabled ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[11px] text-fg-subtle">
                Demo: one click fills credentials and signs you in.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void fillAndSignIn("kipp")}
                >
                  Sign in as Kipp (demo)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void fillAndSignIn("kyle")}
                >
                  Sign in as Kyle (demo)
                </Button>
              </div>
            </div>
          ) : null}
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-fg-subtle">
          {isDemoDataEnabled
            ? "Demo operators are seeded automatically. Rotate passwords and set VITE_SPLIT_ROCK_DEMO=false before public production."
            : "Live mode: password fill helpers are disabled. Use rotated credentials only."}
        </p>
      </main>
    </div>
  );
}
