import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { JobContextBar } from "@/components/layout/job-context-bar";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/data/store";
import { payAppTotals } from "@/lib/pay-app";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId")({
  component: ProjectHub,
});

const BASE_TABS = [
  { value: "overview", label: "Overview" },
  { value: "schedule", label: "Schedule" },
  { value: "budget", label: "Budget" },
  { value: "draws", label: "Draws" },
  { value: "changes", label: "Change orders" },
  { value: "selections", label: "Selections" },
  { value: "logs", label: "Daily log" },
  { value: "docs", label: "Documents" },
  { value: "client", label: "Client" },
] as const;

const COMMERCIAL_TABS = [
  { value: "subs", label: "Subcontracts" },
  { value: "payapps", label: "Pay apps" },
  { value: "delivery", label: "Delivery" },
] as const;

type TabValue = (typeof BASE_TABS)[number]["value"] | (typeof COMMERCIAL_TABS)[number]["value"];

function ProjectHub() {
  const { projectId } = Route.useParams();
  const {
    projects, clients, draws, changeOrders, selections, dailyLogs,
    documents, budgetLines, members, subcontracts, payApplications, commercialMeta,
    submitDraw, setChangeOrderStatus, setSelectionStatus,
    setSubStatus, submitPayApp, certifyPayApp, markPayAppPaid,
  } = useAppStore();
  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.clientId);
  const [tab, setTab] = useState<TabValue>("overview");

  if (!project) {
    return (
      <div className="py-16 text-center">
        <p className="text-[13px] text-fg-muted">Job not found.</p>
        <Button asChild className="mt-4" variant="outline" size="sm"><Link to="/app/projects">Back to jobs</Link></Button>
      </div>
    );
  }

  const isCommercial = project.type === "commercial";
  const tabMeta = isCommercial
    ? [...BASE_TABS.filter((x) => x.value !== "selections"), ...COMMERCIAL_TABS]
    : [...BASE_TABS];
  const pDraws = draws.filter((d) => d.projectId === project.id);
  const pCOs = changeOrders.filter((c) => c.projectId === project.id);
  const pSel = selections.filter((s) => s.projectId === project.id);
  const pLogs = dailyLogs.filter((l) => l.projectId === project.id);
  const pDocs = documents.filter((d) => d.projectId === project.id);
  const pBudget = budgetLines.filter((b) => b.projectId === project.id);
  const pSubs = subcontracts.filter((s) => s.projectId === project.id);
  const pPayApps = payApplications.filter((a) => a.projectId === project.id);
  const meta = commercialMeta.find((m) => m.projectId === project.id);
  const crew = members.filter((m) => m.projectId === project.id);
  const paid = pDraws.filter((d) => d.status === "paid").reduce((s, d) => s + d.amount, 0);
  const coTotal = pCOs.filter((c) => c.status === "approved" || c.status === "invoiced").reduce((s, c) => s + c.amount, 0);
  const contractTotal = project.budget + coTotal;

  return (
    <div>
      <JobContextBar project={project} contractTotal={contractTotal} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-medium tracking-[-0.02em]">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
            <Badge variant="outline">{project.type}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-fg-muted">{project.address} · {client?.name}</p>
          <p className="mt-1 text-[12px] text-fg-subtle">
            Super: {project.superintendent} · {project.sqft.toLocaleString()} sqft
            {project.beds ? ` · ${project.beds} bed / ${project.baths} bath` : ""}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="label-caps">Contract</p>
          <p className="text-lg font-medium tabular-nums">{formatCurrency(contractTotal)}</p>
          <p className="text-[11px] text-fg-subtle">base {formatCurrency(project.budget)} + COs {formatCurrency(coTotal)}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          { k: "Progress", v: `${project.progress}%` },
          { k: "Spent", v: formatCurrency(project.spent) },
          { k: "Draws paid", v: formatCurrency(paid) },
          { k: "Phase", v: project.phase },
        ].map((s) => (
          <div key={s.k} className="border border-border bg-bg-elevated p-3">
            <p className="label-caps">{s.k}</p>
            <p className="mt-1 text-[15px] font-medium tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        {/* Mobile: select */}
        <div className="mb-4 md:hidden">
          <Select value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <SelectTrigger aria-label="Job section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabMeta.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Desktop: horizontal chips */}
        <TabsList className="mb-1 hidden h-auto w-full flex-wrap md:inline-flex">
          {tabMeta.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Scope</CardTitle></CardHeader>
            <CardContent>
              <p className="text-[13px] leading-relaxed text-fg-muted">{project.description}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="border border-border p-3">
                  <p className="label-caps">Crew on job</p>
                  <ul className="mt-2 space-y-1">
                    {crew.length ? crew.map((m) => (
                      <li key={m.id} className="text-[12px] text-fg-muted">{m.name} · {m.role}</li>
                    )) : <li className="text-[12px] text-fg-subtle">No assignments</li>}
                  </ul>
                </div>
                <div className="border border-border p-3">
                  <p className="label-caps">Milestones</p>
                  <ul className="mt-2 space-y-1">
                    {project.milestones.map((m) => (
                      <li key={m.name} className="flex justify-between gap-2 text-[12px]">
                        <span className={m.done ? "text-fg-subtle line-through" : "text-fg-muted"}>{m.name}</span>
                        <span className="tabular-nums text-fg-subtle">{formatDate(m.date)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader><CardTitle>Phase schedule</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {project.schedule.map((s) => (
                <div key={s.phase}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="font-medium">{s.phase}</span>
                    <span className="tabular-nums text-fg-subtle">{formatDate(s.start)} → {formatDate(s.end)} · {s.pct}%</span>
                  </div>
                  <Progress value={s.pct} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader><CardTitle>Job cost</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="hidden grid-cols-4 gap-2 border-b border-border px-4 py-2 text-[11px] uppercase tracking-[0.06em] text-fg-subtle sm:grid">
                <span>Category</span><span>Budgeted</span><span>Committed</span><span>Actual</span>
              </div>
              {pBudget.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-fg-muted">No cost codes yet.</p>
              ) : pBudget.map((b) => (
                <div key={b.id} className="grid gap-1 border-b border-border px-4 py-3 text-[12px] last:border-0 sm:grid-cols-4 sm:items-center">
                  <span className="font-medium">{b.category}</span>
                  <span className="tabular-nums">{formatCurrency(b.budgeted)}</span>
                  <span className="tabular-nums text-fg-muted">{formatCurrency(b.committed)}</span>
                  <span className={`tabular-nums ${b.actual > b.budgeted ? "text-danger" : ""}`}>{formatCurrency(b.actual)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draws">
          <Card>
            <CardHeader><CardTitle>Progress draws</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pDraws.map((d) => (
                <div key={d.id} className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-medium">{d.name}</p>
                    <p className="text-[11px] text-fg-muted">{d.trigger}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium tabular-nums">{formatCurrency(d.amount)}</span>
                    <Badge variant={d.status === "paid" ? "success" : d.status === "ready" || d.status === "submitted" ? "warning" : "secondary"}>{d.status.replace("_", " ")}</Badge>
                    {d.status === "ready" ? (
                      <Button size="sm" onClick={() => submitDraw(d.id)}>Submit</Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!pDraws.length ? <p className="text-[13px] text-fg-muted">No draw schedule on this job.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardHeader><CardTitle>Change orders</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pCOs.map((c) => (
                <div key={c.id} className="border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-medium">{c.number} · {c.title}</p>
                      <p className="mt-1 text-[12px] text-fg-muted">{c.description}</p>
                      <p className="mt-1 text-[11px] text-fg-subtle">{formatDate(c.date)} · {c.requestedBy} · +{c.daysImpact} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium tabular-nums">{formatCurrency(c.amount)}</p>
                      <Badge className="mt-1" variant={c.status === "approved" || c.status === "invoiced" ? "success" : c.status === "pending_owner" ? "warning" : "secondary"}>
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  {c.status === "pending_owner" ? (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => setChangeOrderStatus(c.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => setChangeOrderStatus(c.id, "rejected")}>Reject</Button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!pCOs.length ? <p className="text-[13px] text-fg-muted">No change orders.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selections">
          <Card>
            <CardHeader><CardTitle>Selections & allowances</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pSel.map((s) => (
                <div key={s.id} className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-medium">{s.room} · {s.category}</p>
                    <p className="text-[11px] text-fg-muted">
                      Allowance {formatCurrency(s.allowance)}
                      {s.actual != null ? ` · actual ${formatCurrency(s.actual)}` : ""}
                      {s.choice ? ` · ${s.choice}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === "pending_owner" ? "warning" : s.status === "approved" || s.status === "ordered" || s.status === "installed" ? "success" : "secondary"}>
                      {s.status.replace(/_/g, " ")}
                    </Badge>
                    {s.status === "pending_owner" ? (
                      <Button size="sm" onClick={() => setSelectionStatus(s.id, "approved")}>Approve</Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!pSel.length ? <p className="text-[13px] text-fg-muted">No selections tracked.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle>Daily logs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pLogs.map((l) => (
                <div key={l.id} className="border border-border p-3">
                  <div className="flex flex-wrap justify-between gap-2 text-[12px]">
                    <span className="font-medium">{formatDate(l.date)} · {l.weather}</span>
                    <span className="tabular-nums text-fg-subtle">{l.crewCount} crew · {l.hours}h · {l.author}</span>
                  </div>
                  <p className="mt-2 text-[13px] text-fg-muted">{l.workDone}</p>
                  {l.blockers ? <p className="mt-1 text-[12px] text-warning">Blocker: {l.blockers}</p> : null}
                  {l.photos?.length ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {l.photos.map((src) => (
                        <img key={src} src={src} alt="" className="h-20 w-28 shrink-0 border border-border object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!pLogs.length ? <p className="text-[13px] text-fg-muted">No logs yet.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 border border-border p-3">
                  <div>
                    <p className="text-[13px] font-medium">{d.title}</p>
                    <p className="text-[11px] text-fg-muted">{d.type.replace("_", " ")} · {d.author} · {formatDate(d.updatedAt)}</p>
                  </div>
                  <Badge variant={d.status === "approved" ? "success" : d.status === "open" || d.status === "pending" ? "warning" : "secondary"}>{d.status}</Badge>
                </div>
              ))}
              {!pDocs.length ? <p className="text-[13px] text-fg-muted">No documents.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="subs" className="space-y-2">
          {pSubs.map((sub) => (
            <div key={sub.id} className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium">{sub.company} · Div {sub.csiDivision}</p>
                <p className="text-[12px] text-fg-muted">{sub.trade} · {sub.contact}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] tabular-nums font-medium">{formatCurrency(sub.contractAmount)}</span>
                <Badge variant="secondary">{sub.status}</Badge>
                {sub.status === "bidding" ? <Button size="sm" onClick={() => setSubStatus(sub.id, "awarded")}>Award</Button> : null}
              </div>
            </div>
          ))}
          {!pSubs.length ? <p className="text-[13px] text-fg-muted">No subcontracts.</p> : null}
          <Button variant="outline" size="sm" asChild><Link to="/app/commercial">Open commercial module</Link></Button>
        </TabsContent>

        <TabsContent value="payapps" className="space-y-3">
          {pPayApps.slice().sort((a, b) => b.number - a.number).map((app) => {
            const totals = payAppTotals(app);
            return (
              <div key={app.id} className="border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium">Pay app #{app.number}</p>
                    <p className="text-[11px] text-fg-muted">Period {formatDate(app.periodEnd)} · due {formatCurrency(totals.currentPayment)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={app.status === "paid" ? "success" : app.status === "draft" ? "secondary" : "warning"}>{app.status}</Badge>
                    {app.status === "draft" ? <Button size="sm" onClick={() => submitPayApp(app.id)}>Submit</Button> : null}
                    {app.status === "submitted" ? <Button size="sm" onClick={() => certifyPayApp(app.id)}>Certify</Button> : null}
                    {app.status === "certified" ? <Button size="sm" variant="outline" onClick={() => markPayAppPaid(app.id)}>Paid</Button> : null}
                  </div>
                </div>
              </div>
            );
          })}
          {!pPayApps.length ? <p className="text-[13px] text-fg-muted">No pay applications.</p> : null}
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader><CardTitle>Commercial delivery</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                ["Delivery", meta?.delivery.replace(/_/g, " ") ?? "—"],
                ["Bond", meta ? `${meta.bondStatus.replace(/_/g, " ")} · ${formatCurrency(meta.bondAmount)}` : "—"],
                ["Architect", meta?.architect ?? "—"],
                ["Owner rep", meta?.ownerRep ?? "—"],
                ["LD / day", meta ? formatCurrency(meta.liquidatedDamagesPerDay) : "—"],
                ["OCIP", meta?.ocip ? "Yes" : "No"],
                ["Prevailing wage", meta?.prevailingWage ? "Yes" : "No"],
                ["Substantial", meta?.substantialDate ? formatDate(meta.substantialDate) : "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="border border-border p-3">
                  <p className="label-caps">{k}</p>
                  <p className="mt-1 text-[13px] font-medium capitalize">{v}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client">
          <Card>
            <CardHeader><CardTitle>Owner snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[13px] text-fg-muted">What the homeowner sees in the portal — progress, pending decisions, and money.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-border p-3">
                  <p className="label-caps">Progress</p>
                  <p className="mt-1 text-xl font-medium tabular-nums">{project.progress}%</p>
                </div>
                <div className="border border-border p-3">
                  <p className="label-caps">Awaiting you</p>
                  <p className="mt-1 text-xl font-medium tabular-nums">
                    {pCOs.filter((c) => c.status === "pending_owner").length + pSel.filter((s) => s.status === "pending_owner").length}
                  </p>
                </div>
                <div className="border border-border p-3">
                  <p className="label-caps">Next draw</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {pDraws.find((d) => d.status === "ready" || d.status === "upcoming")?.name ?? "—"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/portal">Open owner portal</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
