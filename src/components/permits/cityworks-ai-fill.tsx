import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CITYWORKS_HELP,
  CITYWORKS_PORTAL,
  EIPH_SEPTIC,
  cityworksWorksheetText,
  fieldCounts,
  fieldsByGroup,
  fillRigbySfdFromPlans,
  type FieldConfidence,
} from "@/lib/permit-cityworks-fields";
import { toast } from "sonner";

const VARIANT: Record<FieldConfidence, "success" | "secondary" | "warning" | "danger"> = {
  locked: "success",
  from_plans: "secondary",
  confirm: "warning",
  missing: "danger",
};

export function CityworksAiFill({ jobName }: { jobName?: string }) {
  const fields = useMemo(() => fillRigbySfdFromPlans(jobName), [jobName]);
  const groups = useMemo(() => fieldsByGroup(fields), [fields]);
  const counts = useMemo(() => fieldCounts(fields), [fields]);
  const [open, setOpen] = useState(true);

  function copySheet() {
    void navigator.clipboard.writeText(cityworksWorksheetText(fields));
    toast.success("Cityworks worksheet copied");
  }

  return (
    <div className="border border-border bg-bg-elevated">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="label-caps">AI fill from plans</p>
          <p className="mt-1 text-[12px] text-fg-muted">
            River Bend 8-31-2026b + contract facts mapped onto the Rigby SFD Cityworks fields.
            Does not file. {counts.locked} locked · {counts.from_plans} from plans · {counts.confirm}{" "}
            confirm · {counts.missing} missing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="min-h-10" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide fields" : "Show fields"}
          </Button>
          <Button size="sm" variant="outline" className="min-h-10" onClick={copySheet}>
            Copy worksheet
          </Button>
          <Button size="sm" className="min-h-10" asChild>
            <a href={CITYWORKS_PORTAL} target="_blank" rel="noopener noreferrer">
              Open Cityworks
            </a>
          </Button>
        </div>
      </div>
      {open ? (
        <div className="space-y-4 p-4">
          {groups.map((g) => (
            <div key={g.group}>
              <p className="label-caps mb-2">{g.group}</p>
              <div className="divide-y divide-border border border-border">
                {g.fields.map((field) => (
                  <div key={field.id} className="grid gap-1 px-3 py-2 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                    <p className="text-[12px] font-medium">{field.label}</p>
                    <p className="text-[12px] leading-relaxed text-fg-muted">{field.value}</p>
                    <Badge variant={VARIANT[field.confidence]}>{field.confidence.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] leading-relaxed text-fg-subtle">
            File EIPH septic first ({" "}
            <a className="underline-offset-2 hover:underline" href={EIPH_SEPTIC} target="_blank" rel="noopener noreferrer">
              packet
            </a>
            ). Field list:{" "}
            <a className="underline-offset-2 hover:underline" href={CITYWORKS_HELP} target="_blank" rel="noopener noreferrer">
              Rigby SFD help sheet
            </a>
            . Setbacks and PIN stay blank until a scaled site plan and assessor print exist.
          </p>
        </div>
      ) : null}
    </div>
  );
}
