import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { BidStatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/bids")({ component: BidsPage });

function BidsPage() {
  const { bids, clients } = useAppStore();
  return (
    <div>
      <PageHeader title="Bid board" description="Pipeline of proposals — draft through award." actions={
        <Button size="sm" asChild><Link to="/app/pricing">Build a bid</Link></Button>
      } />
      <div className="border border-border">
        {bids.map((b) => {
          const client = clients.find((c) => c.id === b.clientId);
          return (
            <div key={b.id} className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium">{b.title}</p>
                <p className="text-[12px] text-fg-muted">{client?.name} · {b.type} · due {formatDate(b.dueDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium tabular-nums">{formatCurrency(b.amount)}</span>
                <BidStatusBadge status={b.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
