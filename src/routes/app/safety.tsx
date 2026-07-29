import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { SeverityBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import { formatDate } from "@/lib/utils";
import type { SafetySeverity } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/safety")({ component: SafetyPage });

function SafetyPage() {
  const { safety, projects, closeSafety, addSafetyIncident } = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [severity, setSeverity] = useState<SafetySeverity>("near_miss");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addSafetyIncident({
      date: new Date().toISOString().slice(0, 10), projectId, severity, title, description,
      reportedBy: "Field", status: "open",
    });
    setTitle(""); setDescription(""); setOpen(false);
    toast.success("Incident logged");
  }

  return (
    <div>
      <PageHeader title="Safety" description="Near-misses and incidents — log fast, close cleaner." actions={
        <Button size="sm" onClick={() => setOpen((v) => !v)}>{open ? "Cancel" : "Log incident"}</Button>
      } />
      {open ? (
        <form onSubmit={submit} className="mb-6 grid gap-3 border border-border bg-bg-elevated p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Title</Label><Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div>
            <Label>Job</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as SafetySeverity)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["near_miss","minor","serious","critical"].map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
          <Button type="submit">Save incident</Button>
        </form>
      ) : null}
      <div className="space-y-2">
        {safety.map((s) => {
          const p = projects.find((x) => x.id === s.projectId);
          return (
            <div key={s.id} className="border border-border bg-bg-elevated p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-medium">{s.title}</p>
                  <p className="mt-1 text-[12px] text-fg-muted">{s.description}</p>
                  <p className="mt-1 text-[11px] text-fg-subtle">{formatDate(s.date)} · {p?.name} · {s.reportedBy}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={s.severity} />
                  <Badge variant={s.status === "closed" ? "outline" : "warning"}>{s.status}</Badge>
                  {s.status !== "closed" ? <Button size="sm" variant="outline" onClick={() => closeSafety(s.id)}>Close</Button> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
