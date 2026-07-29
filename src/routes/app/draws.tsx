import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import type { DrawStatus } from "@/data/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/draws")({ component: DrawsPage });

type Filter = "all" | "action" | DrawStatus;

function DrawsPage() {
  const { draws, projects, submitDraw, markDrawPaid } = useAppStore();
  const [filter, setFilter] = useState<Filter>("action");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: draws.length, action: 0 };
    for (const d of draws) {
      c[d.status] = (c[d.status] ?? 0) + 1;
      if (d.status === "ready" || d.status === "submitted" || d.status === "held") c.action += 1;
    }
    return c;
  }, [draws]);

  const sorted = useMemo(() => {
    const order = { ready: 0, submitted: 1, held: 2, upcoming: 3, paid: 4 } as const;
    let list = [...draws];
    if (filter === "action") list = list.filter((d) => ["ready", "submitted", "held"].includes(d.status));
    else if (filter !== "all") list = list.filter((d) => d.status === filter);
    return list.sort((a, b) => order[a.status] - order[b.status]);
  }, [draws, filter]);

  const readyAmt = draws
    .filter((d) => d.status === "ready" || d.status === "submitted")
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <PageHeader
        title="Progress draws"
        description={`Cash-in queue. ${formatCurrency(readyAmt)} ready or submitted for payment.`}
      />
      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "action", label: "Needs action", count: counts.action },
          { value: "all", label: "All", count: counts.all },
          { value: "ready", label: "Ready", count: counts.ready ?? 0 },
          { value: "submitted", label: "Submitted", count: counts.submitted ?? 0 },
          { value: "upcoming", label: "Upcoming", count: counts.upcoming ?? 0 },
          { value: "paid", label: "Paid", count: counts.paid ?? 0 },
          { value: "held", label: "Held", count: counts.held ?? 0 },
        ]}
      />
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">
            No draws in this filter.
          </p>
        ) : sorted.map((d) => {
          const p = projects.find((x) => x.id === d.projectId);
          return (
            <div key={d.id} className="flex flex-col gap-3 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to="/app/projects/$projectId" params={{ projectId: d.projectId }} className="text-[13px] font-medium hover:underline">{p?.name}</Link>
                <p className="mt-0.5 text-[12px] text-fg-muted">{d.name} · {d.trigger}</p>
                {d.dueDate ? <p className="text-[11px] text-fg-subtle">Due {formatDate(d.dueDate)}</p> : null}
                {d.paidDate ? <p className="text-[11px] text-fg-subtle">Paid {formatDate(d.paidDate)}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium tabular-nums">{formatCurrency(d.amount)}</span>
                <Badge variant={d.status === "paid" ? "success" : d.status === "ready" || d.status === "submitted" ? "warning" : d.status === "held" ? "danger" : "secondary"}>
                  {d.status.replace("_", " ")}
                </Badge>
                {d.status === "ready" ? <Button size="sm" onClick={() => submitDraw(d.id)}>Submit</Button> : null}
                {d.status === "submitted" ? <Button size="sm" variant="outline" onClick={() => markDrawPaid(d.id)}>Mark paid</Button> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
