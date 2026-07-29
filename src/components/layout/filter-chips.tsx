import { cn } from "@/lib/utils";

export type FilterChipOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="tablist"
      aria-label="Filter"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors",
              active
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-bg-elevated text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {opt.label}
            {opt.count !== undefined ? (
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-primary-fg/70" : "text-fg-subtle",
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
