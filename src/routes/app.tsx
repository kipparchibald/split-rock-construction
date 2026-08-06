import { useEffect } from "react";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { usePortalSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

/**
 * Client portal sessions are locked out of operator routes.
 * Only /app/portal is allowed while a client session is active.
 */
function AppLayout() {
  const { isClientUser } = usePortalSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isClientUser) return;
    if (pathname === "/app/portal" || pathname.startsWith("/app/portal/")) return;
    void navigate({ to: "/app/portal", replace: true });
  }, [isClientUser, pathname, navigate]);

  // Slim shell for pure client sessions — hide operator chrome via CSS class
  return (
    <AppShell clientMode={isClientUser}>
      <Outlet />
    </AppShell>
  );
}
