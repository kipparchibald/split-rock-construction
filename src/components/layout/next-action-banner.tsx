import { Link } from "@tanstack/react-router";
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NextActionSeverity = "high" | "med" | "low" | "clear";

export interface NextAction {
  severity: NextActionSeverity;
  title: string;
  detail?: string;
  /** Route path — string path or TanStack path template e.g. /app/projects/$projectId */
  to?: string;
  /** Route params when using path templates */
  params?: Record<string, string>;
  /** Search params — use { tab: "draws" } for Job Hub deep links */
  search?: Record<string, string | undefined>;
  cta?: string;
}

interface NextActionBannerProps {
  action: NextAction | null;
  className?: string;
  compact?: boolean;
}

const severityStyles: Record<NextActionSeverity, string> = {
  high: "border-danger/40 bg-danger/5",
  med: "border-warning/40 bg-warning/5",
  low: "border-border bg-bg-elevated",
  clear: "border-success/30 bg-success/5",
};

const severityIcon = {
  high: AlertTriangle,
  med: Clock,
  low: Clock,
  clear: CheckCircle2,
};

export function NextActionBanner({ action, className, compact = false }: NextActionBannerProps) {
  if (!action) return null;

  const Icon = severityIcon[action.severity];
  const isClear = action.severity === "clear";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        severityStyles[action.severity],
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            isClear ? "text-success" : action.severity === "high" ? "text-danger" : "text-warning",
          )}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <p className={cn("text-[13px] font-medium text-fg", compact && "text-[12px]")}>
            {isClear ? "All clear" : "Next action"}
            {!isClear && <span className="text-fg-muted"> · </span>}
            {!isClear && action.title}
          </p>
          {action.detail ? (
            <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">{action.detail}</p>
          ) : null}
        </div>
      </div>
      {action.to && !isClear ? (
        <Button size="sm" variant={action.severity === "high" ? "default" : "outline"} asChild className="shrink-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Link to={action.to as any} params={action.params as any} search={action.search as any}>
            {action.cta ?? "Go"}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
