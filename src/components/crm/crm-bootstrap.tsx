import { useEffect, useState } from "react";
import { bootstrapCrmPersistence, getCrmPersistenceMode } from "@/lib/crm/sync";
import { isDemoDataEnabled } from "@/lib/runtime-config";

/**
 * Hydrates CRM entities from server (DATABASE_URL) or localStorage on /app mount.
 * Demo mode skips — seed data stays in memory.
 */
export function CrmBootstrap() {
  const [ready, setReady] = useState(isDemoDataEnabled);

  useEffect(() => {
    if (isDemoDataEnabled) return;
    let cancelled = false;
    void bootstrapCrmPersistence().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready && !isDemoDataEnabled) {
    return (
      <div
        className="border-b border-border bg-bg-subtle px-4 py-2 text-center text-[12px] text-fg-muted"
        aria-live="polite"
      >
        Loading CRM…
      </div>
    );
  }

  const mode = getCrmPersistenceMode();
  if (mode === "server") {
    return (
      <div className="sr-only" data-crm-mode="server">
        CRM synced to database
      </div>
    );
  }

  return null;
}
