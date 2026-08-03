import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { plans } from "@/data/plans";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/data/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/plans")({ component: PlansPage });

function PlansPage() {
  const projects = useAppStore((s) => s.projects);

  function jobsUsingPlan(planId: string) {
    return projects.filter((p) => p.planId === planId).length;
  }

  return (
    <div>
      <PageHeader
        title="Book of Plans"
        description="Repeatable ranch + basement packages sized for Teton Heights lots and Jefferson County buyers. Seed a job from any plan to lock budget, draws, and allowances."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="border border-border bg-bg-elevated p-4">
          <p className="label-caps">Active plans</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{plans.filter((p) => p.active).length}</p>
        </div>
        <div className="border border-border bg-bg-elevated p-4">
          <p className="label-caps">Main-floor range</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">1,520–1,620</p>
        </div>
        <div className="border border-border bg-bg-elevated p-4">
          <p className="label-caps">Base price band</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{formatCurrency(409000)}–{formatCurrency(468000)}</p>
        </div>
      </div>

      <div className="space-y-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant="outline">{plan.code}</Badge>
                  <Badge variant="secondary">{plan.style.replace("_", " ")}</Badge>
                  {plan.active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Archived</Badge>}
                </div>
                <p className="mt-1 text-[13px] text-fg-muted">{plan.description}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="label-caps">Base price</p>
                <p className="text-xl font-medium tabular-nums">{formatCurrency(plan.basePrice)}</p>
                <p className="text-[11px] text-fg-subtle">+ lot · allowances · options</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="border border-border p-3">
                  <p className="label-caps">Main / basement</p>
                  <p className="mt-1 text-[15px] font-medium tabular-nums">
                    {plan.mainFloorSqft.toLocaleString()} / {plan.basementSqft.toLocaleString()} sf
                  </p>
                </div>
                <div className="border border-border p-3">
                  <p className="label-caps">Beds / baths</p>
                  <p className="mt-1 text-[15px] font-medium">
                    {plan.beds} / {plan.baths}
                  </p>
                </div>
                <div className="border border-border p-3">
                  <p className="label-caps">Garage</p>
                  <p className="mt-1 text-[15px] font-medium">{plan.garage}</p>
                </div>
                <div className="border border-border p-3">
                  <p className="label-caps">Jobs using plan</p>
                  <p className="mt-1 text-[15px] font-medium tabular-nums">{jobsUsingPlan(plan.id)}</p>
                </div>
              </div>

              <div>
                <p className="label-caps mb-2">Highlights</p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {plan.highlights.map((h) => (
                    <li key={h} className="text-[13px] text-fg-muted">
                      · {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="label-caps mb-2">Standard allowances</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {plan.allowances.map((a) => (
                    <div key={a.category} className="flex justify-between border border-border px-3 py-2 text-[12px]">
                      <span className="text-fg-muted">{a.category}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(a.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="label-caps mb-2">Elevation options</p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.elevationOptions.map((e) => (
                    <Badge key={e} variant="outline">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    toast.message("Start job from plan", {
                      description: `Use Bid & Price or create a new job, then seed budget/draws from ${plan.code}. Full one-click seed is wired in the next iteration.`,
                    });
                  }}
                >
                  Start job from plan
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/app/pricing">Open Bid & price</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/app/projects">View jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-[12px] text-fg-subtle">
        Plans are designed for the Teton Heights Division 6 lots (wells, septic, roads included) and can be adapted for custom lots in Rigby / Jefferson County. Base prices exclude lot and buyer-selected upgrades.
      </p>
    </div>
  );
}
