import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { authEnabled } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import { usePortalSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

/**
 * Client portal sessions are locked out of operator routes.
 * Only /app/portal is allowed while a client session is active.
 *
 * Production (VITE_SPLIT_ROCK_DEMO=false): operator routes require Better Auth
 * sign-in. Demo/preview keeps /app open so the suite is explorable without creds.
 */
function AppLayout() {
  const { isClientUser } = usePortalSession();
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const requireOperatorAuth = authEnabled && !isDemoDataEnabled;

  useEffect(() => {
    if (!isClientUser) return;
    if (pathname === "/app/portal" || pathname.startsWith("/app/portal/")) return;
    void navigate({ to: "/app/portal", replace: true });
  }, [isClientUser, pathname, navigate]);

  if (requireOperatorAuth && !isClientUser) {
    if (isPending) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-bg text-[13px] text-fg-muted">
          Checking sign-in…
        </div>
      );
    }
    if (!user) return <RedirectToSignIn />;
  }

  // Slim shell for pure client sessions — hide operator chrome via CSS class
  return (
    <AppShell clientMode={isClientUser}>
      <Outlet />
    </AppShell>
  );
}
