import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { buildCostAlerts } from "@/lib/cost-alerts";
import { loadJson, saveJson, PERSIST_KEYS } from "@/lib/local-persist";
import { samplePolicies } from "@/lib/sub-insurance";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import type { CostAlert } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/alerts")({ component: AlertsPage });

function severityVariant(s: CostAlert["severity"]): "danger" | "warning" | "secondary" | "outline" {
  if (s === "critical") return "danger";
  if (s === "warning") return "warning";
  if (s === "watch") return "secondary";
  return "outline";
}

function AlertsPage() {
  const { projects, budgetLines, draws } = useAppStore();
  const [acked, setAcked] = useState<string[]>(() =>
    loadJson<string[]>(PERSIST_KEYS.acknowledgedAlerts, []),
  );

  const policies = isDemoDataEnabled ? samplePolicies : loadJson("insurance-policies", []);

  const alerts = useMemo(
    () =>
      buildCostAlerts({
        projects,
        budgetLines,
        draws,
        policies,
      }).map((a) => ({ ...a, acknowledged: acked.includes(a.id) })),
    [projects, budgetLines, draws, policies, acked],
  );

  const open = alerts.filter((a) => !a.acknowledged);
  const closed = alerts.filter((a) => a.acknowledged);

  function acknowledge(id: string) {
    const next = Array.from(new Set([...acked, id]));
    setAcked(next);
    saveJson(PERSIST_KEYS.acknowledgedAlerts, next);
  }

  function clearAck() {
    setAcked([]);
    saveJson(PERSIST_KEYS.acknowledgedAlerts, []);
  }

  return (
    <div>
      <PageHeader
        title="Cost & compliance alerts"
        description="Predictive job-cost burn, draw gaps, and subcontractor COI expiration — acknowledge after you act."
        actions={
          closed.length > 0 ? (
            <Button size="sm" variant="outline" onClick={clearAck}>
              Reset acknowledgements
            </Button>
          ) : null
        }
      />

      {open.length === 0 ? (
        <div className="border border-border bg-bg-elevated px-4 py-12 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" strokeWidth={1.75} />
          <p className="mt-3 text-[14px] font-medium">No open alerts</p>
          <p className="mt-1 text-[13px] text-fg-muted">
            {projects.length === 0
              ? "Add a job and budget lines to surface burn-rate and draw alerts."
              : "Budgets and COIs look clear against current rules."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/budget">Job cost</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/subs">Sub insurance</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {open.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      a.severity === "critical" ? "text-red-600" : "text-fg-muted",
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="text-[13px] font-medium">{a.title}</span>
                  <Badge variant={severityVariant(a.severity)}>{a.severity}</Badge>
                  {a.metric ? (
                    <span className="text-[11px] tabular-nums text-fg-subtle">{a.metric}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{a.detail}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => acknowledge(a.id)}>
                Acknowledge
              </Button>
            </li>
          ))}
        </ul>
      )}

      {closed.length > 0 && (
        <div className="mt-6">
          <p className="label-caps mb-2 flex items-center gap-1.5 px-1">
            <Bell className="h-3 w-3" strokeWidth={1.75} />
            Acknowledged ({closed.length})
          </p>
          <ul className="divide-y divide-border border border-border opacity-70">
            {closed.map((a) => (
              <li key={a.id} className="px-4 py-2.5 text-[12px] text-fg-muted">
                {a.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
