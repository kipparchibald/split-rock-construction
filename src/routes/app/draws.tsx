import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, CheckCircle2 } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { NextActionBanner, type NextAction } from "@/components/layout/next-action-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import type { DrawStatus, ProgressDraw } from "@/data/types";
import {
  drawBadgeVariant,
  drawStatusLabel,
  sortDrawsForQueue,
  summarizeDraws,
} from "@/lib/draws";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/draws")({ component: DrawsPage });

type Filter = "all" | "action" | DrawStatus;

function DrawsPage() {
  const {
    draws,
    projects,
    submitDraw,
    markDrawPaid,
    markDrawReady,
    holdDraw,
    releaseDraw,
  } = useAppStore();
  const [filter, setFilter] = useState<Filter>("action");
  const [jobFilter, setJobFilter] = useState<string>("all");

  const summary = useMemo(() => summarizeDraws(draws), [draws]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: draws.length, action: 0 };
    for (const d of draws) {
      c[d.status] = (c[d.status] ?? 0) + 1;
      if (d.status === "ready" || d.status === "submitted" || d.status === "held") c.action += 1;
    }
    return c;
  }, [draws]);

  const jobsWithDraws = useMemo(() => {
    const ids = [...new Set(draws.map((d) => d.projectId))];
    return ids
      .map((id) => projects.find((p) => p.id === id))
      .filter(Boolean) as typeof projects;
  }, [draws, projects]);

  const sorted = useMemo(() => {
    let list = sortDrawsForQueue(draws);
    if (jobFilter !== "all") list = list.filter((d) => d.projectId === jobFilter);
    if (filter === "action")
      list = list.filter((d) => ["ready", "submitted", "held"].includes(d.status));
    else if (filter !== "all") list = list.filter((d) => d.status === filter);
    return list;
  }, [draws, filter, jobFilter]);

  const nextBanner: NextAction = useMemo(() => {
    const d = summary.nextAction;
    if (!d || d.status === "paid") {
      return {
        severity: "clear",
        title: "Draw queue is clear",
        detail: "No cash-in actions waiting. Mark the next milestone ready when the trigger is met.",
      };
    }
    const p = projects.find((x) => x.id === d.projectId);
    return {
      severity: d.status === "held" || d.status === "ready" ? "high" : "med",
      title: `${summary.nextActionLabel} · ${formatCurrency(d.amount)}`,
      detail: `${p?.name ?? "Job"} — ${d.name}`,
      to: "/app/draws",
      cta: "Handle on this board",
    };
  }, [summary, projects]);

  function actReady(id: string, name: string) {
    markDrawReady(id);
    toast.success("Draw ready", { description: `${name} — ready to submit to owner/lender` });
  }
  function actSubmit(id: string, name: string) {
    submitDraw(id);
    toast.success("Draw submitted", {
      description: `${name} — owner portal money section reflects in-flight amount`,
    });
  }
  function actPaid(id: string, name: string) {
    markDrawPaid(id);
    toast.success("Marked paid", { description: name });
  }
  function actHold(id: string, name: string) {
    holdDraw(id);
    toast.message("Draw held", { description: `${name} — resolve before resubmit` });
  }
  function actRelease(id: string, name: string) {
    releaseDraw(id);
    toast.success("Released to ready", { description: name });
  }

  return (
    <div className="max-w-full overflow-x-clip">
      <PageHeader
        title="Progress draws"
        description="Buyer-funded milestones — ready → submit → paid. Built for phone: one primary action per draw."
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/portal">Owner portal</Link>
          </Button>
        }
      />

      <NextActionBanner action={nextBanner} className="mb-4" />

      {/* Cash strip */}
      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MoneyTile
          label="Paid to date"
          value={formatCurrency(summary.paid)}
          hint={`${summary.paidPct}% of schedule`}
          progress={summary.paidPct}
        />
        <MoneyTile
          label="In flight"
          value={formatCurrency(summary.ready + summary.submitted)}
          hint={`Ready ${formatCurrency(summary.ready)}`}
          tone={summary.ready + summary.submitted > 0 ? "warn" : "default"}
        />
        <MoneyTile
          label="Remaining"
          value={formatCurrency(summary.remaining)}
          hint={`Upcoming ${formatCurrency(summary.upcoming)}`}
        />
        <MoneyTile
          label="Held"
          value={formatCurrency(summary.held)}
          hint={summary.held > 0 ? "Resolve before resubmit" : "None held"}
          tone={summary.held > 0 ? "danger" : "ok"}
        />
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-fg-subtle">
        <strong className="text-fg-muted">Upcoming</strong> → mark ready when trigger met →{" "}
        <strong className="text-fg-muted">Submit</strong> →{" "}
        <strong className="text-fg-muted">Mark paid</strong> when funds clear. Hold if inspection or
        lien issue blocks payment. Submitted amounts show as in-flight on the owner portal.
      </p>

      {/* Job chips */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5" data-testid="draw-job-chips">
        <button
          type="button"
          className={cn(
            "min-h-10 shrink-0 border px-3 text-[11px] font-medium",
            jobFilter === "all"
              ? "border-primary bg-primary text-primary-fg"
              : "border-border bg-bg-elevated text-fg-muted",
          )}
          onClick={() => setJobFilter("all")}
        >
          All jobs
        </button>
        {jobsWithDraws.map((p) => (
          <button
            key={p.id}
            type="button"
            className={cn(
              "min-h-10 shrink-0 border px-3 text-[11px] font-medium",
              jobFilter === p.id
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-bg-elevated text-fg-muted",
            )}
            onClick={() => setJobFilter(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

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

      <div className="space-y-2" data-testid="draw-list">
        {sorted.length === 0 ? (
          <div className="border border-border bg-bg-elevated px-4 py-10 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-success" strokeWidth={1.75} />
            <p className="mt-2 text-[13px] text-fg-muted">
              No draws in this filter. Switch to All or seed a job from Book of Plans.
            </p>
          </div>
        ) : (
          sorted.map((d) => {
            const p = projects.find((x) => x.id === d.projectId);
            return (
              <DrawCard
                key={d.id}
                draw={d}
                jobName={p?.name ?? "Job"}
                onReady={() => actReady(d.id, d.name)}
                onSubmit={() => actSubmit(d.id, d.name)}
                onPaid={() => actPaid(d.id, d.name)}
                onHold={() => actHold(d.id, d.name)}
                onRelease={() => actRelease(d.id, d.name)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function MoneyTile({
  label,
  value,
  hint,
  progress,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  progress?: number;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  return (
    <div
      className={cn(
        "border border-border bg-bg-elevated p-3",
        tone === "warn" && "border-warning/35 bg-warning/5",
        tone === "danger" && "border-danger/35 bg-danger/5",
        tone === "ok" && "border-success/25",
      )}
    >
      <p className="label-caps">{label}</p>
      <p className="mt-1 text-[16px] font-medium tabular-nums sm:text-[18px]">{value}</p>
      {progress !== undefined ? <Progress value={progress} className="mt-2" /> : null}
      <p className="mt-1 text-[10px] text-fg-subtle">{hint}</p>
    </div>
  );
}

function DrawCard({
  draw: d,
  jobName,
  onReady,
  onSubmit,
  onPaid,
  onHold,
  onRelease,
}: {
  draw: ProgressDraw;
  jobName: string;
  onReady: () => void;
  onSubmit: () => void;
  onPaid: () => void;
  onHold: () => void;
  onRelease: () => void;
}) {
  const needsAction = ["ready", "submitted", "held", "upcoming"].includes(d.status);

  return (
    <div
      className={cn(
        "border border-border bg-bg-elevated p-4",
        (d.status === "ready" || d.status === "held") && "border-warning/40",
      )}
      data-testid="draw-card"
      data-status={d.status}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to="/app/projects/$projectId"
            params={{ projectId: d.projectId }}
            search={{ tab: "draws" }}
            className="text-[14px] font-medium hover:underline"
          >
            {jobName}
          </Link>
          <p className="mt-0.5 text-[13px] text-fg">
            {d.name}
            <span className="text-fg-muted"> · {(d.pct * 100).toFixed(0)}%</span>
          </p>
          <p className="mt-1 text-[12px] text-fg-muted">{d.trigger}</p>
          {d.dueDate ? (
            <p className="text-[11px] text-fg-subtle">Due {formatDate(d.dueDate)}</p>
          ) : null}
          {d.paidDate ? (
            <p className="text-[11px] text-fg-subtle">Paid {formatDate(d.paidDate)}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-[18px] font-medium tabular-nums">{formatCurrency(d.amount)}</p>
          <Badge variant={drawBadgeVariant(d.status)} className="mt-1">
            {drawStatusLabel(d.status)}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {d.status === "upcoming" ? (
          <Button className="min-h-11 w-full sm:w-auto" onClick={onReady}>
            <Banknote className="h-4 w-4" strokeWidth={1.75} />
            Mark ready
          </Button>
        ) : null}
        {d.status === "ready" ? (
          <>
            <Button className="min-h-11 w-full sm:w-auto" onClick={onSubmit}>
              Submit to owner / lender
            </Button>
            <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={onHold}>
              Hold
            </Button>
          </>
        ) : null}
        {d.status === "submitted" ? (
          <>
            <Button className="min-h-11 w-full sm:w-auto" onClick={onPaid}>
              Mark paid
            </Button>
            <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={onHold}>
              Hold
            </Button>
            <Button className="min-h-11 w-full sm:w-auto" variant="outline" asChild>
              <Link to="/app/portal" search={{ project: d.projectId }}>
                View on portal
              </Link>
            </Button>
          </>
        ) : null}
        {d.status === "held" ? (
          <Button className="min-h-11 w-full sm:w-auto" onClick={onRelease}>
            Release to ready
          </Button>
        ) : null}
        {d.status === "paid" || !needsAction ? (
          <Button className="min-h-11 w-full sm:w-auto" variant="ghost" asChild>
            <Link
              to="/app/projects/$projectId"
              params={{ projectId: d.projectId }}
              search={{ tab: "draws" }}
            >
              Job hub
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </Button>
        ) : (
          <Button className="min-h-11 w-full sm:ml-auto sm:w-auto" variant="ghost" asChild>
            <Link
              to="/app/projects/$projectId"
              params={{ projectId: d.projectId }}
              search={{ tab: "draws" }}
            >
              Job
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
