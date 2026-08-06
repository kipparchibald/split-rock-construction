import type { DrawStatus, ProgressDraw } from "@/data/types";

/** Buyer-funded draw lifecycle (residential GC best practice). */
export const DRAW_FLOW: { status: DrawStatus; label: string; hint: string }[] = [
  { status: "upcoming", label: "Upcoming", hint: "Milestone not reached yet" },
  { status: "ready", label: "Ready", hint: "Trigger met — submit to owner/lender" },
  { status: "submitted", label: "Submitted", hint: "Waiting on payment" },
  { status: "paid", label: "Paid", hint: "Cash received" },
  { status: "held", label: "Held", hint: "Paused — fix issue before resubmit" },
];

export function drawStatusLabel(status: DrawStatus): string {
  return status.replace(/_/g, " ");
}

export function drawBadgeVariant(
  status: DrawStatus,
): "success" | "warning" | "danger" | "secondary" | "outline" {
  if (status === "paid") return "success";
  if (status === "ready" || status === "submitted") return "warning";
  if (status === "held") return "danger";
  return "secondary";
}

export interface DrawCashSummary {
  total: number;
  paid: number;
  submitted: number;
  ready: number;
  held: number;
  upcoming: number;
  remaining: number;
  paidPct: number;
  /** First draw that needs operator action */
  nextAction?: ProgressDraw;
  nextActionLabel?: string;
}

export function summarizeDraws(draws: ProgressDraw[]): DrawCashSummary {
  const sum = (status: DrawStatus | DrawStatus[]) => {
    const set = Array.isArray(status) ? status : [status];
    return draws.filter((d) => set.includes(d.status)).reduce((s, d) => s + d.amount, 0);
  };
  const total = draws.reduce((s, d) => s + d.amount, 0);
  const paid = sum("paid");
  const submitted = sum("submitted");
  const ready = sum("ready");
  const held = sum("held");
  const upcoming = sum("upcoming");
  const remaining = Math.max(0, total - paid);

  const order: DrawStatus[] = ["held", "ready", "submitted", "upcoming"];
  let nextAction: ProgressDraw | undefined;
  for (const st of order) {
    nextAction = draws.find((d) => d.status === st);
    if (nextAction) break;
  }

  let nextActionLabel: string | undefined;
  if (nextAction) {
    if (nextAction.status === "ready") nextActionLabel = "Submit for payment";
    else if (nextAction.status === "submitted") nextActionLabel = "Mark paid when funds clear";
    else if (nextAction.status === "held") nextActionLabel = "Resolve hold & release";
    else if (nextAction.status === "upcoming") nextActionLabel = "Mark ready when trigger is met";
  }

  return {
    total,
    paid,
    submitted,
    ready,
    held,
    upcoming,
    remaining,
    paidPct: total > 0 ? Math.round((paid / total) * 100) : 0,
    nextAction,
    nextActionLabel,
  };
}

/** Sort draws for operator queues: action first, then schedule order. */
export function sortDrawsForQueue(draws: ProgressDraw[]): ProgressDraw[] {
  const order: Record<DrawStatus, number> = {
    held: 0,
    ready: 1,
    submitted: 2,
    upcoming: 3,
    paid: 4,
  };
  return [...draws].sort((a, b) => order[a.status] - order[b.status] || a.pct - b.pct);
}
