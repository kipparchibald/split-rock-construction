import { useMemo } from "react";
import type { DesignOption } from "@/data/types";
import { buildSwatchStyle } from "@/lib/design-materials";
import { cn } from "@/lib/utils";

export function DesignSwatch({
  option,
  className,
  size = "md",
}: {
  option: DesignOption;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const style = useMemo(() => buildSwatchStyle(option), [option]);

  return (
    <span
      className={cn(
        "shrink-0 border border-border",
        size === "sm" && "h-3 w-3",
        size === "md" && "mt-0.5 h-10 w-10 sm:h-10 sm:w-10",
        size === "lg" && "mt-0.5 h-12 w-12",
        className,
      )}
      style={style}
      title={option.imageHint}
    />
  );
}
