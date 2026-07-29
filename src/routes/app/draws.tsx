import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/draws")({ component: DrawsPage });

function DrawsPage() {
  const { draws, projects, submitDraw, markDrawPaid } = useAppStore();
  const sorted = [...draws].sort((a, b) => {
    const order = { ready: 0, submitted: 1, held: 2, upcoming: 3, paid: 4 } as const;
    return order[a.status] - order[b.status];
  });
  const readyAmt = draws.filter((d) => d.status === "ready" || d.status === "submitted").reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <PageHeader
        title="Progress draws"
        description={`Cash-in queue. ${formatCurrency(readyAmt)} ready or submitted for payment.`}
      />
      <div className="space-y-2">
        {sorted.map((d) => {
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
