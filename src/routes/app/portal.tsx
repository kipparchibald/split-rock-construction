import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  HardHat,
  Home,
  LogOut,
  MessageSquare,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NextActionBanner, type NextAction } from "@/components/layout/next-action-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import type { ChangeOrder } from "@/data/types";
import { projectsForClient } from "@/lib/client-portal";
import { COMPANY } from "@/lib/company";
import { drawBadgeVariant, drawStatusLabel, summarizeDraws } from "@/lib/draws";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import { usePortalSession } from "@/lib/use-portal-session";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/portal")({
  validateSearch: (search: Record<string, unknown>): { project?: string } => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  component: PortalPage,
});

function coBadgeVariant(
  status: ChangeOrder["status"],
): "warning" | "success" | "danger" | "outline" | "secondary" {
  if (status === "pending_owner") return "warning";
  if (status === "approved" || status === "invoiced") return "success";
  if (status === "rejected") return "danger";
  if (status === "draft") return "secondary";
  return "outline";
}

function PortalPage() {
  const { project: searchProject } = Route.useSearch();
  const navigate = useNavigate({ from: "/app/portal" });
  const {
    projects,
    clients,
    draws,
    changeOrders,
    selections,
    dailyLogs,
    setChangeOrderStatus,
    setSelectionStatus,
  } = useAppStore();
  const { client: portalClient, isClientUser, signOut } = usePortalSession();

  // HARD ISOLATION: client users only see their own projects.
  // Operators (no portal session) may browse all residential for demo/ops preview.
  const visibleProjects = useMemo(() => {
    if (portalClient) return projectsForClient(projects, portalClient.id);
    return projects.filter((p) => p.type === "residential");
  }, [projects, portalClient]);

  // Block cross-client deep links: ignore ?project= if not in visible set
  const scopedSearch =
    searchProject && visibleProjects.some((p) => p.id === searchProject)
      ? searchProject
      : undefined;

  const defaultId =
    scopedSearch ??
    visibleProjects.find((p) => p.status !== "planning")?.id ??
    visibleProjects[0]?.id ??
    "";

  const activeId =
    scopedSearch && visibleProjects.some((p) => p.id === scopedSearch)
      ? scopedSearch
      : defaultId;

  // If client had a foreign project in URL, strip it
  useEffect(() => {
    if (searchProject && !visibleProjects.some((p) => p.id === searchProject)) {
      void navigate({
        search: { project: defaultId || undefined },
        replace: true,
      });
    }
  }, [searchProject, visibleProjects, defaultId, navigate]);

  const setActiveProject = (id: string) => {
    // Never allow selecting outside visible set
    if (!visibleProjects.some((p) => p.id === id)) {
      toast.error("That project is not part of your account.");
      return;
    }
    void navigate({ search: { project: id } });
  };

  const project = visibleProjects.find((p) => p.id === activeId);
  const client =
    portalClient ?? clients.find((c) => c.id === project?.clientId);

  const pDraws = useMemo(
    () => (project ? draws.filter((d) => d.projectId === project.id) : []),
    [draws, project],
  );
  const cash = useMemo(() => summarizeDraws(pDraws), [pDraws]);

  const projectCOs = useMemo(
    () =>
      project
        ? changeOrders
            .filter((c) => c.projectId === project.id && c.status !== "draft")
            .sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number))
        : [],
    [changeOrders, project],
  );
  const pendingCOs = useMemo(
    () => projectCOs.filter((c) => c.status === "pending_owner"),
    [projectCOs],
  );
  const decidedCOs = useMemo(
    () => projectCOs.filter((c) => c.status !== "pending_owner"),
    [projectCOs],
  );
  const approvedCoTotal = useMemo(
    () =>
      projectCOs
        .filter((c) => c.status === "approved" || c.status === "invoiced")
        .reduce((s, c) => s + c.amount, 0),
    [projectCOs],
  );
  const pendingCoTotal = useMemo(
    () => pendingCOs.reduce((s, c) => s + c.amount, 0),
    [pendingCOs],
  );

  const pendingSel = useMemo(
    () =>
      project
        ? selections.filter(
            (s) =>
              s.projectId === project.id &&
              (s.status === "pending_owner" || s.status === "not_started"),
          )
        : [],
    [selections, project],
  );
  const logs = useMemo(
    () => (project ? dailyLogs.filter((l) => l.projectId === project.id).slice(0, 5) : []),
    [dailyLogs, project],
  );

  const decisionCount = pendingCOs.length + pendingSel.length;

  const [choiceDraft, setChoiceDraft] = useState<Record<string, string>>({});
  const [flashId, setFlashId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (pendingCOs[0]) {
      setFlashId(pendingCOs[0].id);
      const t = window.setTimeout(() => setFlashId(null), 4000);
      return () => window.clearTimeout(t);
    }
  }, [pendingCOs[0]?.id]);

  useEffect(() => {
    if (!lastAction) return;
    const t = window.setTimeout(() => setLastAction(null), 5000);
    return () => window.clearTimeout(t);
  }, [lastAction]);

  const nextAction: NextAction = useMemo(() => {
    if (!project) {
      return {
        severity: "clear",
        title: "No project in your account",
        detail: isClientUser
          ? "When Split Rock links a job to your account, it appears here."
          : "Pick a home build or sign in as a client.",
      };
    }
    if (pendingCOs[0]) {
      return {
        severity: "high",
        title: `Decision needed · ${pendingCOs[0].number}`,
        detail: `${pendingCOs[0].title} · ${formatCurrency(pendingCOs[0].amount)}`,
        cta: "Review change order",
        to: "/app/portal",
        search: { project: project.id },
      };
    }
    if (pendingSel[0]) {
      return {
        severity: "med",
        title: `Selection waiting · ${pendingSel[0].category}`,
        detail: `${pendingSel[0].room} — allowance ${formatCurrency(pendingSel[0].allowance)}`,
        cta: "Choose finishes",
        to: "/app/portal",
        search: { project: project.id },
      };
    }
    return {
      severity: "clear",
      title: "You're caught up",
      detail: "No open change orders or selections. Check money and field updates anytime.",
    };
  }, [project, pendingCOs, pendingSel, isClientUser]);

  function approveCo(id: string, number: string, title: string) {
    // Isolation: only mutate COs for visible project
    const co = changeOrders.find((c) => c.id === id);
    if (!co || !project || co.projectId !== project.id) {
      toast.error("That change order is not part of your project.");
      return;
    }
    if (portalClient && project.clientId !== portalClient.id) {
      toast.error("Access denied.");
      return;
    }
    setChangeOrderStatus(id, "approved");
    setLastAction(`Approved ${number} · ${title}`);
    toast.success("Change order approved", {
      description: `${number} is locked in. Your contract total updates automatically.`,
    });
  }

  function declineCo(id: string, number: string) {
    const co = changeOrders.find((c) => c.id === id);
    if (!co || !project || co.projectId !== project.id) {
      toast.error("That change order is not part of your project.");
      return;
    }
    if (portalClient && project.clientId !== portalClient.id) {
      toast.error("Access denied.");
      return;
    }
    setChangeOrderStatus(id, "rejected");
    setLastAction(`Declined ${number}`);
    toast.message("Change order declined", {
      description: "Split Rock will follow up with options if you want to revise scope.",
    });
  }

  function approveSelection(id: string, label: string, choice: string) {
    const sel = selections.find((s) => s.id === id);
    if (!sel || !project || sel.projectId !== project.id) {
      toast.error("That selection is not part of your project.");
      return;
    }
    if (portalClient && project.clientId !== portalClient.id) {
      toast.error("Access denied.");
      return;
    }
    setSelectionStatus(id, "approved", choice);
    setLastAction(`Approved selection · ${label}`);
    toast.success("Selection approved", { description: label });
  }

  // Client not signed in — send to portal login (operators can still preview with banner)
  if (!isClientUser && visibleProjects.length === 0) {
    return (
      <div data-testid="portal-empty">
        <PageHeader title="Your home build" description="Sign in to see your jobs." />
        <Card className="mt-4 max-w-lg border-dashed">
          <CardContent className="space-y-3 py-6">
            <p className="text-[13px] leading-relaxed text-fg-muted">
              Use the email on your contract and the access code Split Rock sent you. Each household
              only sees their own jobs — never another client&apos;s information.
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/portal/login">Client sign-in</Link>
            </Button>
            <p className="text-[11px] text-fg-subtle">
              Need help?{" "}
              <a href={COMPANY.phoneHref} className="underline-offset-2 hover:underline">
                {COMPANY.phone}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div data-testid="portal-empty">
        <PageHeader
          title="Your home build"
          description={
            isClientUser
              ? `Signed in as ${portalClient?.name}. No jobs are linked to your account yet.`
              : "No projects yet."
          }
          actions={
            isClientUser ? (
              <Button size="sm" variant="outline" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            ) : null
          }
        />
        <Card className="mt-4 max-w-lg border-dashed">
          <CardContent className="space-y-3 py-6">
            <p className="text-[13px] leading-relaxed text-fg-muted">
              {isClientUser
                ? isDemoDataEnabled
                  ? "When Split Rock starts your job, decisions, draws, and progress photos show up here — only for your household."
                  : "Your portal is ready. Split Rock will link your build here once the contract is active — you'll get an email with your access code."
                : "When Split Rock starts a client job, decisions and money show up here. Sign in as a client to enforce household isolation."}
            </p>
            {isClientUser ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={signOut}>
                  Sign out
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/portal/login">Client sign-in</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const superName = project.superintendent || "Your superintendent";

  return (
    <div data-testid="portal-root" data-client-id={client?.id ?? ""} data-isolated={isClientUser ? "true" : "false"}>
      <PageHeader
        title="Your home build"
        description={
          isClientUser
            ? `Private to ${portalClient?.name} — other clients cannot see this.`
            : "Operator preview of owner portal. Client sign-in isolates each household."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {isClientUser ? "Client portal · locked to you" : "Ops preview"}
            </Badge>
            {isClientUser ? (
              <Button size="sm" variant="outline" onClick={signOut} data-testid="portal-sign-out">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to="/portal/login">Client sign-in</Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Job switcher — only visible projects for this client */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm space-y-1.5">
          <p className="label-caps">
            {isClientUser ? "Your project" : "Preview project"}
            {client ? ` · ${client.name}` : ""}
          </p>
          <Select value={activeId} onValueChange={setActiveProject}>
            <SelectTrigger aria-label="Select project" className="h-11" data-testid="portal-project-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleProjects.map((p) => {
                const needs = changeOrders.some(
                  (c) => c.projectId === p.id && c.status === "pending_owner",
                );
                return (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {needs ? " · decision needed" : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {isClientUser ? (
            <p className="text-[10px] text-fg-subtle" data-testid="portal-isolation-note">
              Showing {visibleProjects.length} job
              {visibleProjects.length === 1 ? "" : "s"} for your account only.
            </p>
          ) : (
            <p className="text-[10px] text-fg-subtle">
              Operator mode lists residential jobs.{" "}
              <Link to="/portal/login" className="underline-offset-2 hover:underline">
                Sign in as a client
              </Link>{" "}
              to enforce isolation.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Operator tools only when not a client session */}
          {!isClientUser ? (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link to="/app/projects/$projectId" params={{ projectId: project.id }}>
                  Operator job hub
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/app">Command center</Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {/* Snapshot strip */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Snapshot
          label="Decisions"
          value={decisionCount === 0 ? "Clear" : String(decisionCount)}
          hint={decisionCount ? "Waiting on you" : "All caught up"}
          tone={decisionCount ? "warn" : "ok"}
          onClick={() =>
            document.getElementById("decisions")?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <Snapshot
          label="Progress"
          value={`${project.progress}%`}
          hint={project.phase}
          tone="default"
        />
        <Snapshot
          label="Paid to date"
          value={formatCurrency(cash.paid)}
          hint="Draws received"
          tone="default"
        />
        <Snapshot
          label="Contract"
          value={formatCurrency(project.budget)}
          hint={approvedCoTotal ? `+${formatCurrency(approvedCoTotal)} COs` : "Incl. approved COs"}
          tone="default"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() =>
          document.getElementById("decisions")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document
              .getElementById("decisions")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        <NextActionBanner action={nextAction} className="mb-4" />
      </div>

      {lastAction ? (
        <div
          className="mb-4 flex items-start gap-2 border border-success/30 bg-success/5 px-3 py-2.5 text-[13px]"
          data-testid="portal-last-action"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.75} />
          <div>
            <p className="font-medium text-fg">{lastAction}</p>
            <p className="mt-0.5 text-[12px] text-fg-muted">
              Split Rock is notified. You can keep reviewing money and field notes below.
            </p>
          </div>
        </div>
      ) : null}

      {/* Welcome + contact */}
      <div className="mb-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-border bg-bg-elevated p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-bg-subtle">
              <Home className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="label-caps">Welcome</p>
              <h2 className="mt-1 text-lg font-medium tracking-[-0.02em]">{client?.name ?? "Owner"}</h2>
              <p className="mt-0.5 text-[13px] text-fg-muted">
                {project.name} · {project.address}
              </p>
              <Progress value={project.progress} className="mt-4" />
              <p className="mt-2 text-[12px] tabular-nums text-fg-subtle">
                {project.progress}% complete · phase: {project.phase}
              </p>
            </div>
          </div>
          {project.matterportId ? (
            <Button size="sm" variant="outline" className="mt-4" asChild>
              <a
                href={`https://my.matterport.com/show/?m=${project.matterportId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open 3D tour
              </a>
            </Button>
          ) : null}
        </div>

        <div className="border border-border bg-bg-elevated p-5">
          <p className="label-caps mb-2">Your builder team</p>
          <p className="text-[13px] font-medium text-fg">{superName}</p>
          <p className="mt-0.5 text-[12px] text-fg-muted">
            Questions on change orders, draws, or schedule? Reach out anytime.
          </p>
          <div className="mt-3 space-y-2 text-[12px]">
            <a
              href="tel:+12082000605"
              className="flex min-h-11 items-center gap-2 border border-border px-3 text-fg transition-colors hover:bg-bg-subtle"
            >
              <Phone className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
              (208) 200-0605
            </a>
            <a
              href="mailto:Kipp@splitrockconst.com"
              className="flex min-h-11 items-center gap-2 border border-border px-3 text-fg transition-colors hover:bg-bg-subtle"
            >
              <MessageSquare className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
              Kipp@splitrockconst.com
            </a>
          </div>
        </div>
      </div>

      {/* Section jump */}
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Portal sections">
        {[
          { id: "decisions", label: "Decisions", icon: ClipboardList, count: decisionCount },
          { id: "money", label: "Money", icon: Banknote },
          { id: "field", label: "Field updates", icon: HardHat },
        ].map((s) => (
          <button
            key={s.id}
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-bg-elevated px-3 text-[12px] font-medium text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg"
            onClick={() =>
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            <s.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {s.label}
            {s.count ? (
              <Badge variant="warning" className="ml-0.5">
                {s.count}
              </Badge>
            ) : null}
          </button>
        ))}
      </nav>

      {project.matterportId ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3D tour</CardTitle>
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
              Walk the home before you approve finishes or layout changes.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card id="decisions">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Needs your decision</CardTitle>
            {decisionCount > 0 ? (
              <Badge variant="warning">{decisionCount} open</Badge>
            ) : (
              <Badge variant="success">Clear</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {decisionCount === 0 ? (
              <div className="flex items-start gap-2 py-2 text-[13px] text-fg-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={1.75} />
                <p>
                  Nothing waiting. When Split Rock sends a change order or finish choice, it appears
                  here for approve or decline.
                </p>
              </div>
            ) : null}

            {pendingCOs.map((c) => (
              <div
                key={c.id}
                data-testid="portal-pending-co"
                className={cn(
                  "border border-border bg-bg p-4",
                  flashId === c.id && "ring-2 ring-warning/40",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="label-caps">Change order</p>
                    <p className="mt-1 text-[14px] font-medium text-fg">
                      {c.number} · {c.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{c.description}</p>
                    <p className="mt-2 text-[14px] font-medium tabular-nums text-fg">
                      {formatCurrency(c.amount)}
                      {c.daysImpact ? (
                        <span className="ml-2 text-[12px] font-normal text-fg-subtle">
                          +{c.daysImpact} schedule days
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[11px] text-fg-subtle">
                      From {c.requestedBy} · {formatDate(c.date)}
                    </p>
                  </div>
                  <Badge variant="warning">Awaiting you</Badge>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="min-h-11 flex-1 sm:flex-none"
                    onClick={() => approveCo(c.id, c.number, c.title)}
                    data-testid="portal-approve-co"
                  >
                    Approve change order
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1 sm:flex-none"
                    onClick={() => declineCo(c.id, c.number)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}

            {pendingSel.map((s) => {
              const overrun =
                s.actual !== undefined && s.actual > s.allowance ? s.actual - s.allowance : 0;
              return (
                <div key={s.id} className="border border-border bg-bg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="label-caps">Finish selection</p>
                      <p className="mt-1 text-[14px] font-medium">
                        {s.room} · {s.category}
                      </p>
                      <p className="mt-1 text-[12px] text-fg-muted">
                        Allowance {formatCurrency(s.allowance)}
                        {s.choice ? ` · suggested: ${s.choice}` : ""}
                      </p>
                      {overrun > 0 ? (
                        <p className="mt-1 text-[12px] text-warning">
                          Over allowance by {formatCurrency(overrun)} at this price — we'll write a
                          change order if you approve.
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="warning">{s.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Input
                      className="min-h-11"
                      placeholder="Your product / finish choice"
                      value={choiceDraft[s.id] ?? s.choice ?? ""}
                      onChange={(e) =>
                        setChoiceDraft((prev) => ({ ...prev, [s.id]: e.target.value }))
                      }
                      aria-label={`Choice for ${s.category}`}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="min-h-11"
                        onClick={() =>
                          approveSelection(
                            s.id,
                            `${s.room} · ${s.category}`,
                            (choiceDraft[s.id] ?? s.choice ?? s.category).trim() || s.category,
                          )
                        }
                      >
                        Approve selection
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        onClick={() => {
                          setSelectionStatus(s.id, "pending_owner", choiceDraft[s.id]);
                          toast.message("Draft choice saved");
                        }}
                      >
                        Save draft choice
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {decidedCOs.length > 0 ? (
              <div className="border-t border-border pt-3">
                <p className="label-caps mb-2">Recent decisions</p>
                <div className="space-y-2">
                  {decidedCOs.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 border border-border px-3 py-2.5 text-[12px]"
                      data-testid="portal-decided-co"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-fg">
                          {c.number} · {c.title}
                        </p>
                        <p className="text-fg-subtle tabular-nums">{formatCurrency(c.amount)}</p>
                      </div>
                      <Badge variant={coBadgeVariant(c.status)}>
                        {c.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card id="money">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Money</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link
                to="/app/projects/$projectId"
                params={{ projectId: project.id }}
                search={{ tab: "draws" }}
              >
                Full schedule
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-border p-3">
                <p className="label-caps">Contract</p>
                <p className="mt-1 text-[16px] font-medium tabular-nums">
                  {formatCurrency(project.budget)}
                </p>
                {approvedCoTotal > 0 ? (
                  <p className="mt-1 text-[10px] text-fg-subtle">
                    Includes {formatCurrency(approvedCoTotal)} approved upgrades
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-fg-subtle">Base + approved change orders</p>
                )}
              </div>
              <div className="border border-border p-3">
                <p className="label-caps">Paid to date</p>
                <p className="mt-1 text-[16px] font-medium tabular-nums">
                  {formatCurrency(cash.paid)}
                </p>
                <p className="mt-1 text-[10px] text-fg-subtle">{cash.paidPct}% of draw schedule</p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-fg-subtle">
                <span>Draw schedule progress</span>
                <span className="tabular-nums">{cash.paidPct}%</span>
              </div>
              <Progress value={cash.paidPct} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="border border-border p-2.5">
                <p className="text-fg-subtle">In flight</p>
                <p className="mt-0.5 font-medium tabular-nums">
                  {formatCurrency(cash.ready + cash.submitted)}
                </p>
              </div>
              <div className="border border-border p-2.5">
                <p className="text-fg-subtle">Remaining</p>
                <p className="mt-0.5 font-medium tabular-nums">{formatCurrency(cash.remaining)}</p>
              </div>
            </div>
            {pendingCOs.length > 0 ? (
              <p className="border border-warning/30 bg-warning/5 px-3 py-2 text-[12px] text-fg">
                {pendingCOs.length} change order{pendingCOs.length > 1 ? "s" : ""} awaiting you ·{" "}
                <span className="font-medium tabular-nums">{formatCurrency(pendingCoTotal)}</span> not
                yet in contract
              </p>
            ) : null}
            <div className="space-y-1.5">
              <p className="label-caps">Draw schedule</p>
              {pDraws.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No draws on this job yet.</p>
              ) : (
                pDraws.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 border border-border px-3 py-2.5 text-[12px]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-fg">{d.name}</p>
                      <p className="text-fg-subtle">{d.trigger}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="tabular-nums font-medium">{formatCurrency(d.amount)}</span>
                      <Badge variant={drawBadgeVariant(d.status)}>{drawStatusLabel(d.status)}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="field" className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Latest from the field</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link
                to="/app/projects/$projectId"
                params={{ projectId: project.id }}
                search={{ tab: "logs" }}
              >
                All logs
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-[13px] text-fg-muted">
                Updates appear as the crew posts daily logs — progress, weather, and any blockers.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {logs.map((l) => (
                  <div key={l.id} className="border border-border p-3">
                    <p className="text-[12px] text-fg-subtle">
                      {formatDate(l.date)} · {l.author}
                      {l.crewCount ? ` · ${l.crewCount} crew` : ""}
                      {l.weather ? ` · ${l.weather}` : ""}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">{l.workDone}</p>
                    {l.blockers ? (
                      <p className="mt-2 text-[11px] text-warning">Note: {l.blockers}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-[11px] text-fg-subtle">
        Split Rock Construction · Rigby & Jefferson County · Built well. Documented clearly.
      </p>
    </div>
  );
}

function Snapshot({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "default" | "warn" | "ok";
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "border border-border bg-bg-elevated p-3 text-left",
        onClick && "transition-colors hover:bg-bg-subtle",
        tone === "warn" && "border-warning/40 bg-warning/5",
        tone === "ok" && "border-success/25",
      )}
    >
      <p className="label-caps">{label}</p>
      <p className="mt-1 truncate text-[15px] font-medium tabular-nums text-fg">{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-fg-subtle">{hint}</p>
    </Comp>
  );
}
