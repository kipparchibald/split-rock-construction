import { createFileRoute, Link } from "@tanstack/react-router";
import { Palette, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/design")({ component: DesignStudioPage });

function DesignStudioPage() {
  return (
    <div>
      <PageHeader
        title="Virtual design studio"
        description="Upload plans, swap finishes, and generate realistic previews for custom builds and land-home packages."
      />
      <div className="border border-border bg-bg-elevated p-6 sm:p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-bg-subtle">
            <Palette className="h-5 w-5 text-fg-muted" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-[15px] font-medium">Studio ready for plan sets</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            Photoreal finish swaps (wood species, paint, cabinets, fixtures) and walkthrough previews are
            staged for the next build pass. Until then, use Book of Plans for base packages and Bid &
            Price for allowances.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button size="sm" variant="outline" disabled>
              <Upload className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Upload plan (coming next)
            </Button>
            <Button size="sm" asChild>
              <Link to="/app/plans">Open Book of Plans</Link>
            </Button>
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-fg-subtle">
            Spec and land-home marketing images can be generated here once plan upload is wired — keep
            this route in nav so field demos do not 404.
          </p>
        </div>
      </div>
    </div>
  );
}
