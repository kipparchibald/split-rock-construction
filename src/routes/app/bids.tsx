import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, LayoutGrid, List } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BidStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import type { Bid, BidStatus } from "@/data/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
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

const ACTION_LABEL: Record<string, string> = {
  submitted: "Submit",
  won: "Award",
  lost: "Mark lost",
  expired: "Expire",
  draft: "Reopen",
};

type View = "board" | "list";

function daysUntil(due: string) {
  const d = new Date(due + "T12:00:00");
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function BidsPage() {
  const bids = useAppStore((s) => s.bids);
  const clients = useAppStore((s) => s.clients);
  const setBidStatus = useAppStore((s) => s.setBidStatus);
  const navigate = useNavigate();
  const [view, setView] = useState<View>("list");
  const [typeFilter, setTypeFilter] = useState<"all" | "residential" | "commercial">("all");
  const [statusFocus, setStatusFocus] = useState<BidStatus | "all">("all");

  // Prefer board on wide screens, list on phone (one-hand)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setView(mq.matches ? "board" : "list");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const filtered = useMemo(() => {
    return bids.filter((b) => {
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      if (statusFocus !== "all" && b.status !== statusFocus) return false;
      return true;
    });
  }, [bids, typeFilter, statusFocus]);

  const stats = useMemo(() => {
    const pool = typeFilter === "all" ? bids : bids.filter((b) => b.type === typeFilter);
    const open = pool.filter((b) => b.status === "draft" || b.status === "submitted");
    const won = pool.filter((b) => b.status === "won");
    const dueSoon = open.filter((b) => {
      const d = daysUntil(b.dueDate);
      return d <= 7;
    });
    return {
      openCount: open.length,
      openVal: open.reduce((s, b) => s + b.amount, 0),
      wonVal: won.reduce((s, b) => s + b.amount, 0),
      winRate: pool.length ? Math.round((won.length / pool.length) * 100) : 0,
      dueSoon: dueSoon.length,
    };
  }, [bids, typeFilter]);

  function advance(id: string, status: BidStatus) {
    const result = setBidStatus(id, status);
    if (status === "won" && result?.projectId) {
      toast.success("Bid awarded — job package opened", {
        action: {
          label: "Open job",
          onClick: () =>
            navigate({ to: "/app/projects/$projectId", params: { projectId: result.projectId! } }),
        },
      });
      return;
    }
    toast.success(`Bid marked ${status}`);
  }

  function clientName(b: Bid) {
    return clients.find((c) => c.id === b.clientId)?.name ?? "—";
  }

  return (
    <div>
      <PageHeader
        title="Bid board"
        description="Pipeline from draft through award — advance status as proposals move. List view is built for phone; board for desk."
        actions={
          <Button size="sm" asChild>
            <Link to="/app/pricing">
              Build a bid
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open pipeline"
          value={formatCurrency(stats.openVal)}
          hint={`${stats.openCount} live proposals`}
        />
        <StatCard label="Won volume" value={formatCurrency(stats.wonVal)} hint="Awarded contracts" />
        <StatCard label="Win rate" value={`${stats.winRate}%`} hint="Of bids on this board" />
        <StatCard
          label="Due ≤ 7 days"
          value={String(stats.dueSoon)}
          hint={stats.dueSoon ? "Needs attention" : "None imminent"}
        />
      </div>

      {stats.dueSoon > 0 ? (
        <div className="mb-4 flex items-start gap-2 border border-warning/35 bg-warning/5 px-3 py-2.5 text-[12px]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
          <p className="text-fg">
            <span className="font-medium">{stats.dueSoon} open bid{stats.dueSoon > 1 ? "s" : ""}</span>{" "}
            due within a week — submit or follow up before they go stale.
          </p>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All", count: bids.length },
              {
                value: "residential",
                label: "Residential",
                count: bids.filter((b) => b.type === "residential").length,
              },
              {
                value: "commercial",
                label: "Commercial",
                count: bids.filter((b) => b.type === "commercial").length,
              },
            ]}
          />
          <div className="flex gap-1 rounded-[var(--radius-sm)] border border-border p-0.5">
            <button
              type="button"
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 px-3 text-[12px] font-medium",
                view === "list" ? "bg-primary text-primary-fg" : "text-fg-muted",
              )}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.75} />
              List
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 px-3 text-[12px] font-medium",
                view === "board" ? "bg-primary text-primary-fg" : "text-fg-muted",
              )}
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
              Board
            </button>
          </div>
        </div>

        {/* Status focus — especially useful on phone list */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" data-testid="bid-status-chips">
          {(
            [
              ["all", "All stages"],
              ...COLUMNS.map((c) => [c, c] as const),
            ] as const
          ).map(([value, label]) => {
            const count =
              value === "all"
                ? bids.filter((b) => typeFilter === "all" || b.type === typeFilter).length
                : bids.filter(
                    (b) =>
                      b.status === value && (typeFilter === "all" || b.type === typeFilter),
                  ).length;
            return (
              <button
                key={value}
                type="button"
                className={cn(
                  "min-h-10 shrink-0 border px-3 text-[11px] font-medium capitalize",
                  statusFocus === value
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-bg-elevated text-fg-muted",
                )}
                onClick={() => setStatusFocus(value as BidStatus | "all")}
              >
                {label}
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {COLUMNS.map((col) => {
            const colBids = filtered.filter((b) => b.status === col);
            const total = colBids.reduce((s, b) => s + b.amount, 0);
            return (
              <div
                key={col}
                className="flex w-[min(100%,17rem)] shrink-0 snap-start flex-col border border-border bg-bg-elevated"
                data-testid={`bid-col-${col}`}
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
                    <p className="px-1 py-8 text-center text-[11px] text-fg-subtle">Empty</p>
                  ) : (
                    colBids.map((b) => (
                      <BidCard
                        key={b.id}
                        bid={b}
                        client={clientName(b)}
                        onAdvance={advance}
                        dense
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2" data-testid="bid-list">
          {filtered.map((b) => (
            <BidCard key={b.id} bid={b} client={clientName(b)} onAdvance={advance} />
          ))}
          {!filtered.length ? (
            <p className="border border-border px-4 py-10 text-center text-[13px] text-fg-muted">
              No bids in this filter.{" "}
              <Link to="/app/pricing" className="font-medium text-fg underline-offset-2 hover:underline">
                Build a bid
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function BidCard({
  bid,
  client,
  onAdvance,
  dense,
}: {
  bid: Bid;
  client: string;
  onAdvance: (id: string, status: BidStatus) => void;
  dense?: boolean;
}) {
  const next = NEXT[bid.status] ?? [];
  const d = daysUntil(bid.dueDate);
  const urgent =
    (bid.status === "draft" || bid.status === "submitted") && d <= 7;

  return (
    <div
      className={cn(
        "border border-border bg-bg-elevated",
        dense ? "bg-bg p-3" : "p-4",
        urgent && "border-warning/40",
      )}
      data-testid="bid-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-medium leading-snug text-fg", dense ? "text-[12px]" : "text-[14px]")}>
            {bid.title}
          </p>
          <p className="mt-1 text-[12px] text-fg-muted">
            {client} · {bid.type}
          </p>
        </div>
        {!dense ? <BidStatusBadge status={bid.status} /> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={cn("font-medium tabular-nums", dense ? "text-[14px]" : "text-[16px]")}>
          {formatCurrency(bid.amount)}
        </p>
        <p
          className={cn(
            "text-[11px]",
            urgent ? "font-medium text-warning" : "text-fg-subtle",
          )}
        >
          Due {formatDate(bid.dueDate)}
          {urgent ? (d < 0 ? ` · ${Math.abs(d)}d overdue` : d === 0 ? " · due today" : ` · ${d}d`) : ""}
        </p>
      </div>

      {bid.notes ? (
        <p className="mt-2 line-clamp-2 text-[12px] text-fg-muted">{bid.notes}</p>
      ) : null}

      {bid.status === "won" && bid.projectId ? (
        <p className="mt-2 text-[12px]">
          <Link
            to="/app/projects/$projectId"
            params={{ projectId: bid.projectId }}
            className="font-medium text-fg underline-offset-2 hover:underline"
          >
            Open job package →
          </Link>
        </p>
      ) : null}

      {bid.lineItems.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {bid.lineItems.map((li) => (
            <li
              key={li.label}
              className="flex items-center justify-between gap-2 text-[11px] text-fg-muted"
            >
              <span className="min-w-0 truncate">{li.label}</span>
              <span className="shrink-0 tabular-nums">{formatCurrency(li.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {next.length > 0 ? (
        <div className={cn("flex flex-wrap gap-2", dense ? "mt-3" : "mt-4")}>
          {next.map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === "won" ? "default" : n === "lost" ? "outline" : "outline"}
              className="min-h-10 min-w-[5.5rem]"
              onClick={() => onAdvance(bid.id, n)}
            >
              {ACTION_LABEL[n] ?? n}
            </Button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-fg-subtle capitalize">Closed · {bid.status}</p>
      )}
    </div>
  );
}
