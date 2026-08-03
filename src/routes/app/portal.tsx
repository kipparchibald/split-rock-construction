import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/app/portal")({ component: PortalPage });

function PortalPage() {
  const { projects, clients, draws, changeOrders, selections, dailyLogs } = useAppStore();
  const homeProjects = projects.filter((p) => p.type === "residential" && p.status !== "planning");
  const [projectId, setProjectId] = useState(homeProjects[0]?.id ?? projects[0]?.id ?? "");
  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.clientId);
  if (!project) return <p className="text-[13px] text-fg-muted">No projects.</p>;

  const pDraws = draws.filter((d) => d.projectId === project.id);
  const pendingCOs = changeOrders.filter((c) => c.projectId === project.id && c.status === "pending_owner");
  const pendingSel = selections.filter((s) => s.projectId === project.id && s.status === "pending_owner");
  const logs = dailyLogs.filter((l) => l.projectId === project.id).slice(0, 3);
  const paid = pDraws.filter((d) => d.status === "paid").reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <PageHeader
        title="Owner portal"
        description="What clients see — progress, money, decisions, and 3D tours. Modeled after Buildertrend / CoConstruct client portals."
      />
      <div className="mb-4 max-w-sm">
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 border border-border bg-bg-elevated p-5">
        <p className="label-caps">Welcome</p>
        <h2 className="mt-1 text-lg font-medium">{client?.name}</h2>
        <p className="text-[13px] text-fg-muted">{project.name} · {project.address}</p>
        <Progress value={project.progress} className="mt-4" />
        <p className="mt-2 text-[12px] tabular-nums text-fg-subtle">{project.progress}% complete · {project.phase}</p>
      </div>

      {project.matterportId ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3D tour (Matterport)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full overflow-hidden border border-border bg-bg-subtle">
              <iframe
                title="Matterport 3D tour"
                src={`https://my.matterport.com/show/?m=${project.matterportId}`}
                className="h-full w-full"
                allowFullScreen
                allow="xr-spatial-tracking"
              />
            </div>
            <p className="mt-2 text-[11px] text-fg-subtle">
              Live Matterport space embed. Replace the space ID on the project record with your capture ID.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Needs your decision</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...pendingCOs.map((c) => ({ t: c.title, d: `Change order ${c.number} · ${formatCurrency(c.amount)}` })),
              ...pendingSel.map((s) => ({ t: `${s.room} · ${s.category}`, d: s.choice ?? `Allowance ${formatCurrency(s.allowance)}` })),
            ].length === 0 ? (
              <p className="text-[13px] text-fg-muted">Nothing waiting — you're caught up.</p>
            ) : (
              [...pendingCOs.map((c) => ({ t: c.title, d: `Change order ${c.number} · ${formatCurrency(c.amount)}` })),
                ...pendingSel.map((s) => ({ t: `${s.room} · ${s.category}`, d: s.choice ?? `Allowance ${formatCurrency(s.allowance)}` })),
              ].map((item, i) => (
                <div key={i} className="border border-border p-3">
                  <p className="text-[13px] font-medium">{item.t}</p>
                  <p className="text-[12px] text-fg-muted">{item.d}</p>
                  <Badge className="mt-2" variant="warning">Awaiting owner</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Money</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-border p-3">
                <p className="label-caps">Contract</p>
                <p className="mt-1 text-[15px] font-medium tabular-nums">{formatCurrency(project.budget)}</p>
              </div>
              <div className="border border-border p-3">
                <p className="label-caps">Paid to date</p>
                <p className="mt-1 text-[15px] font-medium tabular-nums">{formatCurrency(paid)}</p>
              </div>
            </div>
            <div className="space-y-1">
              {pDraws.slice(0, 5).map((d) => (
                <div key={d.id} className="flex justify-between text-[12px]">
                  <span className="text-fg-muted">{d.name}</span>
                  <span className="tabular-nums">{formatCurrency(d.amount)} · {d.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Latest from the field</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="border border-border p-3">
                <p className="text-[12px] text-fg-subtle">{formatDate(l.date)} · {l.author}</p>
                <p className="mt-1 text-[13px] text-fg-muted">{l.workDone}</p>
              </div>
            ))}
            {!logs.length ? <p className="text-[13px] text-fg-muted">Updates will appear as crews post daily logs.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
