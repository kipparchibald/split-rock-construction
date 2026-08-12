import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/data/store";
import { payAppTotals } from "@/lib/pay-app";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/commercial")({ component: CommercialPage });

function CommercialPage() {
  const {
    projects, clients, subcontracts, payApplications, commercialMeta,
    setSubStatus, submitPayApp, certifyPayApp, markPayAppPaid,
  } = useAppStore();
  const commercialJobs = projects.filter((p) => p.type === "commercial");
  const [jobFilter, setJobFilter] = useState<string>("all");

  const filteredSubs = useMemo(
    () => subcontracts.filter((s) => jobFilter === "all" || s.projectId === jobFilter),
    [subcontracts, jobFilter],
  );
  const filteredApps = useMemo(
    () => payApplications.filter((a) => jobFilter === "all" || a.projectId === jobFilter),
    [payApplications, jobFilter],
  );

  const subVolume = filteredSubs.reduce((s, x) => s + x.contractAmount, 0);
  const openPay = filteredApps
    .filter((a) => a.status === "submitted" || a.status === "certified" || a.status === "draft")
    .reduce((s, a) => s + Math.max(0, payAppTotals(a).currentPayment), 0);
  const bonded = commercialMeta.filter((m) => m.bondStatus === "active").length;

  return (
    <div>
      <PageHeader
        title="Commercial"
        description="Sub buyout, CSI packages, bonds, and pay applications — GC tools for shells, TI, and design-assist."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commercial jobs" value={String(commercialJobs.length)} hint="Active + pipeline" />
        <StatCard label="Subcontract volume" value={formatCurrency(subVolume)} hint={`${filteredSubs.length} packages`} />
        <StatCard label="Open pay apps" value={formatCurrency(openPay)} hint="Draft + submitted + certified" />
        <StatCard label="Active bonds" value={String(bonded)} hint="Performance / payment" />
      </div>

      <FilterChips
        className="mb-4"
        value={jobFilter}
        onChange={setJobFilter}
        options={[
          { value: "all", label: "All jobs", count: commercialJobs.length },
          ...commercialJobs.map((p) => ({ value: p.id, label: p.name, count: subcontracts.filter((s) => s.projectId === p.id).length })),
        ]}
      />

      <Tabs defaultValue="subs">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="subs">Subcontracts</TabsTrigger>
          <TabsTrigger value="payapps">Pay applications</TabsTrigger>
          <TabsTrigger value="jobs">Job cards</TabsTrigger>
        </TabsList>

        <TabsContent value="subs" className="space-y-2">
          {filteredSubs.map((sub) => {
            const job = projects.find((p) => p.id === sub.projectId);
            const open = sub.contractAmount - sub.paidToDate;
            return (
              <div key={sub.id} className="flex flex-col gap-3 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium">{sub.company}</p>
                    <Badge variant="outline">Div {sub.csiDivision}</Badge>
                    <Badge variant={sub.status === "mobilized" || sub.status === "awarded" ? "info" : sub.status === "complete" || sub.status === "closed" ? "success" : "secondary"}>
                      {sub.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-fg-muted">
                    <Link to="/app/projects/$projectId" params={{ projectId: sub.projectId }} className="hover:underline">{job?.name}</Link>
                    {" · "}{sub.trade} · {sub.contact} · {sub.phone}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Insurance exp {formatDate(sub.insuranceExp)} · Retainage {sub.retainagePct}%
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right text-[12px] tabular-nums">
                    <p className="font-medium">{formatCurrency(sub.contractAmount)}</p>
                    <p className="text-fg-subtle">billed {formatCurrency(sub.billedToDate)} · paid {formatCurrency(sub.paidToDate)}</p>
                    <p className="text-fg-muted">open {formatCurrency(open)}</p>
                  </div>
                  {sub.status === "bidding" ? (
                    <Button size="sm" onClick={() => setSubStatus(sub.id, "awarded")}>Award</Button>
                  ) : null}
                  {sub.status === "awarded" ? (
                    <Button size="sm" variant="outline" onClick={() => setSubStatus(sub.id, "mobilized")}>Mobilize</Button>
                  ) : null}
                  {sub.status === "mobilized" ? (
                    <Button size="sm" variant="outline" onClick={() => setSubStatus(sub.id, "complete")}>Complete</Button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!filteredSubs.length ? (
            <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">No subcontracts for this filter.</p>
          ) : null}
        </TabsContent>

        <TabsContent value="payapps" className="space-y-3">
          {filteredApps
            .slice()
            .sort((a, b) => b.number - a.number)
            .map((app) => {
              const job = projects.find((p) => p.id === app.projectId);
              const t = payAppTotals(app);
              return (
                <Card key={app.id}>
                  <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle>
                        Pay app #{app.number} · {job?.name}
                      </CardTitle>
                      <p className="mt-1 text-[12px] text-fg-muted">
                        Period ending {formatDate(app.periodEnd)} · Retainage {app.retainagePct}%
                        {app.notes ? ` · ${app.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          app.status === "paid"
                            ? "success"
                            : app.status === "submitted" || app.status === "certified"
                              ? "warning"
                              : app.status === "held"
                                ? "danger"
                                : "secondary"
                        }
                      >
                        {app.status}
                      </Badge>
                      {app.status === "draft" ? (
                        <Button size="sm" onClick={() => submitPayApp(app.id)}>Submit</Button>
                      ) : null}
                      {app.status === "submitted" ? (
                        <Button size="sm" onClick={() => certifyPayApp(app.id)}>Certify</Button>
                      ) : null}
                      {app.status === "certified" ? (
                        <Button size="sm" variant="outline" onClick={() => markPayAppPaid(app.id)}>Mark paid</Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-4">
                      {[
                        ["Scheduled", t.scheduled],
                        ["This period", t.thisPeriod + t.stored],
                        ["Retainage hold", t.thisRetainage],
                        ["Current payment", t.currentPayment],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="border border-border p-3">
                          <p className="label-caps">{k}</p>
                          <p className="mt-1 text-[14px] font-medium tabular-nums">{formatCurrency(Number(v))}</p>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto border border-border">
                      <table className="w-full min-w-[640px] text-left text-[12px]">
                        <thead className="border-b border-border bg-bg-subtle text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
                          <tr>
                            <th className="px-3 py-2 font-medium">Description</th>
                            <th className="px-3 py-2 font-medium">Scheduled</th>
                            <th className="px-3 py-2 font-medium">Previous</th>
                            <th className="px-3 py-2 font-medium">This period</th>
                            <th className="px-3 py-2 font-medium">Stored</th>
                            <th className="px-3 py-2 font-medium">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {app.lines.map((line) => {
                            const completed = line.previousBilled + line.thisPeriod + line.materialsStored;
                            return (
                              <tr key={line.id} className="border-b border-border last:border-0">
                                <td className="px-3 py-2 font-medium">{line.description}</td>
                                <td className="px-3 py-2 tabular-nums">{formatCurrency(line.scheduledValue)}</td>
                                <td className="px-3 py-2 tabular-nums text-fg-muted">{formatCurrency(line.previousBilled)}</td>
                                <td className="px-3 py-2 tabular-nums">{formatCurrency(line.thisPeriod)}</td>
                                <td className="px-3 py-2 tabular-nums text-fg-muted">{formatCurrency(line.materialsStored)}</td>
                                <td className="px-3 py-2 tabular-nums">{formatCurrency(line.scheduledValue - completed)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          {!filteredApps.length ? (
            <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">No pay applications for this filter.</p>
          ) : null}
        </TabsContent>

        <TabsContent value="jobs" className="grid gap-3 md:grid-cols-2">
          {commercialJobs.map((p) => {
            const client = clients.find((c) => c.id === p.clientId);
            const meta = commercialMeta.find((m) => m.projectId === p.id);
            const subs = subcontracts.filter((s) => s.projectId === p.id);
            return (
              <Link
                key={p.id}
                to="/app/projects/$projectId"
                params={{ projectId: p.id }}
                className="border border-border bg-bg-elevated p-4 transition-colors hover:bg-bg-subtle"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium">{p.name}</p>
                    <p className="mt-0.5 text-[12px] text-fg-muted">{client?.name} · {p.sqft.toLocaleString()} sqft</p>
                  </div>
                  <Badge variant="outline">Commercial</Badge>
                </div>
                <p className="mt-3 text-[12px] text-fg-muted line-clamp-2">{p.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-fg-subtle">
                  <span>Delivery: {meta?.delivery.replace(/_/g, " ") ?? "—"}</span>
                  <span>Bond: {meta?.bondStatus.replace(/_/g, " ") ?? "—"}</span>
                  <span>Subs: {subs.length}</span>
                  <span>LD: {meta ? formatCurrency(meta.liquidatedDamagesPerDay) : "—"}/day</span>
                </div>
                <p className="mt-2 text-[12px] tabular-nums font-medium">{formatCurrency(p.budget)} · {p.progress}%</p>
              </Link>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
