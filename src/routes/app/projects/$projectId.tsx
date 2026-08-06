import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { JobContextBar } from "@/components/layout/job-context-bar";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { NextActionBanner, type NextAction } from "@/components/layout/next-action-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/data/store";
import { payAppTotals } from "@/lib/pay-app";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildJobPnl } from "@/lib/job-cost";
import { JobPnlStrip } from "@/components/layout/job-pnl-strip";
import { drawBadgeVariant, drawStatusLabel, summarizeDraws } from "@/lib/draws";

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

const CLOSING_TABS = [
  { value: "closeout", label: "Closeout" },
  { value: "realty", label: "Realty" },
] as const;

type TabValue =
  | (typeof BASE_TABS)[number]["value"]
  | (typeof COMMERCIAL_TABS)[number]["value"]
  | (typeof CLOSING_TABS)[number]["value"];

const ALL_TAB_VALUES = new Set<string>([
  ...BASE_TABS.map((t) => t.value),
  ...COMMERCIAL_TABS.map((t) => t.value),
  ...CLOSING_TABS.map((t) => t.value),
]);

function parseTab(raw: unknown): TabValue | undefined {
  if (typeof raw !== "string") return undefined;
  return ALL_TAB_VALUES.has(raw) ? (raw as TabValue) : undefined;
}

export const Route = createFileRoute("/app/projects/$projectId")({
  validateSearch: (search: Record<string, unknown>): { tab?: TabValue } => ({
    tab: parseTab(search.tab),
  }),
  component: ProjectHub,
});

function ProjectHub() {
  const { projectId } = Route.useParams();
  const { tab: searchTab } = Route.useSearch();
  const navigate = useNavigate({ from: "/app/projects/$projectId" });
  const {
    projects, clients, draws, changeOrders, selections, dailyLogs,
    documents, budgetLines, members, subcontracts, payApplications, commercialMeta,
    closeoutPackages, realtyDeals, permitPackages,
    submitDraw, markDrawPaid, markDrawReady, holdDraw, releaseDraw,
    setChangeOrderStatus, addChangeOrder, setSelectionStatus,
    setSubStatus, submitPayApp, certifyPayApp, markPayAppPaid,
    setCloseoutItemStatus, setRealtyItemStatus, setRealtyDealStatus,
    acknowledgeDualCapacity, adjustPunch, ensurePermitPackage,
  } = useAppStore();
  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.clientId);
  const [tab, setTab] = useState<TabValue>(searchTab ?? "overview");
  const [coFormOpen, setCoFormOpen] = useState(false);
  const [coTitle, setCoTitle] = useState("");
  const [coAmount, setCoAmount] = useState("");
  const [coDays, setCoDays] = useState("0");
  const [coDesc, setCoDesc] = useState("");
  const [coBy, setCoBy] = useState("");
  const [lastSentCoId, setLastSentCoId] = useState<string | null>(null);

  useEffect(() => {
    if (searchTab && searchTab !== tab) setTab(searchTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTab]);

  const setTabAndUrl = (next: TabValue) => {
    setTab(next);
    void navigate({
      search: (prev) => ({ ...prev, tab: next === "overview" ? undefined : next }),
      replace: true,
    });
  };

  const pDraws = useMemo(() => draws.filter((d) => d.projectId === projectId), [draws, projectId]);
  const pCOs = useMemo(() => changeOrders.filter((c) => c.projectId === projectId), [changeOrders, projectId]);
  const pSel = useMemo(() => selections.filter((s) => s.projectId === projectId), [selections, projectId]);
  const pLogs = useMemo(() => dailyLogs.filter((l) => l.projectId === projectId), [dailyLogs, projectId]);
  const pDocs = useMemo(() => documents.filter((d) => d.projectId === projectId), [documents, projectId]);
  const pBudget = useMemo(() => budgetLines.filter((b) => b.projectId === projectId), [budgetLines, projectId]);
  const pSubs = useMemo(() => subcontracts.filter((s) => s.projectId === projectId), [subcontracts, projectId]);
  const pPayApps = useMemo(() => payApplications.filter((a) => a.projectId === projectId), [payApplications, projectId]);
  const meta = commercialMeta.find((m) => m.projectId === projectId);
  const closeout = closeoutPackages.find((c) => c.projectId === projectId);
  const realty = realtyDeals.find((d) => d.projectId === projectId);
  const permitPkg = permitPackages.find((p) => p.projectId === projectId);
  const crew = members.filter((m) => m.projectId === projectId);

  const nextAction: NextAction = useMemo(() => {
    if (!project) {
      return { severity: "clear", title: "Job not found", detail: "Return to jobs list." };
    }
    const status = project.status;
    const hub = (t?: TabValue): Pick<NextAction, "to" | "params" | "search"> => ({
      to: "/app/projects/$projectId",
      params: { projectId: project.id },
      search: t && t !== "overview" ? { tab: t } : undefined,
    });
    const readyDraw = pDraws.find((d) => d.status === "ready" || d.status === "submitted" || d.status === "held");
    const pendingCO = pCOs.find((c) => c.status === "pending_owner");
    const pendingSel = pSel.find((s) => s.status === "pending_owner");
    const openPunch = closeout?.punchOpen ?? 0;
    const dualPending = realty?.dualCapacity === "pending_disclosure";
    const lienIncomplete = closeout?.items.find((i) => i.key === "lien_waivers" && i.status !== "complete");

    if (status === "planning") {
      return { severity: "med", title: "Complete bid & contract", detail: "Move from planning into permitting once signed.", to: "/app/pricing", cta: "Open pricing" };
    }
    if (status === "permitting") {
      return {
        severity: "med",
        title: "Finish permit package",
        detail: "Jefferson County / EIPH items still open.",
        to: "/app/permits",
        search: { project: project.id },
        cta: "Open permits",
      };
    }
    if (dualPending) {
      return { severity: "high", title: "Dual-capacity disclosure required", detail: "Agency election must be acknowledged before close.", ...hub("realty"), cta: "Open closing" };
    }
    if (pendingCO) {
      return { severity: "high", title: `Owner decision · ${pendingCO.number}`, detail: pendingCO.title, ...hub("changes"), cta: "Review change order" };
    }
    if (readyDraw) {
      const cta =
        readyDraw.status === "held"
          ? "Release hold"
          : readyDraw.status === "submitted"
            ? "Mark paid"
            : "Submit / track draw";
      return { severity: "high", title: `Draw ${readyDraw.status} · ${formatCurrency(readyDraw.amount)}`, detail: readyDraw.name, ...hub("draws"), cta };
    }
    if (pendingSel) {
      return { severity: "med", title: `Selection waiting · ${pendingSel.category}`, detail: `${pendingSel.room}`, ...hub("selections"), cta: "Review selections" };
    }
    if (lienIncomplete && (status === "punch_list" || status === "complete")) {
      return { severity: "high", title: "Lien waivers incomplete", detail: "Required before final payment and close.", ...hub("closeout"), cta: "Track waivers" };
    }
    if (status === "punch_list" || openPunch > 0) {
      return { severity: "high", title: `${openPunch} punch items open`, detail: "Clear punch before final closeout and CO.", ...hub("closeout"), cta: "Open closeout" };
    }
    if (status === "in_progress") {
      return { severity: "low", title: "Continue current phase", detail: `${project.phase} — post daily logs and keep photos current.`, ...hub("logs"), cta: "Daily log" };
    }
    return { severity: "clear", title: "On track", detail: "No blocking decisions or draws right now." };
  }, [project, pDraws, pCOs, pSel, closeout, realty]);

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
    ? [...BASE_TABS.filter((x) => x.value !== "selections"), ...COMMERCIAL_TABS, ...CLOSING_TABS]
    : [...BASE_TABS, ...CLOSING_TABS];
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
            {project.planId ? <Badge variant="secondary">From plan</Badge> : null}
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

      <NextActionBanner action={nextAction} className="mb-5" />

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

      <Tabs value={tab} onValueChange={(v) => setTabAndUrl(v as TabValue)}>
        <div className="mb-4 md:hidden">
          <Select value={tab} onValueChange={(v) => setTabAndUrl(v as TabValue)}>
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
          {pBudget.length > 0 ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Job P&L snapshot</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setTabAndUrl("budget")}>Full budget</Button>
              </CardHeader>
              <CardContent>
                <JobPnlStrip pnl={buildJobPnl(project, {
                  budgetLines: pBudget,
                  changeOrders: pCOs,
                  draws: pDraws,
                  selections: pSel,
                  subcontracts: pSubs,
                  payApplications: pPayApps,
                })} />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader><CardTitle>Phase schedule</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {project.schedule.map((ph) => (
                <div key={ph.phase} className="border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium">{ph.phase}</p>
                    <span className="text-[11px] tabular-nums text-fg-subtle">{ph.pct}%</span>
                  </div>
                  <Progress value={ph.pct} className="mt-2" />
                  <p className="mt-1 text-[11px] text-fg-subtle">{formatDate(ph.start)} → {formatDate(ph.end)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Job cost</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/budget">Open portfolio job cost</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pBudget.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No budget lines yet. Start from a plan or seed from Bid & price.</p>
              ) : (
                pBudget.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-[12px]">
                    <div className="min-w-0">
                      <p className="font-medium text-fg">{b.category}</p>
                      <p className="text-fg-subtle">{b.costCodeId}</p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p>{formatCurrency(b.actual)} / {formatCurrency(b.budgeted)}</p>
                      <p className="text-[11px] text-fg-subtle">committed {formatCurrency(b.committed)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draws">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Progress draws</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/draws">Portfolio draws</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {pDraws.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No draws on this job yet. Seed from Book of Plans or Bid & price.</p>
              ) : (
                (() => {
                  const cash = summarizeDraws(pDraws);
                  return (
                    <>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="border border-border p-3">
                          <p className="label-caps">Paid</p>
                          <p className="mt-1 text-[15px] font-medium tabular-nums">{formatCurrency(cash.paid)}</p>
                          <p className="text-[11px] text-fg-subtle">{cash.paidPct}% of schedule</p>
                        </div>
                        <div className="border border-border p-3">
                          <p className="label-caps">In flight</p>
                          <p className="mt-1 text-[15px] font-medium tabular-nums">
                            {formatCurrency(cash.ready + cash.submitted)}
                          </p>
                        </div>
                        <div className="border border-border p-3">
                          <p className="label-caps">Remaining</p>
                          <p className="mt-1 text-[15px] font-medium tabular-nums">{formatCurrency(cash.remaining)}</p>
                        </div>
                      </div>
                      {cash.nextAction && cash.nextActionLabel ? (
                        <div className="border border-border bg-bg-subtle px-3 py-2 text-[12px]">
                          <span className="font-medium">Next: </span>
                          {cash.nextActionLabel} · {cash.nextAction.name} · {formatCurrency(cash.nextAction.amount)}
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        {pDraws.map((d) => (
                          <div
                            key={d.id}
                            className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-[13px] font-medium">{d.name}</p>
                              <p className="text-[12px] text-fg-muted">
                                {d.trigger} · {(d.pct * 100).toFixed(0)}%
                                {d.dueDate ? ` · due ${formatDate(d.dueDate)}` : ""}
                                {d.paidDate ? ` · paid ${formatDate(d.paidDate)}` : ""}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-medium tabular-nums">{formatCurrency(d.amount)}</span>
                              <Badge variant={drawBadgeVariant(d.status)}>{drawStatusLabel(d.status)}</Badge>
                              {d.status === "upcoming" ? (
                                <Button size="sm" onClick={() => markDrawReady(d.id)}>Mark ready</Button>
                              ) : null}
                              {d.status === "ready" ? (
                                <>
                                  <Button size="sm" onClick={() => submitDraw(d.id)}>Submit</Button>
                                  <Button size="sm" variant="outline" onClick={() => holdDraw(d.id)}>Hold</Button>
                                </>
                              ) : null}
                              {d.status === "submitted" ? (
                                <>
                                  <Button size="sm" onClick={() => markDrawPaid(d.id)}>Mark paid</Button>
                                  <Button size="sm" variant="outline" onClick={() => holdDraw(d.id)}>Hold</Button>
                                </>
                              ) : null}
                              {d.status === "held" ? (
                                <Button size="sm" onClick={() => releaseDraw(d.id)}>Release</Button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changes">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle>Change orders</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/app/portal" search={{ project: projectId }}>
                    Owner portal
                  </Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setCoFormOpen((o) => !o);
                    if (!coBy && (client?.name || project?.superintendent)) {
                      setCoBy(client?.name || project?.superintendent || "");
                    }
                  }}
                >
                  {coFormOpen ? "Cancel" : "Add change order"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastSentCoId ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border border-success/30 bg-success/5 px-3 py-2 text-[12px]">
                  <p className="text-fg">
                    Change order sent — it now appears on the <strong>owner portal</strong> for approve / decline.
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/app/portal" search={{ project: projectId }}>
                      Open owner portal
                    </Link>
                  </Button>
                </div>
              ) : null}
              {coFormOpen ? (
                <form
                  className="space-y-3 border border-border bg-bg-subtle p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!coTitle.trim()) return;
                    const before = useAppStore.getState().changeOrders.map((c) => c.id);
                    addChangeOrder({
                      projectId,
                      title: coTitle.trim(),
                      amount: Number(coAmount) || 0,
                      daysImpact: Number(coDays) || 0,
                      description: coDesc.trim() || coTitle.trim(),
                      requestedBy: coBy.trim() || client?.name || project?.superintendent,
                      status: "pending_owner",
                    });
                    const created = useAppStore.getState().changeOrders.find((c) => !before.includes(c.id));
                    setLastSentCoId(created?.id ?? "sent");
                    setCoTitle("");
                    setCoAmount("");
                    setCoDays("0");
                    setCoDesc("");
                    setCoFormOpen(false);
                  }}
                >
                  <p className="text-[12px] text-fg-muted">
                    Creates a written change order and sends it to the owner portal for approval. The client sees
                    amount, days impact, and can approve or decline.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="co-title">Title</Label>
                      <Input
                        id="co-title"
                        value={coTitle}
                        onChange={(e) => setCoTitle(e.target.value)}
                        placeholder="e.g. Upgrade exterior stone veneer"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="co-amount">Amount ($)</Label>
                      <Input
                        id="co-amount"
                        type="number"
                        min={0}
                        step={100}
                        value={coAmount}
                        onChange={(e) => setCoAmount(e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="co-days">Schedule impact (days)</Label>
                      <Input
                        id="co-days"
                        type="number"
                        min={0}
                        value={coDays}
                        onChange={(e) => setCoDays(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="co-by">Requested by</Label>
                      <Input
                        id="co-by"
                        value={coBy}
                        onChange={(e) => setCoBy(e.target.value)}
                        placeholder={client?.name || "Owner / superintendent"}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="co-desc">Description</Label>
                      <Input
                        id="co-desc"
                        value={coDesc}
                        onChange={(e) => setCoDesc(e.target.value)}
                        placeholder="Scope, location, and why it is needed"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm">
                      Save & send to owner
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!coTitle.trim()) return;
                        addChangeOrder({
                          projectId,
                          title: coTitle.trim(),
                          amount: Number(coAmount) || 0,
                          daysImpact: Number(coDays) || 0,
                          description: coDesc.trim() || coTitle.trim(),
                          requestedBy: coBy.trim() || client?.name || project?.superintendent,
                          status: "draft",
                        });
                        setLastSentCoId(null);
                        setCoTitle("");
                        setCoAmount("");
                        setCoDays("0");
                        setCoDesc("");
                        setCoFormOpen(false);
                      }}
                    >
                      Save as draft
                    </Button>
                  </div>
                </form>
              ) : null}

              {pCOs.length === 0 && !coFormOpen ? (
                <p className="text-[13px] text-fg-muted">
                  No change orders yet. Use <strong className="font-medium text-fg">Add change order</strong> for
                  upgrades and scope changes.
                </p>
              ) : (
                pCOs.map((c) => (
                  <div key={c.id} className="border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-medium">
                        {c.number} · {c.title}
                      </p>
                      <Badge variant="outline">{c.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-fg-muted">{c.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-medium tabular-nums">{formatCurrency(c.amount)}</span>
                      {c.daysImpact > 0 ? (
                        <span className="text-[11px] text-fg-subtle">+{c.daysImpact} days</span>
                      ) : null}
                      {c.status === "draft" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setChangeOrderStatus(c.id, "pending_owner");
                            setLastSentCoId(c.id);
                          }}
                        >
                          Send to owner
                        </Button>
                      ) : null}
                      {c.status === "pending_owner" ? (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/app/portal" search={{ project: projectId }}>
                              View on portal
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => setChangeOrderStatus(c.id, "approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setChangeOrderStatus(c.id, "rejected")}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selections">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Selections & allowances</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/portal" search={{ project: projectId }}>Owner view</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pSel.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No selections tracked.</p>
              ) : (
                pSel.map((s) => (
                  <div key={s.id} className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{s.category} · {s.room}</p>
                      <p className="text-[12px] text-fg-muted">
                        Allowance {formatCurrency(s.allowance)}
                        {s.choice ? ` · ${s.choice}` : ""}
                        {s.actual !== undefined ? ` · actual ${formatCurrency(s.actual)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.status.replace(/_/g, " ")}</Badge>
                      {s.status === "pending_owner" || s.status === "not_started" ? (
                        <>
                          <Button size="sm" onClick={() => setSelectionStatus(s.id, "approved", s.choice ?? s.category)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectionStatus(s.id, "pending_owner")}>
                            Send to owner
                          </Button>
                        </>
                      ) : null}
                      {s.status === "approved" ? (
                        <Button size="sm" variant="outline" onClick={() => setSelectionStatus(s.id, "ordered")}>
                          Mark ordered
                        </Button>
                      ) : null}
                      {s.status === "ordered" ? (
                        <Button size="sm" variant="outline" onClick={() => setSelectionStatus(s.id, "installed")}>
                          Mark installed
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Daily logs</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/daily-logs">All logs</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {pLogs.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No logs yet — post from Field board or Daily logs.</p>
              ) : (
                pLogs.map((l) => (
                  <div key={l.id} className="border border-border p-3">
                    <div className="flex justify-between gap-2 text-[12px]">
                      <span className="font-medium">{formatDate(l.date)}</span>
                      <span className="text-fg-subtle">{l.crewCount} crew · {l.hours}h · {l.weather}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-fg-muted">{l.workDone}</p>
                    {l.blockers ? <p className="mt-1 text-[11px] text-warning">Blocker: {l.blockers}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Documents & permits</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/permits" search={{ project: projectId }}>
                    Permits / EIPH
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {permitPkg ? (
                <div className="border border-border bg-bg-subtle p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-medium">Permit package</p>
                      <p className="text-[11px] text-fg-subtle">
                        {permitPkg.items.filter((i) => i.status === "approved").length}/{permitPkg.items.length} approved ·{" "}
                        {permitPkg.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/app/permits" search={{ project: projectId }}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {permitPkg.items.slice(0, 4).map((i) => (
                      <li key={i.key} className="flex items-center justify-between text-[11px] text-fg-muted">
                        <span>{i.label}</span>
                        <span className="tabular-nums">{i.status.replace(/_/g, " ")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : project?.type === "residential" ? (
                <div className="border border-border p-3 text-[12px] text-fg-muted">
                  No permit package yet.{" "}
                  <button
                    type="button"
                    className="font-medium text-fg underline-offset-2 hover:underline"
                    onClick={() => ensurePermitPackage(projectId)}
                  >
                    Create Jefferson County / EIPH package
                  </button>
                </div>
              ) : null}
              {pDocs.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No documents on this job.</p>
              ) : (
                pDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 border border-border px-3 py-2">
                    <div>
                      <p className="text-[13px] font-medium">{d.title}</p>
                      <p className="text-[11px] text-fg-subtle">
                        {d.type.replace(/_/g, " ")}
                        {d.reference ? ` · ${d.reference}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{d.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client">
          <Card>
            <CardHeader><CardTitle>Client</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-[13px]">
              {client ? (
                <>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-fg-muted">{client.email} · {client.phone}</p>
                  <p className="text-fg-muted">{client.address}</p>
                  {client.notes ? <p className="text-fg-subtle">{client.notes}</p> : null}
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link to="/app/portal" search={{ project: projectId }}>Open owner portal</Link>
                  </Button>
                </>
              ) : (
                <p className="text-fg-muted">No client linked.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subs">
          <Card>
            <CardHeader><CardTitle>Subcontracts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pSubs.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No subcontracts.</p>
              ) : (
                pSubs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between border border-border p-3 text-[12px]">
                    <div>
                      <p className="font-medium">{s.company} · {s.trade}</p>
                      <p className="text-fg-subtle">{formatCurrency(s.contractAmount)} · retainage {s.retainagePct}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.status}</Badge>
                      {s.status === "bidding" ? (
                        <Button size="sm" onClick={() => setSubStatus(s.id, "awarded")}>Award</Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" size="sm" asChild><Link to="/app/commercial">Open commercial module</Link></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payapps">
          <Card>
            <CardHeader><CardTitle>Pay applications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pPayApps.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No pay apps.</p>
              ) : (
                pPayApps.map((a) => {
                  const totals = payAppTotals(a);
                  return (
                    <div key={a.id} className="border border-border p-3 text-[12px]">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium">Pay app #{a.number}</p>
                        <Badge variant="outline">{a.status}</Badge>
                      </div>
                      <p className="mt-1 text-fg-muted">Period end {formatDate(a.periodEnd)} · this period {formatCurrency(totals.thisPeriod)}</p>
                      <div className="mt-2 flex gap-2">
                        {a.status === "draft" ? <Button size="sm" onClick={() => submitPayApp(a.id)}>Submit</Button> : null}
                        {a.status === "submitted" ? <Button size="sm" onClick={() => certifyPayApp(a.id)}>Certify</Button> : null}
                        {a.status === "certified" ? <Button size="sm" onClick={() => markPayAppPaid(a.id)}>Mark paid</Button> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader><CardTitle>Delivery method</CardTitle></CardHeader>
            <CardContent className="text-[13px] text-fg-muted">
              {meta ? (
                <ul className="space-y-1">
                  <li>Delivery: {meta.delivery.replace(/_/g, " ")}</li>
                  <li>Bond: {meta.bondStatus} · {formatCurrency(meta.bondAmount)}</li>
                  <li>Architect: {meta.architect || "—"}</li>
                  <li>Owner rep: {meta.ownerRep || "—"}</li>
                  <li>LDs: {formatCurrency(meta.liquidatedDamagesPerDay)}/day</li>
                </ul>
              ) : (
                <p>No commercial meta on this job.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closeout">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Closeout package</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/closing" search={{ project: projectId }}>Full closing module</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {!closeout ? (
                <p className="text-[13px] text-fg-muted">No closeout package yet.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-fg-muted">
                    <span>
                      Punch open {closeout.punchOpen} · closed {closeout.punchClosed}
                    </span>
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={closeout.punchOpen <= 0}
                        onClick={() => adjustPunch(closeout.id, -1)}
                      >
                        Close 1 punch
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => adjustPunch(closeout.id, 1)}>
                        Add punch
                      </Button>
                    </span>
                  </div>
                  {closeout.items.map((it) => (
                    <div key={it.key} className="flex flex-wrap items-center justify-between gap-2 border border-border px-3 py-2 text-[12px]">
                      <span>{it.label}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{it.status.replace(/_/g, " ")}</Badge>
                        {it.status === "not_started" || it.status === "in_progress" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setCloseoutItemStatus(
                                closeout.id,
                                it.key,
                                it.status === "not_started" ? "in_progress" : "complete",
                              )
                            }
                          >
                            {it.status === "not_started" ? "Start" : "Done"}
                          </Button>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realty">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Realty / dual capacity</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/closing" search={{ project: projectId }}>Full closing module</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-[13px]">
              {!realty ? (
                <p className="text-fg-muted">No realty track on this job (construction-only).</p>
              ) : (
                <>
                  <p>
                    Status: <span className="font-medium">{realty.status.replace(/_/g, " ")}</span>
                  </p>
                  <p>
                    Agency: {realty.agencyRole.replace(/_/g, " ")} · Dual:{" "}
                    {realty.dualCapacity.replace(/_/g, " ")}
                  </p>
                  {realty.dualCapacity === "pending_disclosure" ? (
                    <Button size="sm" onClick={() => acknowledgeDualCapacity(realty.id, "Client")}>
                      Record dual-capacity acknowledgment
                    </Button>
                  ) : null}
                  {realty.dualCapacity === "disclosed" && realty.dualCapacityAcknowledgedAt ? (
                    <p className="text-[12px] text-success">
                      Disclosed {formatDate(realty.dualCapacityAcknowledgedAt)}
                      {realty.dualCapacityAcknowledgedBy ? ` · ${realty.dualCapacityAcknowledgedBy}` : ""}
                    </p>
                  ) : null}
                  {realty.items.map((it) => (
                    <div key={it.key} className="flex flex-wrap items-center justify-between gap-2 border border-border px-3 py-2 text-[12px]">
                      <span>
                        {it.label}
                        <span className="mt-0.5 block text-[10px] text-fg-subtle">{it.systemOfRecord}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{it.status.replace(/_/g, " ")}</Badge>
                        {it.status === "not_started" || it.status === "in_progress" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setRealtyItemStatus(
                                realty.id,
                                it.key,
                                it.status === "not_started" ? "in_progress" : "complete",
                              )
                            }
                          >
                            {it.status === "not_started" ? "Start" : "Done"}
                          </Button>
                        ) : null}
                      </span>
                    </div>
                  ))}
                  {realty.status === "listed" ? (
                    <Button size="sm" variant="outline" onClick={() => setRealtyDealStatus(realty.id, "under_contract")}>
                      Mark under contract
                    </Button>
                  ) : null}
                  {realty.status === "under_contract" ? (
                    <Button size="sm" variant="outline" onClick={() => setRealtyDealStatus(realty.id, "pending_close")}>
                      Mark pending close
                    </Button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
