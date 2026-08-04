import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BidStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import type { BidStatus } from "@/data/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/bids")({ component: BidsPage });

const COLUMNS: BidStatus[] = ["draft", "submitted", "won", "lost", "expired"];

const NEXT: Partial<Record<BidStatus, BidStatus[]>> = {
  draft: ["submitted", "expired"],
  submitted: ["won", "lost", "expired"],
  won: [],
  lost: [],
  expired: ["draft"],
};

type View = "board" | "list";

function BidsPage() {
  const bids = useAppStore((s) => s.bids);
  const clients = useAppStore((s) => s.clients);
  const setBidStatus = useAppStore((s) => s.setBidStatus);
  const [view, setView] = useState<View>("board");
  const [typeFilter, setTypeFilter] = useState<"all" | "residential" | "commercial">("all");

  const filtered = useMemo(() => {
    return bids.filter((b) => (typeFilter === "all" ? true : b.type === typeFilter));
  }, [bids, typeFilter]);

  const stats = useMemo(() => {
    const open = filtered.filter((b) => b.status === "draft" || b.status === "submitted");
    const won = filtered.filter((b) => b.status === "won");
    const openVal = open.reduce((s, b) => s + b.amount, 0);
    const wonVal = won.reduce((s, b) => s + b.amount, 0);
    return { openCount: open.length, openVal, wonVal, winRate: filtered.length ? Math.round((won.length / filtered.length) * 100) : 0 };
  }, [filtered]);

  function advance(id: string, status: BidStatus) {
    setBidStatus(id, status);
    toast.success(`Bid marked ${status}`);
  }

  return (
    <div>
      <PageHeader
        title="Bid board"
        description="Pipeline from draft through award — advance status as proposals move."
        actions={
          <Button size="sm" asChild>
            <Link to="/app/pricing">Build a bid</Link>
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Open pipeline" value={formatCurrency(stats.openVal)} hint={`${stats.openCount} live proposals`} />
        <StatCard label="Won volume" value={formatCurrency(stats.wonVal)} hint="Awarded contracts" />
        <StatCard label="Win rate" value={`${stats.winRate}%`} hint="Of bids on this board" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All", count: bids.length },
            { value: "residential", label: "Residential", count: bids.filter((b) => b.type === "residential").length },
            { value: "commercial", label: "Commercial", count: bids.filter((b) => b.type === "commercial").length },
          ]}
        />
        <FilterChips
          value={view}
          onChange={setView}
          options={[
            { value: "board", label: "Board" },
            { value: "list", label: "List" },
          ]}
        />
      </div>

      {view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((col) => {
            const colBids = filtered.filter((b) => b.status === col);
            const total = colBids.reduce((s, b) => s + b.amount, 0);
            return (
              <div
                key={col}
                className="flex w-[min(100%,16.5rem)] shrink-0 flex-col border border-border bg-bg-elevated"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <div>
                    <p className="text-[12px] font-medium capitalize">{col}</p>
                    <p className="text-[10px] tabular-nums text-fg-subtle">
                      {colBids.length} · {formatCurrency(total)}
                    </p>
                  </div>
                  <Badge variant="secondary">{colBids.length}</Badge>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {colBids.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[11px] text-fg-subtle">Empty</p>
                  ) : (
                    colBids.map((b) => {
                      const client = clients.find((c) => c.id === b.clientId);
                      const next = NEXT[b.status] ?? [];
                      return (
                        <div key={b.id} className="border border-border bg-bg p-3">
                          <p className="text-[12px] font-medium leading-snug">{b.title}</p>
                          <p className="mt-1 text-[11px] text-fg-muted">
                            {client?.name ?? "—"} · {b.type}
                          </p>
                          <p className="mt-2 text-[14px] font-medium tabular-nums">{formatCurrency(b.amount)}</p>
                          <p className="mt-0.5 text-[10px] text-fg-subtle">Due {formatDate(b.dueDate)}</p>
                          {b.notes ? (
                            <p className="mt-2 line-clamp-2 text-[11px] text-fg-muted">{b.notes}</p>
                          ) : null}
                          {next.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {next.map((n) => (
                                <Button
                                  key={n}
                                  size="sm"
                                  variant={n === "won" ? "default" : "outline"}
                                  className="h-7 px-2 text-[10px] uppercase tracking-[0.04em]"
                                  onClick={() => advance(b.id, n)}
                                >
                                  {n === "submitted" ? "Submit" : n === "won" ? "Award" : n === "lost" ? "Lost" : n === "expired" ? "Expire" : "Reopen"}
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border">
          {filtered.map((b) => {
            const client = clients.find((c) => c.id === b.clientId);
            const next = NEXT[b.status] ?? [];
            return (
              <div
                key={b.id}
                className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[13px] font-medium">{b.title}</p>
                  <p className="text-[12px] text-fg-muted">
                    {client?.name} · {b.type} · due {formatDate(b.dueDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium tabular-nums">{formatCurrency(b.amount)}</span>
                  <BidStatusBadge status={b.status} />
                  {next.map((n) => (
                    <Button key={n} size="sm" variant="outline" onClick={() => advance(b.id, n)}>
                      → {n}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
          {!filtered.length ? (
            <p className="px-4 py-8 text-center text-[13px] text-fg-muted">No bids in this filter.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
