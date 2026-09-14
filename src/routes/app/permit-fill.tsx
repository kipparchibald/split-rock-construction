import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CityworksAiFill } from "@/components/permits/cityworks-ai-fill";

export const Route = createFileRoute("/app/permit-fill")({
  component: PermitFillPage,
});

function PermitFillPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="AI permit fill"
        description="River Bend 8-31-2026b + Holwege facts mapped onto the Rigby SFD Cityworks fields. Does not file."
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link to="/app/permits">Back to permit package</Link>
        </Button>
      </div>
      <CityworksAiFill jobName="Holwege Residence — Lot 16" />
    </div>
  );
}
