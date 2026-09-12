import type { Client } from "@/data/types";
import { DEMO_PORTAL_CLIENTS } from "@/lib/demo-credentials";

export type DemoPortalButton = {
  id: string;
  name: string;
  email: string;
  portalToken: string;
};

/** Demo sign-in buttons: DEMO_PORTAL_CLIENTS catalog + any store clients with tokens. */
export function buildDemoPortalButtons(clients: Client[]): DemoPortalButton[] {
  const byId = new Map<string, DemoPortalButton>(
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
}
