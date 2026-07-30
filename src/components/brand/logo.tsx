import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverted?: boolean;
  variant?: "full" | "mark";
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  inverted = false,
  variant = "full",
}: LogoProps) {
  // Prefer full lockup image for marketing fidelity.
  // Use light version by default; dark version when inverted (for dark backgrounds).
  const src =
    variant === "mark"
      ? "/logo-mark.jpg"
      : inverted
        ? "/logo-dark.jpg"
        : "/logo.jpg";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={src}
        alt="Split Rock Construction"
        className={cn(
          variant === "mark"
            ? "h-8 w-auto shrink-0 object-contain"
            : "h-9 w-auto shrink-0 object-contain",
          markClassName,
        )}
        width={variant === "mark" ? 40 : 160}
        height={variant === "mark" ? 38 : 81}
      />
      {/* Wordmark is baked into the full lockup image; only show text fallback for mark-only */}
      {showWordmark && variant === "mark" && (
        <div className="min-w-0 leading-none">
          <div
            className={cn(
              "truncate text-[13px] font-medium tracking-[-0.01em]",
              inverted ? "text-fg-inverse" : "text-fg",
            )}
          >
            Split Rock
          </div>
          <div
            className={cn(
              "mt-0.5 truncate text-[9px] font-medium uppercase tracking-[0.16em]",
              inverted ? "text-fg-inverse/65" : "text-fg-subtle",
            )}
          >
            Construction
          </div>
        </div>
      )}
    </div>
  );
}
