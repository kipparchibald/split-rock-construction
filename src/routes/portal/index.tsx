import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Bare /portal hits should land on client sign-in (DEPLOY.md post-deploy checklist).
 * Without this route, /portal 404s while /portal/login works.
 */
export const Route = createFileRoute("/portal/")({
  beforeLoad: () => {
    throw redirect({ to: "/portal/login", replace: true });
  },
});
