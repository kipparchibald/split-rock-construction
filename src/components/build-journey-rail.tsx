import { Check } from "lucide-react";
import {
  phaseStatus,
  type PhaseStatus,
} from "@/lib/build-journey";
import { cn } from "@/lib/utils";

export type BuildJourneyRailProps = {
  phases: readonly string[] | string[];
  /** Current job phase (e.g. "Site" or project.phase "Site Work"). */
  current?: string;
  variant: "marketing" | "portal";
  className?: string;
};

function statusLabel(status: PhaseStatus): string {
  if (status === "completed") return "completed";
  if (status === "current") return "current";
  return "upcoming";
}

/**
 * Horizontal, scrollable build-phase rail for case study + owner portal.
 * Min tap target 44px; accessible list semantics.
 */
export function BuildJourneyRail({
  phases,
  current,
  variant,
  className,
}: BuildJourneyRailProps) {
  const list = Array.from(phases);
  const isPortal = variant === "portal";

  return (
    <div
      className={cn("w-full", className)}
      data-testid="build-journey-rail"
      data-variant={variant}
    >
      <ol
        className={cn(
          "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory",
        )}
        aria-label="Build journey phases"
      >
        {list.map((phase, i) => {
          const status = phaseStatus(current, phase, list);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          return (
            <li
              key={phase}
              className="snap-start shrink-0"
              aria-current={isCurrent ? "step" : undefined}
            >
              <div
                className={cn(
                  "inline-flex min-h-11 min-w-[7.5rem] items-center gap-2 rounded-sm border px-3 text-[12px] font-medium transition-colors",
                  isPortal
                    ? isCurrent
                      ? "border-forest bg-forest-light text-forest"
                      : isCompleted
                        ? "border-forest/35 bg-bg-elevated text-fg"
                        : "border-border bg-bg text-fg-muted"
                    : isCurrent
                      ? "border-forest bg-forest text-forest-fg shadow-sm"
                      : isCompleted
                        ? "border-forest/40 bg-forest-light text-forest"
                        : "border-sand bg-bg-elevated text-fg-muted",
                )}
                title={`${phase} — ${statusLabel(status)}`}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] tabular-nums",
                    isPortal
                      ? isCurrent
                        ? "bg-forest text-forest-fg"
                        : isCompleted
                          ? "bg-forest/15 text-forest"
                          : "bg-bg-subtle text-fg-subtle"
                      : isCurrent
                        ? "bg-forest-fg/20 text-forest-fg"
                        : isCompleted
                          ? "bg-forest/20 text-forest"
                          : "bg-sand/80 text-fg-subtle",
                  )}
                  aria-hidden
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" strokeWidth={2.25} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate">{phase}</span>
                  <span
                    className={cn(
                      "text-[10px] font-normal capitalize",
                      isCurrent
                        ? isPortal
                          ? "text-forest/80"
                          : "text-forest-fg/80"
                        : "text-fg-subtle",
                    )}
                  >
                    {statusLabel(status)}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
