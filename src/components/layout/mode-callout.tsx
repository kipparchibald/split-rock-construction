import { cn } from "@/lib/utils";
import {
  DEMO_BANNER,
  DEMO_EMPTY_HINT,
  isDemoDataEnabled,
  LIVE_EMPTY_HINT,
  LIVE_MODE_BANNER,
} from "@/lib/runtime-config";

type ModeCalloutProps = {
  /** When true, show the compact empty-state hint instead of the full shell banner. */
  empty?: boolean;
  className?: string;
  testId?: string;
};

/** Makes demo vs live obvious on empty boards and in the operator shell. */
export function ModeCallout({ empty = false, className, testId }: ModeCalloutProps) {
  if (isDemoDataEnabled) {
    return (
      <div
        className={cn(
          empty
            ? "border border-warning/40 bg-warning/10 px-4 py-3 text-[12px] leading-relaxed text-fg-muted"
            : "border border-warning/50 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-fg",
          className,
        )}
        data-testid={testId ?? (empty ? "mode-callout-demo-empty" : "mode-callout-demo")}
        role="status"
      >
        {empty ? DEMO_EMPTY_HINT : DEMO_BANNER}
      </div>
    );
  }

  return (
    <div
      className={cn(
        empty
          ? "border border-border bg-bg-subtle px-4 py-3 text-[12px] leading-relaxed text-fg-muted"
          : "border border-success/30 bg-success/5 px-3 py-2 text-[11px] leading-relaxed text-fg-muted",
        className,
      )}
      data-testid={testId ?? (empty ? "mode-callout-live-empty" : "mode-callout-live")}
      role="status"
    >
      {empty ? LIVE_EMPTY_HINT : LIVE_MODE_BANNER}
    </div>
  );
}
