import { createFileRoute } from "@tanstack/react-router";
import { isCrmServerPersistenceEnabled } from "@/lib/crm/capabilities.server";

export const Route = createFileRoute("/api/crm/capabilities")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          serverPersistence: isCrmServerPersistenceEnabled(),
        }),
    },
  },
});
