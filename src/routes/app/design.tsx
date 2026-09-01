import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Check,
  ExternalLink,
  FileText,
  FileUp,
  Lock,
  ShoppingBag,
  Unlock,
  Upload,
} from "lucide-react";
import { DesignSwatch } from "@/components/design/design-swatch";
import { PlanSheetViewer } from "@/components/design/plan-sheet-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DesignCategory, DesignOption, DesignTier } from "@/data/types";
import { plans } from "@/data/plans";
import {
  DEFAULT_CONTRACT_MODEL,
  feePolicyFor,
} from "@/lib/contract-fee-policy";
import {
  BASE_ALLOWANCES,
  DEFAULT_SELECTIONS,
  DESIGN_CATEGORY_LABELS,
  DESIGN_OPTIONS,
  TIER_LABELS,
  allowanceTotal,
  formatDelta,
  optionById,
  optionsForCategory,
  partnerCategoryForDesign,
  ROOM_CATEGORIES,
  ROOM_LABELS,
  type DesignRoom,
} from "@/lib/design-catalog";
import {
  affiliateDisclosureFor,
  partnersForCategory,
  shopUrl,
} from "@/lib/finish-partners";
import { loadJson, PERSIST_KEYS, saveJson } from "@/lib/local-persist";
import { planKindFromFile, savePlanFile } from "@/lib/plan-file-store";
import type { ContractModel } from "@/lib/pricing";
import { buildSwatchStyle } from "@/lib/design-materials";
import { cn, formatCurrency } from "@/lib/utils";

const WebGLWalkthrough = lazy(() =>
  import("@/components/design/webgl-walkthrough").then((m) => ({
    default: m.WebGLWalkthrough,
  })),
);

export const Route = createFileRoute("/app/design")({ component: DesignCenterPage });

type SelectionMap = Partial<Record<DesignCategory, string>>;
/** sheet = PDF/image only; webgl/css = finish studio; split = plan + WebGL (PDF-only path) */
type RenderEngine = "webgl" | "css" | "sheet" | "split";

interface UploadedPlan {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  bookPlanId?: string;
  kind?: "pdf" | "image" | "other";
}

interface DesignSession {
  projectLabel: string;
  room: DesignRoom;
  selections: SelectionMap;
  locked: Partial<Record<DesignCategory, boolean>>;
  plan?: UploadedPlan;
  viewMode: "perspective" | "front" | "elevation";
  renderEngine: RenderEngine;
  updatedAt: string;
}

function loadSession(): DesignSession {
  return loadJson<DesignSession>(PERSIST_KEYS.designSessions, {
    projectLabel: "Current home",
    room: "kitchen",
    selections: { ...DEFAULT_SELECTIONS },
    locked: {},
    viewMode: "perspective",
    renderEngine: "webgl",
    updatedAt: new Date().toISOString(),
  });
}

function DesignCenterPage() {
  const [session, setSession] = useState<DesignSession>(() => {
    const s = loadSession();
    return { ...s, renderEngine: s.renderEngine ?? "webgl" };
  });
  const [activeCat, setActiveCat] = useState<DesignCategory>("paint");
  const [tierFilter, setTierFilter] = useState<DesignTier | "all">("all");
  const [planReloadKey, setPlanReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const contractModel = loadJson<ContractModel>(PERSIST_KEYS.contractModel, DEFAULT_CONTRACT_MODEL);
  const feePolicy = feePolicyFor(contractModel);
  const disclosure = affiliateDisclosureFor(contractModel);

  const roomCats = ROOM_CATEGORIES[session.room];
  const cat = roomCats.includes(activeCat) ? activeCat : roomCats[0] ?? "paint";

  const persist = (next: DesignSession) => {
    setSession(next);
    saveJson(PERSIST_KEYS.designSessions, next);
  };

  const setRoom = (room: DesignRoom) => {
    const nextCats = ROOM_CATEGORIES[room];
    const next = { ...session, room, updatedAt: new Date().toISOString() };
    persist(next);
    if (!nextCats.includes(cat)) setActiveCat(nextCats[0]!);
  };

  const pick = (category: DesignCategory, optionId: string) => {
    if (session.locked[category]) return;
    persist({
      ...session,
      selections: { ...session.selections, [category]: optionId },
      updatedAt: new Date().toISOString(),
    });
  };

  const toggleLock = (category: DesignCategory) => {
    persist({
      ...session,
      locked: { ...session.locked, [category]: !session.locked[category] },
      updatedAt: new Date().toISOString(),
    });
  };

  const resolved = useMemo(() => {
    const map: Partial<Record<DesignCategory, DesignOption | undefined>> = {};
    for (const c of Object.keys(DESIGN_CATEGORY_LABELS) as DesignCategory[]) {
      const id = session.selections[c];
      if (id) map[c] = optionById(id);
    }
    return map;
  }, [session.selections]);

  const upgradeTotal = useMemo(() => {
    let sum = 0;
    for (const o of Object.values(resolved)) {
      if (o) sum += o.priceDelta;
    }
    return sum;
  }, [resolved]);

  const options = useMemo(() => {
    let list = optionsForCategory(cat);
    if (tierFilter !== "all") list = list.filter((x) => x.tier === tierFilter);
    return list;
  }, [cat, tierFilter]);

  const partners = partnersForCategory(partnerCategoryForDesign(cat));

  const onPlanFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const kind = planKindFromFile(file);
      await savePlanFile(file);
      persist({
        ...session,
        plan: {
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          uploadedAt: new Date().toISOString(),
          bookPlanId: session.plan?.bookPlanId,
          kind,
        },
        renderEngine: kind === "pdf" || kind === "image" ? "split" : session.renderEngine,
        projectLabel: session.projectLabel === "Current home" ? file.name.replace(/\\.pdf$/i, "") : session.projectLabel,
        updatedAt: new Date().toISOString(),
      });
      setPlanReloadKey((k) => k + 1);
    } finally {
      setUploading(false);
    }
  };

  const linkBookPlan = (planId: string) => {
    persist({
      ...session,
      plan: {
        name: session.plan?.name ?? plans.find((p) => p.id === planId)?.name ?? "Book plan",
        size: session.plan?.size ?? 0,
        type: session.plan?.type ?? "book-of-plans",
        uploadedAt: session.plan?.uploadedAt ?? new Date().toISOString(),
        bookPlanId: planId,
        kind: session.plan?.kind,
      },
      projectLabel: plans.find((p) => p.id === planId)?.name ?? session.projectLabel,
      updatedAt: new Date().toISOString(),
    });
  };

  const engine = session.renderEngine ?? "webgl";
  const hasPlanSheet = Boolean(session.plan?.name);

  return (
    <div className="min-w-0 max-w-full overflow-x-clip">
      <PageHeader
        title="Design center"
        description="Works with PDF plans alone: upload the sheet, pick finishes room-by-room, preview in WebGL. No IFC or GLB required."
      />

      <div className="mb-3 flex min-w-0 max-w-full flex-wrap items-center gap-2 overflow-x-clip border border-border bg-bg-elevated px-3 py-2 text-[10px] text-fg-muted sm:text-[11px]">
        <Badge variant="secondary">{feePolicy.title}</Badge>
        <span>{feePolicy.referralHandlingLabel}</span>
        <span className="text-fg-subtle">·</span>
        <span>
          Base allowances {formatCurrency(allowanceTotal())} · Upgrades{" "}
          {upgradeTotal === 0 ? "none" : formatCurrency(upgradeTotal)}
        </span>
        {hasPlanSheet ? (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" strokeWidth={1.75} />
            PDF path
          </Badge>
        ) : null}
        <span className="ml-auto shrink-0 text-fg-subtle">{DESIGN_OPTIONS.length} catalog options</span>
      </div>

      <Tabs defaultValue="select">
        <TabsList className="flex h-auto min-h-11 w-full min-w-0 max-w-full justify-start overflow-x-auto overscroll-x-contain">
          <TabsTrigger value="select" className="min-h-11 shrink-0">Select finishes</TabsTrigger>
          <TabsTrigger value="allowances" className="min-h-11 shrink-0">Allowances</TabsTrigger>
          <TabsTrigger value="plans" className="min-h-11 shrink-0">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle">Room</label>
            <div
              data-testid="design-room-scroller"
              className="flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-1 sm:flex-wrap"
            >
              {(Object.keys(ROOM_LABELS) as DesignRoom[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoom(r)}
                  className={cn(
                    "min-h-11 shrink-0 border px-3 py-2 text-[12px] font-medium transition-colors sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px]",
                    session.room === r
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-fg-muted hover:bg-bg-subtle",
                  )}
                >
                  {ROOM_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto overscroll-x-contain sm:ml-auto sm:w-auto sm:flex-wrap">
              {(["split", "sheet", "webgl", "css"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    persist({
                      ...session,
                      renderEngine: v,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className={cn(
                    "min-h-11 shrink-0 border px-3 py-2 text-[10px] uppercase tracking-[0.06em] sm:min-h-0 sm:px-2 sm:py-1",
                    engine === v
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-fg-subtle",
                  )}
                >
                  {v === "split"
                    ? "Plan + 3D"
                    : v === "sheet"
                      ? "Plan sheet"
                      : v === "webgl"
                        ? "WebGL"
                        : "CSS"}
                </button>
              ))}
            </div>
          </div>

          {engine === "split" ? (
            <p className="text-[11px] text-fg-muted">
              PDF-only workflow: left is your uploaded plan set; right is a representative finish studio
              for the selected room. Lock choices as the owner confirms against the sheet.
            </p>
          ) : null}

          <div
            className={cn(
              "grid min-w-0 max-w-full gap-4",
              engine === "split"
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]"
                : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]",
            )}
          >
            {engine === "split" || engine === "sheet" ? (
              <div className="overflow-hidden border border-border bg-bg-elevated">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-medium">
                      <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Plan sheet
                    </p>
                    <p className="text-[11px] text-fg-subtle">
                      {session.plan?.name ?? "Upload a PDF on the Plans tab"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                    {hasPlanSheet ? "Replace" : "Upload PDF"}
                  </Button>
                </div>
                <PlanSheetViewer reloadKey={planReloadKey} />
              </div>
            ) : null}

            {engine !== "sheet" ? (
              <div className="sticky top-0 z-10 min-w-0 max-w-full overflow-x-clip border border-border bg-bg-elevated sm:static sm:z-auto">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4 sm:py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] font-medium">
                      <Box className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                      {ROOM_LABELS[session.room]} ·{" "}
                      {engine === "css" ? "CSS preview" : "Finish studio (WebGL)"}
                    </p>
                    <p className="text-[11px] text-fg-subtle">
                      {hasPlanSheet
                        ? "Representative room for finish picks — not a model of the PDF"
                        : engine === "css"
                          ? `Live finish swap · ${session.viewMode}`
                          : "Orbit · zoom · live materials"}
                    </p>
                  </div>
                  <Badge variant={upgradeTotal > 0 ? "secondary" : "outline"}>
                    {upgradeTotal === 0
                      ? "At midrange base"
                      : `+${formatCurrency(upgradeTotal)} upgrades`}
                  </Badge>
                </div>
                {engine === "css" ? (
                  <VirtualRoom
                    room={session.room}
                    selections={resolved}
                    viewMode={session.viewMode}
                  />
                ) : (
                  <Suspense
                    fallback={
                      <div className="flex aspect-[4/3] min-h-[13.5rem] items-center justify-center bg-[#1a1c1e] text-[12px] text-white/60 sm:aspect-[16/10] sm:min-h-0">
                        Loading WebGL…
                      </div>
                    }
                  >
                    <WebGLWalkthrough room={session.room} selections={resolved} />
                  </Suspense>
                )}
                <div className="border-t border-border px-4 py-3">
                  <p className="label-caps mb-2">Locked package</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {roomCats.map((c) => {
                      const opt = resolved[c];
                      return (
                        <li key={c} className="flex min-w-0 items-center gap-2 text-[12px]">
                          {opt ? (
                            <DesignSwatch option={opt} size="sm" />
                          ) : (
                            <span className="h-3 w-3 shrink-0 border border-border bg-[#ddd]" />
                          )}
                          <span className="text-fg-muted">{DESIGN_CATEGORY_LABELS[c]}:</span>
                          <span className="min-w-0 truncate font-medium">{opt?.name ?? "—"}</span>
                          {opt ? (
                            <Badge variant="outline" className="ml-auto shrink-0 text-[9px]">
                              {opt.tier}
                            </Badge>
                          ) : null}
                          {session.locked[c] ? (
                            <Lock className="h-3 w-3 shrink-0 text-fg-subtle" strokeWidth={1.75} />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="min-w-0 max-w-full overflow-x-clip border border-border bg-bg-elevated">
              <div className="min-w-0 border-b border-border px-3 py-2">
                <div className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto overscroll-x-contain sm:flex-wrap">
                  {roomCats.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCat(c)}
                      className={cn(
                        "min-h-11 shrink-0 px-3 py-2 text-[12px] font-medium transition-colors sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]",
                        cat === c
                          ? "bg-primary text-primary-fg"
                          : "text-fg-muted hover:bg-bg-subtle",
                      )}
                    >
                      {DESIGN_CATEGORY_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex min-w-0 max-w-full flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <p className="text-[13px] font-medium">{DESIGN_CATEGORY_LABELS[cat]}</p>
                <div className="flex flex-wrap gap-1">
                  {(["all", "base", "upgrade", "trendy", "premium"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTierFilter(t)}
                      className={cn(
                        "min-h-11 border px-2.5 py-2 text-[11px] sm:min-h-0 sm:px-1.5 sm:py-0.5 sm:text-[10px]",
                        tierFilter === t
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border text-fg-subtle",
                      )}
                    >
                      {t === "all" ? "All" : TIER_LABELS[t]}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleLock(cat)}>
                  {session.locked[cat] ? (
                    <>
                      <Unlock className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                      Lock
                    </>
                  )}
                </Button>
              </div>

              <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto border-t border-border">
                {options.map((opt) => {
                  const selected = session.selections[cat] === opt.id;
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        disabled={!!session.locked[cat]}
                        onClick={() => pick(cat, opt.id)}
                        className={cn(
                          "flex min-h-11 w-full items-start gap-3 px-3 py-3 text-left transition-colors sm:px-4",
                          selected ? "bg-bg-subtle" : "hover:bg-bg-subtle/60",
                          session.locked[cat] && "opacity-60",
                        )}
                      >
                        <DesignSwatch option={opt} size="lg" className="sm:hidden" />
                        <DesignSwatch option={opt} className="hidden sm:inline-block" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-medium">{opt.name}</span>
                            <Badge variant="outline" className="text-[9px]">
                              {TIER_LABELS[opt.tier]}
                            </Badge>
                            {selected ? (
                              <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-fg-muted">
                            {[opt.brand, opt.finish, opt.woodSpecies].filter(Boolean).join(" · ")}
                          </span>
                          <span className="mt-1 hidden text-[11px] text-fg-subtle sm:block">{opt.imageHint}</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[12px] font-medium",
                            opt.priceDelta > 0
                              ? "text-fg"
                              : opt.priceDelta < 0
                                ? "text-fg-muted"
                                : "text-fg-subtle",
                          )}
                        >
                          {formatDelta(opt.priceDelta)}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {options.length === 0 ? (
                  <li className="px-4 py-6 text-center text-[12px] text-fg-subtle">
                    No options in this tier filter.
                  </li>
                ) : null}
              </ul>

              <div className="border-t border-border px-4 py-3">
                <p className="label-caps mb-2">Order this category</p>
                <p className="mb-2 text-[11px] leading-relaxed text-fg-subtle">{disclosure}</p>
                <div className="flex flex-wrap gap-2">
                  {partners.slice(0, 3).map((p) => (
                    <Button key={p.id} size="sm" variant="outline" asChild>
                      <a
                        href={shopUrl(p, partnerCategoryForDesign(cat))}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                      >
                        <ShoppingBag className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                        {p.name.split(" / ")[0]}
                        <ExternalLink className="ml-1.5 h-3 w-3 opacity-70" strokeWidth={1.75} />
                      </a>
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/app/finish-partners">All partners</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="allowances" className="space-y-4">
          <div className="border border-border bg-bg-elevated p-4">
            <p className="text-[13px] font-medium">Midrange base allowance package</p>
            <p className="mt-1 text-[12px] text-fg-muted">
              These amounts are included in a typical Teton Heights / Jefferson ranch fixed-price or
              allowance schedule. Selecting a Base tier option does not change the contract price.
            </p>
            <p className="mt-2 text-[13px] font-medium tabular-nums">
              Package total {formatCurrency(allowanceTotal())}
            </p>
          </div>
          <ul className="divide-y divide-border border border-border">
            {BASE_ALLOWANCES.map((a) => (
              <li key={a.bucket} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium">{a.bucket}</p>
                  <p className="text-[11px] text-fg-muted">{a.notes}</p>
                </div>
                <p className="text-[13px] tabular-nums font-medium">
                  {a.amount > 0 ? formatCurrency(a.amount) : "In shell / elevation"}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="border border-border bg-bg-elevated p-4 text-[12px] leading-relaxed text-fg-muted">
            <p className="font-medium text-fg">PDF-only path (default for most jobs)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Upload the architect/designer PDF (or a floor-plan image).</li>
              <li>Open <span className="text-fg">Select finishes</span> → view mode <span className="text-fg">Plan + 3D</span>.</li>
              <li>Walk rooms on the sheet; pick finishes in the catalog; lock when confirmed.</li>
              <li>
                WebGL is a <span className="text-fg">representative finish studio</span> keyed to the room — not a
                mesh of the PDF. That is intentional until a GLB/IFC exists.
              </li>
            </ol>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">Upload plan set (PDF or image)</p>
              <p className="mt-1 text-[12px] text-fg-muted">
                Stored in this browser (IndexedDB). Survives refresh on this device. Suitable for
                selection meetings without cloud BIM.
              </p>
              <Button
                type="button"
                className="mt-3 min-h-11"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                {uploading ? "Saving…" : "Choose PDF or image"}
              </Button>
              {session.plan ? (
                <div className="mt-3 border border-border bg-bg px-3 py-2 text-[12px]">
                  <p className="flex items-center gap-2 font-medium text-fg">
                    <FileUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {session.plan.name}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {(session.plan.size / 1024).toFixed(0)} KB · {session.plan.kind ?? "file"} ·{" "}
                    {new Date(session.plan.uploadedAt).toLocaleString()}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 min-h-11"
                    onClick={() =>
                      persist({
                        ...session,
                        renderEngine: "split",
                        updatedAt: new Date().toISOString(),
                      })
                    }
                  >
                    Open Plan + 3D
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-fg-subtle">No plan uploaded yet.</p>
              )}

              <div className="mt-4 border-t border-border pt-3">
                <PlanSheetViewer reloadKey={planReloadKey} className="min-h-[14rem]" />
              </div>
            </div>

            <div className="border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">Optional: link Book of Plans</p>
              <p className="mt-1 text-[12px] text-fg-muted">
                If the PDF matches a Split Rock package, link it for naming and allowance context.
              </p>
              <ul className="mt-3 space-y-2">
                {plans.filter((p) => p.active).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => linkBookPlan(p.id)}
                      className={cn(
                        "min-h-11 w-full border px-3 py-2.5 text-left text-[12px] transition-colors",
                        session.plan?.bookPlanId === p.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-bg-subtle",
                      )}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="mt-0.5 block text-[11px] text-fg-muted">
                        {p.code} · {p.mainFloorSqft} sf · base {formatCurrency(p.basePrice)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link to="/app/plans">Open Book of Plans</Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,application/pdf,image/*,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => void onPlanFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function VirtualRoom({
  room,
  selections,
  viewMode,
}: {
  room: DesignRoom;
  selections: Partial<Record<DesignCategory, DesignOption | undefined>>;
  viewMode: "perspective" | "front" | "elevation";
}) {
  const wallStyle = useMemo(
    () => (selections.paint ? buildSwatchStyle(selections.paint) : { backgroundColor: "#F0EDE4" }),
    [selections.paint],
  );
  const floorStyle = useMemo(
    () =>
      selections.flooring ? buildSwatchStyle(selections.flooring) : { backgroundColor: "#C4A574" },
    [selections.flooring],
  );
  const cabStyle = useMemo(
    () =>
      selections.cabinets ? buildSwatchStyle(selections.cabinets) : { backgroundColor: "#F7F7F5" },
    [selections.cabinets],
  );
  const ctStyle = useMemo(
    () =>
      selections.countertops
        ? buildSwatchStyle(selections.countertops)
        : { backgroundColor: "#F2EFEA" },
    [selections.countertops],
  );
  const fxColor = selections.fixtures?.colorHex ?? "#C0C0C0";
  const lightColor = selections.lighting?.colorHex ?? "#F5F5F5";
  const extStyle = useMemo(
    () =>
      selections.exterior ? buildSwatchStyle(selections.exterior) : { backgroundColor: "#F4F1EA" },
    [selections.exterior],
  );
  const roofStyle = useMemo(
    () =>
      selections.roofing ? buildSwatchStyle(selections.roofing) : { backgroundColor: "#4A4A4A" },
    [selections.roofing],
  );
  const tileStyle = useMemo(
    () => (selections.tile ? buildSwatchStyle(selections.tile) : { backgroundColor: "#E8E6E1" }),
    [selections.tile],
  );
  const splashStyle = useMemo(
    () =>
      selections.backsplash
        ? buildSwatchStyle(selections.backsplash)
        : { backgroundColor: "#F5F5F5" },
    [selections.backsplash],
  );

  const isBath = room === "primary_bath" || room === "hall_bath";
  const isKitchen = room === "kitchen";
  const isExterior = room === "exterior" || room === "garage_front";

  const perspective =
    viewMode === "perspective"
      ? "perspective(900px) rotateY(-18deg) rotateX(6deg)"
      : viewMode === "elevation"
        ? "none"
        : "perspective(1200px) rotateY(-6deg)";

  if (isExterior || viewMode === "elevation") {
    return (
      <div className="relative aspect-[4/3] min-h-[13.5rem] overflow-hidden bg-gradient-to-b from-[#8eabbf] to-[#c5d5e0] sm:aspect-[16/10] sm:min-h-0">
        <div
          className="absolute inset-x-[10%] bottom-[16%] top-[18%] shadow-2xl"
          style={{
            ...extStyle,
            boxShadow: "inset 0 -12px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="absolute -top-6 left-[-4%] right-[-4%] h-10"
            style={{
              ...roofStyle,
              clipPath: "polygon(5% 100%, 50% 0%, 95% 100%)",
            }}
          />
          <div
            className="absolute left-[18%] top-[28%] h-[22%] w-[18%] border border-white/30 bg-[#9ec5e0]/40"
            style={{ boxShadow: "inset 0 0 12px rgba(255,255,255,0.25)" }}
          />
          <div
            className="absolute right-[18%] top-[28%] h-[22%] w-[18%] border border-white/30 bg-[#9ec5e0]/40"
            style={{ boxShadow: "inset 0 0 12px rgba(255,255,255,0.25)" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-t from-[#4a5a32] to-[#5a6b3a]" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] min-h-[13.5rem] overflow-hidden bg-gradient-to-b from-[#e8e4de] to-[#d4cfc8] sm:aspect-[16/10] sm:min-h-0">
      <div
        className="absolute inset-[6%] origin-center"
        style={{ transform: perspective, transformStyle: "preserve-3d" }}
      >
        <div
          className="relative h-full w-full overflow-hidden shadow-xl"
          style={{
            ...wallStyle,
            backgroundImage: [
              wallStyle.backgroundImage,
              "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 35%)",
            ]
              .filter(Boolean)
              .join(", "),
          }}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-[30%]"
            style={{
              ...floorStyle,
              boxShadow: "inset 0 8px 16px rgba(0,0,0,0.06)",
            }}
          />
          {isKitchen ? (
            <div className="absolute bottom-[30%] left-[6%] right-[26%]">
              <div className="h-2.5 shadow-sm" style={ctStyle} />
              <div
                className="relative h-[4.75rem] shadow-md"
                style={{
                  ...cabStyle,
                  backgroundImage: [
                    cabStyle.backgroundImage,
                    "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.06) 100%)",
                  ]
                    .filter(Boolean)
                    .join(", "),
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div
                  className="absolute inset-[12%] border border-black/8"
                  style={{ background: "rgba(0,0,0,0.02)" }}
                />
              </div>
              <div
                className="absolute left-[28%] top-[-4.5rem] h-6 w-1.5 rounded-sm"
                style={{
                  background: `linear-gradient(90deg, ${fxColor}, ${fxColor}dd)`,
                  boxShadow: "1px 1px 2px rgba(0,0,0,0.15)",
                }}
              />
              <div
                className="absolute left-[8%] top-[-4rem] h-12 w-40 border border-black/5"
                style={splashStyle}
              />
            </div>
          ) : null}
          {isBath ? (
            <div
              className="absolute bottom-[32%] right-[12%] h-28 w-[22%] border border-black/5 shadow-inner"
              style={tileStyle}
            />
          ) : null}
          <div
            className="absolute left-1/2 top-[8%] h-3 w-3 -translate-x-1/2 rounded-full"
            style={{
              background: lightColor,
              boxShadow: `0 0 18px 6px ${lightColor}88`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
