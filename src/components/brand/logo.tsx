import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  inverted?: boolean;
  variant?: "svg" | "mark";
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
  inverted = false,
  variant = "svg",
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={variant === "mark" ? "/logo.jpg" : "/logo.svg"}
        alt=""
        className={cn("h-8 w-auto shrink-0 object-contain", markClassName)}
        width={32}
        height={38}
      />
      {showWordmark && (
        <div className="min-w-0 leading-none">
          <div className={cn("truncate text-[13px] font-medium tracking-[-0.01em]", inverted ? "text-fg-inverse" : "text-fg")}>
            Split Rock
          </div>
          <div className={cn("mt-0.5 truncate text-[9px] font-medium uppercase tracking-[0.16em]", inverted ? "text-fg-inverse/65" : "text-fg-subtle")}>
            Construction
          </div>
        </div>
      )}
    </div>
  );
}
