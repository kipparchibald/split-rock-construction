import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps">{label}</p>
            <p className="mt-2 text-[1.5rem] font-medium tracking-[-0.02em] tabular-nums text-fg">{value}</p>
            {hint ? <p className="mt-1 text-[11px] leading-snug text-fg-subtle">{hint}</p> : null}
          </div>
          {icon ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border text-fg-muted">{icon}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
