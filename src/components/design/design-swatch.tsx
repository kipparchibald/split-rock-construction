import { useMemo } from "react";
import type { DesignOption } from "@/data/types";
import { buildSwatchStyle, optionColor } from "@/lib/design-materials";
import { resolveScannedPbr } from "@/lib/design-pbr";
import { vendorFor, vendorHex, vendorLabel } from "@/lib/design-vendor";
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
  const style = useMemo(() => {
    const hex =
      vendorHex(option.id, optionColor(option, option.colorHex ?? "#cccccc")) ??
      option.colorHex ??
      "#cccccc";
    const scanned = resolveScannedPbr(option);
    if (scanned) {
      return {
        backgroundColor: hex,
        backgroundImage: `url(${scanned.diff})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as const;
    }
    return { ...buildSwatchStyle(option), backgroundColor: hex };
  }, [option]);

  const vendor = vendorFor(option.id);
  const title = [option.name, vendor?.colorCode ?? vendor?.sku, vendorLabel(option.id), option.imageHint]
    .filter(Boolean)
    .join(" — ");

  return (
    <span
      className={cn(
        "shrink-0 overflow-hidden border border-border bg-bg",
        size === "sm" && "h-3 w-3",
        size === "md" && "mt-0.5 h-10 w-10 sm:h-10 sm:w-10",
        size === "lg" && "mt-0.5 h-12 w-12",
        className,
      )}
      style={style}
      title={title}
    />
  );
}

export function DesignOptionMeta({ option }: { option: DesignOption }) {
  const vendor = vendorFor(option.id);
  const line = [option.brand, vendor?.colorCode ?? vendor?.sku, option.finish, option.woodSpecies]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <span className="mt-0.5 block text-[11px] text-fg-muted">{line}</span>
      {vendor?.line ? (
        <span className="mt-0.5 hidden text-[11px] text-fg-subtle sm:block">{vendor.line}</span>
      ) : (
        <span className="mt-1 hidden text-[11px] text-fg-subtle sm:block">{option.imageHint}</span>
      )}
    </>
  );
}
