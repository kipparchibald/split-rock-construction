import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverted?: boolean;
  /** full = horizontal lockup image; mark = icon + optional text */
  variant?: "full" | "mark";
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  inverted = false,
  variant = "full",
}: LogoProps) {
  // Full lockup is a real image (mark + wordmark). Dark variant for dark chrome.
  // Mark uses the square app mark so nav stays crisp at small sizes.
  if (variant === "full") {
    const src = inverted ? "/logo-dark.jpg" : "/logo.jpg";
    return (
      <div className={cn("flex items-center", className)}>
        <img
          src={src}
          alt="Split Rock Construction"
          className={cn("h-9 w-auto max-w-[200px] shrink-0 object-contain object-left sm:h-10 sm:max-w-[240px]", markClassName)}
          width={240}
          height={84}
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/logo-app-mark.jpg"
        alt=""
        aria-hidden={!showWordmark}
        className={cn("h-8 w-8 shrink-0 rounded-[var(--radius-sm)] object-cover", markClassName)}
        width={32}
        height={32}
        decoding="async"
      />
      {showWordmark ? (
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
      ) : null}
    </div>
  );
}
