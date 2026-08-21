import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, DollarSign, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { NextActionBanner, type NextAction } from "@/components/layout/next-action-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import { ModeCallout } from "@/components/layout/mode-callout";
import { isDemoDataEnabled, LIVE_EMPTY_HINT } from "@/lib/runtime-config";
import { COMPANY } from "@/lib/company";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const projects = useAppStore((s) => s.projects);
  const draws = useAppStore((s) => s.draws);
  const changeOrders = useAppStore((s) => s.changeOrders);
  const documents = useAppStore((s) => s.documents);
  const safety = useAppStore((s) => s.safety);
  const selections = useAppStore((s) => s.selections);
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  const activity = useAppStore((s) => s.activity);
  const clients = useAppStore((s) => s.clients);
  const payApplications = useAppStore((s) => s.payApplications);
  const subcontracts = useAppStore((s) => s.subcontracts);
  const closeoutPackages = useAppStore((s) => s.closeoutPackages);
  const realtyDeals = useAppStore((s) => s.realtyDeals);

  const {
    active,
    budget,
    spent,
    readyDraws,
    openSafety,
    commercialCount,
    attention,
  } = useMemo(() => {
  const active = projects.filter((p) => !["complete", "on_hold"].includes(p.status));
  const budget = active.reduce((s, p) => s + p.budget, 0);
  const spent = active.reduce((s, p) => s + p.spent, 0);
  const readyDraws = draws.filter((d) => d.status === "ready" || d.status === "submitted");
  const pendingCOs = changeOrders.filter((c) => c.status === "pending_owner");
  const openDocs = documents.filter((d) => d.status === "open" || d.status === "pending");
  const openSafety = safety.filter((s) => s.status !== "closed");
  const pendingSel = selections.filter((s) => s.status === "pending_owner");
  const openPayApps = payApplications.filter((a) => a.status === "submitted" || a.status === "draft");
  const biddingSubs = subcontracts.filter((s) => s.status === "bidding");
  const commercialCount = projects.filter((p) => p.type === "commercial" && !["complete", "on_hold"].includes(p.status)).length;
  const dualBlocked = realtyDeals.filter((d) => {
    if (d.status === "n_a" || d.status === "closed" || d.status === "withdrawn") return false;
    if (d.dualCapacity === "pending_disclosure") return true;
    const pkg = closeoutPackages.find((c) => c.projectId === d.projectId);
    if (!pkg) return d.status === "pending_close";
    const punch = pkg.punchOpen > 0;
    const liens = pkg.items.find((i) => i.key === "lien_waivers");
    return d.status === "pending_close" && (punch || liens?.status !== "complete");
  });

  type Attention = {
    severity: "high" | "med";
    title: string;
    detail: string;
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string | undefined>;
  };
  const attention: Attention[] = [];
  readyDraws.forEach((d) => {
    const p = projects.find((x) => x.id === d.projectId);
    attention.push({
      severity: "high",
      title: `Draw ready · ${formatCurrency(d.amount)}`,
      detail: `${p?.name ?? "Job"} — ${d.name}`,
      to: "/app/projects/$projectId",
      params: { projectId: d.projectId },
      search: { tab: "draws" },
    });
  });
  pendingCOs.forEach((c) => {
    const p = projects.find((x) => x.id === c.projectId);
    attention.push({
      severity: "high",
      title: `Owner decision · ${c.number}`,
      detail: `${p?.name ?? "Job"} — ${c.title}`,
      to: "/app/projects/$projectId",
      params: { projectId: c.projectId },
      search: { tab: "changes" },
    });
  });
  openSafety.forEach((s) => {
    attention.push({
      severity: s.severity === "serious" || s.severity === "critical" ? "high" : "med",
      title: `Safety · ${s.title}`,
      detail: formatDate(s.date),
      to: "/app/safety",
    });
  });
  openDocs.slice(0, 3).forEach((d) => {
    attention.push({
      severity: "med",
      title: d.title,
      detail: d.type.replace("_", " "),
      to: d.type === "permit" ? "/app/permits" : d.projectId ? "/app/projects/$projectId" : "/app/documents",
      params: d.type === "permit" ? undefined : d.projectId ? { projectId: d.projectId } : undefined,
      search: d.type === "permit" && d.projectId
        ? { project: d.projectId }
        : d.projectId
          ? { tab: "docs" }
          : undefined,
    });
  });
  pendingSel.forEach((s) => {
    const p = projects.find((x) => x.id === s.projectId);
    attention.push({
      severity: "med",
      title: `Selection waiting · ${s.category}`,
      detail: `${p?.name ?? "Job"} — ${s.room}`,
      to: "/app/projects/$projectId",
      params: { projectId: s.projectId },
      search: { tab: "selections" },
    });
  });
  openPayApps.forEach((a) => {
    const p = projects.find((x) => x.id === a.projectId);
    attention.push({
      severity: a.status === "submitted" ? "high" : "med",
      title: `Pay app #${a.number} · ${a.status}`,
      detail: p?.name ?? "Commercial job",
      to: "/app/projects/$projectId",
      params: { projectId: a.projectId },
      search: { tab: "payapps" },
    });
  });
  biddingSubs.slice(0, 2).forEach((s) => {
    attention.push({
      severity: "med",
      title: `Sub buyout open · ${s.trade}`,
      detail: s.company,
      to: "/app/projects/$projectId",
      params: { projectId: s.projectId },
      search: { tab: "subs" },
    });
  });
  dualBlocked.forEach((d) => {
    const p = projects.find((x) => x.id === d.projectId);
    attention.push({
      severity: "high",
      title: d.dualCapacity === "pending_disclosure" ? "Dual-capacity disclosure pending" : "Closing gates blocked",
      detail: p?.name ?? "Deal",
      to: "/app/projects/$projectId",
      params: { projectId: d.projectId },
      search: { tab: d.dualCapacity === "pending_disclosure" ? "realty" : "closeout" },
    });
  });

  return {
    active,
    budget,
    spent,
    readyDraws,
    openSafety,
    commercialCount,
    attention,
  };
  }, [
    projects, draws, changeOrders, documents, safety, selections,
    payApplications, subcontracts, closeoutPackages, realtyDeals,
  ]);

  // Today's field notes — matches the Field coverage strip below
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayLogs = useMemo(
    () => dailyLogs.filter((l) => l.date === todayIso).slice(0, 4),
    [dailyLogs, todayIso],
  );

  // Elevate the single highest-priority item as the primary next action
  const primaryAction: NextAction = useMemo(() => {
    if (attention.length === 0) {
      return {
        severity: "clear",
        title: "Nothing blocking",
        detail: "Field is clean. Focus on progress or new opportunities.",
      };
    }
    // Prefer high severity first (already roughly ordered in attention)
    const top = attention[0];
    return {
      severity: top.severity,
      title: top.title,
      detail: top.detail,
      to: top.to,
      params: top.params,
      search: top.search,
      cta: top.severity === "high" ? "Handle now" : "Review",
    };
  }, [attention]);

  return (
    <div>
      <PageHeader
        title="Command center"
        description="What needs you today — money, owner decisions, and field risk."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/field">Field board</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/daily-logs">Post daily log</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/app/pricing">New bid</Link>
            </Button>
          </>
        }
      />

      <NextActionBanner action={primaryAction} className="mb-4" />

      {projects.length === 0 ? (
        <Card className="mb-5 border-dashed">
          <CardContent className="flex flex-col items-start gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <ModeCallout empty />
              <div>
              <p className="text-[13px] font-medium text-fg">
                {isDemoDataEnabled ? "Demo command center" : "Ready for your first job"}
              </p>
              <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-fg-muted">
                {isDemoDataEnabled
                  ? "Sample Hart / Willow Creek jobs below are for training only — not live production data."
                  : LIVE_EMPTY_HINT}
              </p>
              {!isDemoDataEnabled ? (
                <p className="mt-2 text-[11px] text-fg-subtle">
                  Production runs at{" "}
                  <a
                    href={`https://${COMPANY.website}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {COMPANY.website}
                  </a>{" "}
                  with live CRM (no fictional seed jobs).
                </p>
              ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link to="/app/clients">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add client
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/app/pricing">Price a bid</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Operator quick strip */}
      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <OperatorQuick
          title="Owner decisions"
          detail={
            changeOrders.filter((c) => c.status === "pending_owner").length
              ? `${changeOrders.filter((c) => c.status === "pending_owner").length} change order(s) waiting on clients`
              : "No COs waiting on owners"
          }
          to="/app/portal"
          cta="Open client portal"
          hot={changeOrders.some((c) => c.status === "pending_owner")}
        />
        <OperatorQuick
          title="Money in flight"
          detail={
            readyDraws.length
              ? `${readyDraws.length} draw(s) · ${formatCurrency(readyDraws.reduce((s, d) => s + d.amount, 0))}`
              : "No draws ready to submit"
          }
          to="/app/draws"
          cta="Draw board"
          hot={readyDraws.length > 0}
        />
        <OperatorQuick
          title="Field coverage"
          detail={
            dailyLogs.filter((l) => l.date === new Date().toISOString().slice(0, 10)).length
              ? `${dailyLogs.filter((l) => l.date === new Date().toISOString().slice(0, 10)).length} log(s) today`
              : "Post today's logs from field board"
          }
          to="/app/field"
          cta="Field board"
          hot={false}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={String(active.length)} hint={`${commercialCount} commercial`} icon={<BuildingIcon />} />
        <StatCard label="Work in place" value={formatCurrency(spent)} hint={`of ${formatCurrency(budget)} budget`} icon={<DollarSign className="h-4 w-4" strokeWidth={1.75} />} />
        <StatCard label="Draws ready" value={String(readyDraws.length)} hint={formatCurrency(readyDraws.reduce((s, d) => s + d.amount, 0))} icon={<Clock className="h-4 w-4" strokeWidth={1.75} />} />
        <StatCard label="Open safety" value={String(openSafety.length)} hint={openSafety.length === 0 ? "All clear" : "Needs review"} icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.75} />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Needs attention</CardTitle>
            <Badge variant={attention.length ? "warning" : "success"}>
              {attention.length ? `${attention.length} items` : "Clear"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {attention.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-8 text-[13px] text-fg-muted">
                <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} />
                Nothing blocking. Field is clean.
              </div>
            ) : (
              attention.slice(0, 8).map((a, i) => (
                <Link
                  key={i}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={a.to as any}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  params={a.params as any}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  search={a.search as any}
                  className="flex items-start gap-3 border-t border-border px-4 py-3 transition-colors hover:bg-bg-subtle"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.severity === "high" ? "bg-danger" : "bg-warning"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-fg">{a.title}</p>
                    <p className="mt-0.5 text-[12px] text-fg-muted">{a.detail}</p>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-fg-subtle" strokeWidth={1.75} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s field notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLogs.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No logs posted today yet.</p>
              ) : (
                todayLogs.map((l) => {
                  const p = projects.find((x) => x.id === l.projectId);
                  return (
                    <div key={l.id} className="border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium">{p?.name}</p>
                        <span className="text-[11px] tabular-nums text-fg-subtle">{l.crewCount} crew · {l.hours}h</span>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{l.workDone}</p>
                      {l.blockers ? (
                        <p className="mt-2 text-[11px] text-warning">Blocker: {l.blockers}</p>
                      ) : null}
                    </div>
                  );
                })
              )}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/app/daily-logs">All daily logs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Owner decisions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/app/portal">Portal</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {changeOrders.filter((c) => c.status === "pending_owner").length === 0 ? (
                <p className="text-[13px] text-fg-muted">No change orders waiting on owners.</p>
              ) : (
                changeOrders
                  .filter((c) => c.status === "pending_owner")
                  .slice(0, 4)
                  .map((c) => {
                    const p = projects.find((x) => x.id === c.projectId);
                    return (
                      <Link
                        key={c.id}
                        to="/app/portal"
                        search={{ project: c.projectId }}
                        className="flex items-start justify-between gap-2 border border-border p-3 transition-colors hover:bg-bg-subtle"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium">
                            {c.number} · {c.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-fg-muted">
                            {p?.name} · {formatCurrency(c.amount)}
                          </p>
                        </div>
                        <Badge variant="warning">Owner</Badge>
                      </Link>
                    );
                  })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activity.slice(0, 5).map((a) => (
                <div key={a.id} className="flex gap-3 text-[12px]">
                  <span className="shrink-0 tabular-nums text-fg-subtle">
                    {new Date(a.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-fg-muted">{a.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Active jobs</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/projects">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {active.length === 0 ? (
            <div className="col-span-full border border-dashed border-border px-4 py-10 text-center">
              <p className="text-[13px] font-medium text-fg">
                {isDemoDataEnabled ? "No active jobs on this board." : "No active jobs yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-fg-muted">
                {isDemoDataEnabled
                  ? "Try a different filter or add a job from Book of Plans."
                  : LIVE_EMPTY_HINT}
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link to={isDemoDataEnabled ? "/app/projects" : "/app/pricing"}>
                  {isDemoDataEnabled ? "View all jobs" : "Start with a bid"}
                </Link>
              </Button>
            </div>
          ) : (
            active.map((p) => {
            const client = clients.find((c) => c.id === p.clientId);
            return (
              <Link
                key={p.id}
                to="/app/projects/$projectId"
                params={{ projectId: p.id }}
                className="border border-border p-4 transition-colors hover:bg-bg-subtle"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-fg-muted">{client?.name} · {p.phase}</p>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <Progress value={p.progress} className="mt-3" />
                <div className="mt-2 flex justify-between text-[11px] tabular-nums text-fg-subtle">
                  <span>{p.progress}%</span>
                  <span>{formatCurrency(p.spent)} / {formatCurrency(p.budget)}</span>
                </div>
              </Link>
            );
          })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  );
}

function OperatorQuick({
  title,
  detail,
  to,
  cta,
  hot,
}: {
  title: string;
  detail: string;
  to: string;
  cta: string;
  hot: boolean;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      className={`flex flex-col justify-between border p-3 transition-colors hover:bg-bg-subtle ${
        hot ? "border-warning/40 bg-warning/5" : "border-border bg-bg-elevated"
      }`}
    >
      <div>
        <p className="text-[13px] font-medium text-fg">{title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{detail}</p>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-fg">
        {cta}
        <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
      </span>
    </Link>
  );
}
