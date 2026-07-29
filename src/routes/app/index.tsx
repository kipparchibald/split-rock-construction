import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const { projects, draws, changeOrders, documents, safety, selections, dailyLogs, activity, clients } =
    useAppStore();

  const active = projects.filter((p) => !["complete", "on_hold"].includes(p.status));
  const budget = active.reduce((s, p) => s + p.budget, 0);
  const spent = active.reduce((s, p) => s + p.spent, 0);
  const readyDraws = draws.filter((d) => d.status === "ready" || d.status === "submitted");
  const pendingCOs = changeOrders.filter((c) => c.status === "pending_owner");
  const openDocs = documents.filter((d) => d.status === "open" || d.status === "pending");
  const openSafety = safety.filter((s) => s.status !== "closed");
  const pendingSel = selections.filter((s) => s.status === "pending_owner");

  type Attention = { severity: "high" | "med"; title: string; detail: string; to: string };
  const attention: Attention[] = [];
  readyDraws.forEach((d) => {
    const p = projects.find((x) => x.id === d.projectId);
    attention.push({
      severity: "high",
      title: `Draw ready · ${formatCurrency(d.amount)}`,
      detail: `${p?.name ?? "Job"} — ${d.name}`,
      to: "/app/draws",
    });
  });
  pendingCOs.forEach((c) => {
    const p = projects.find((x) => x.id === c.projectId);
    attention.push({
      severity: "high",
      title: `Owner decision · ${c.number}`,
      detail: `${p?.name ?? "Job"} — ${c.title}`,
      to: `/app/projects/${c.projectId}`,
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
      to: "/app/documents",
    });
  });
  pendingSel.forEach((s) => {
    const p = projects.find((x) => x.id === s.projectId);
    attention.push({
      severity: "med",
      title: `Selection waiting · ${s.category}`,
      detail: `${p?.name ?? "Job"} — ${s.room}`,
      to: `/app/projects/${s.projectId}`,
    });
  });

  const todayLogs = dailyLogs.filter((l) => l.date === "2026-07-28");

  return (
    <div>
      <PageHeader
        title="Command center"
        description="What needs you today — money, decisions, and field risk."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/daily-logs">Post daily log</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/app/pricing">New bid</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active jobs" value={String(active.length)} hint={`${projects.length} total`} icon={<BuildingIcon />} />
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
                  to={a.to}
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
              <CardTitle>Today in the field</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLogs.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No logs posted for today.</p>
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
          {active.map((p) => {
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
          })}
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
