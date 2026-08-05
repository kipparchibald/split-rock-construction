import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Check,
  ExternalLink,
  FileUp,
  Lock,
  ShoppingBag,
  Unlock,
  Upload,
} from "lucide-react";
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
import type { ContractModel } from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";

const WebGLWalkthrough = lazy(() =>
  import("@/components/design/webgl-walkthrough").then((m) => ({
    default: m.WebGLWalkthrough,
  })),
);

export const Route = createFileRoute("/app/design")({ component: DesignCenterPage });

type SelectionMap = Partial<Record<DesignCategory, string>>;
type RenderEngine = "webgl" | "css";

interface UploadedPlan {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  bookPlanId?: string;
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

  const onPlanFile = (file: File | null) => {
    if (!file) return;
    persist({
      ...session,
      plan: {
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        bookPlanId: session.plan?.bookPlanId,
      },
      updatedAt: new Date().toISOString(),
    });
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
      },
      projectLabel: plans.find((p) => p.id === planId)?.name ?? session.projectLabel,
      updatedAt: new Date().toISOString(),
    });
  };

  const engine = session.renderEngine ?? "webgl";

  return (
    <div>
      <PageHeader
        title="Design center"
        description="Full interior + exterior selections with WebGL walkthrough. Midrange base finishes sit inside allowance; trendy and premium options show clear upgrade pricing."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 border border-border bg-bg-elevated px-3 py-2 text-[11px] text-fg-muted">
        <Badge variant="secondary">{feePolicy.title}</Badge>
        <span>{feePolicy.referralHandlingLabel}</span>
        <span className="text-fg-subtle">·</span>
        <span>
          Base allowances {formatCurrency(allowanceTotal())} · Upgrades{" "}
          {upgradeTotal === 0 ? "none" : formatCurrency(upgradeTotal)}
        </span>
        <span className="ml-auto text-fg-subtle">{DESIGN_OPTIONS.length} catalog options</span>
      </div>

      <Tabs defaultValue="select">
        <TabsList>
          <TabsTrigger value="select">Select finishes</TabsTrigger>
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle">Room</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ROOM_LABELS) as DesignRoom[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoom(r)}
                  className={cn(
                    "border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    session.room === r
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-fg-muted hover:bg-bg-subtle",
                  )}
                >
                  {ROOM_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="ml-auto flex flex-wrap gap-1">
              {(["webgl", "css"] as const).map((v) => (
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
                    "border px-2 py-1 text-[10px] uppercase tracking-[0.06em]",
                    engine === v
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-fg-subtle",
                  )}
                >
                  {v === "webgl" ? "WebGL" : "CSS"}
                </button>
              ))}
              {engine === "css"
                ? (["perspective", "front", "elevation"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        persist({ ...session, viewMode: v, updatedAt: new Date().toISOString() })
                      }
                      className={cn(
                        "border px-2 py-1 text-[10px] uppercase tracking-[0.06em]",
                        session.viewMode === v
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-border text-fg-subtle",
                      )}
                    >
                      {v}
                    </button>
                  ))
                : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="border border-border bg-bg-elevated">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div>
                  <p className="flex items-center gap-2 text-[13px] font-medium">
                    <Box className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {ROOM_LABELS[session.room]} · {engine === "webgl" ? "WebGL walkthrough" : "CSS preview"}
                  </p>
                  <p className="text-[11px] text-fg-subtle">
                    {engine === "webgl"
                      ? "Orbit · zoom · live finish materials"
                      : `Live finish swap · ${session.viewMode} view`}
                  </p>
                </div>
                <Badge variant={upgradeTotal > 0 ? "secondary" : "outline"}>
                  {upgradeTotal === 0
                    ? "At midrange base"
                    : `+${formatCurrency(upgradeTotal)} upgrades`}
                </Badge>
              </div>
              {engine === "webgl" ? (
                <Suspense
                  fallback={
                    <div className="flex aspect-[16/10] items-center justify-center bg-[#1a1c1e] text-[12px] text-white/60">
                      Loading WebGL…
                    </div>
                  }
                >
                  <WebGLWalkthrough room={session.room} selections={resolved} />
                </Suspense>
              ) : (
                <VirtualRoom
                  room={session.room}
                  selections={resolved}
                  viewMode={session.viewMode}
                />
              )}
              <div className="border-t border-border px-4 py-3">
                <p className="label-caps mb-2">Locked package</p>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {roomCats.map((c) => {
                    const opt = resolved[c];
                    return (
                      <li key={c} className="flex items-center gap-2 text-[12px]">
                        <span
                          className="h-3 w-3 shrink-0 border border-border"
                          style={{ background: opt?.colorHex ?? "#ddd" }}
                        />
                        <span className="text-fg-muted">{DESIGN_CATEGORY_LABELS[c]}:</span>
                        <span className="truncate font-medium">{opt?.name ?? "—"}</span>
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

            <div className="border border-border bg-bg-elevated">
              <div className="border-b border-border px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {roomCats.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCat(c)}
                      className={cn(
                        "px-2 py-1 text-[11px] font-medium transition-colors",
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

              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <p className="text-[13px] font-medium">{DESIGN_CATEGORY_LABELS[cat]}</p>
                <div className="flex flex-wrap gap-1">
                  {(["all", "base", "upgrade", "trendy", "premium"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTierFilter(t)}
                      className={cn(
                        "border px-1.5 py-0.5 text-[10px]",
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
                          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                          selected ? "bg-bg-subtle" : "hover:bg-bg-subtle/60",
                          session.locked[cat] && "opacity-60",
                        )}
                      >
                        <span
                          className="mt-0.5 h-10 w-10 shrink-0 border border-border"
                          style={{
                            background: opt.colorHex,
                            backgroundImage:
                              opt.category === "flooring"
                                ? `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)`
                                : undefined,
                          }}
                        />
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
                          <span className="mt-1 block text-[11px] text-fg-subtle">{opt.imageHint}</span>
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
              Upgrade / Trendy / Premium options add the listed delta (change order on fixed-price).
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
          <div className="border border-border bg-bg-elevated p-4 text-[12px] text-fg-muted">
            <p className="font-medium text-fg">Current selection delta vs base</p>
            <p className="mt-1 text-[18px] font-medium tabular-nums text-fg">
              {upgradeTotal === 0 ? "At base" : `+${formatCurrency(upgradeTotal)}`}
            </p>
            <p className="mt-2 text-[11px] text-fg-subtle">
              Link Book of Plans allowances on the Plans tab for job-specific packages (TR-1580, JF-1520,
              SR-1620).
            </p>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">Upload plan set</p>
              <p className="mt-1 text-[12px] text-fg-muted">
                PDF or image of floor plans / elevations. Stored as session metadata. WebGL scene is
                procedural for now; plan-specific GLB / IFC is the next layer.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*,.dwg,.png,.jpg,.jpeg,.glb,.gltf,.ifc"
                className="hidden"
                onChange={(e) => onPlanFile(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                className="mt-3"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                Choose plan file
              </Button>
              {session.plan ? (
                <div className="mt-3 border border-border bg-bg px-3 py-2 text-[12px]">
                  <p className="flex items-center gap-2 font-medium text-fg">
                    <FileUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {session.plan.name}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {(session.plan.size / 1024).toFixed(0)} KB ·{" "}
                    {new Date(session.plan.uploadedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-fg-subtle">No plan uploaded yet.</p>
              )}
            </div>

            <div className="border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">Link Book of Plans</p>
              <p className="mt-1 text-[12px] text-fg-muted">
                Seed allowances and naming from a Split Rock standard ranch package.
              </p>
              <ul className="mt-3 space-y-2">
                {plans.filter((p) => p.active).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => linkBookPlan(p.id)}
                      className={cn(
                        "w-full border px-3 py-2 text-left text-[12px] transition-colors",
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
  const wall = selections.paint?.colorHex ?? "#F0EDE4";
  const floor = selections.flooring?.colorHex ?? "#C4A574";
  const cab = selections.cabinets?.colorHex ?? "#F7F7F5";
  const ct = selections.countertops?.colorHex ?? "#F2EFEA";
  const fx = selections.fixtures?.colorHex ?? "#C0C0C0";
  const light = selections.lighting?.colorHex ?? "#F5F5F5";
  const ext = selections.exterior?.colorHex ?? "#F4F1EA";
  const roof = selections.roofing?.colorHex ?? "#4A4A4A";
  const tile = selections.tile?.colorHex ?? "#E8E6E1";
  const splash = selections.backsplash?.colorHex ?? "#F5F5F5";

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
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-b from-[#8eabbf] to-[#c5d5e0]">
        <div
          className="absolute inset-x-[10%] bottom-[16%] top-[18%] shadow-2xl transition-transform duration-500"
          style={{
            transform: viewMode === "perspective" ? "perspective(800px) rotateY(-8deg)" : undefined,
            background: ext,
          }}
        >
          <div
            className="absolute -top-6 left-[-4%] right-[-4%] h-10"
            style={{
              background: roof,
              clipPath: "polygon(5% 100%, 50% 0%, 95% 100%)",
            }}
          />
          <div className="absolute left-[14%] top-[22%] h-[30%] w-[20%] border-2 border-black/20 bg-[#9ec5e0]/75" />
          <div className="absolute right-[14%] top-[22%] h-[30%] w-[20%] border-2 border-black/20 bg-[#9ec5e0]/75" />
          <div
            className="absolute bottom-0 left-1/2 h-[36%] w-[16%] -translate-x-1/2"
            style={{ background: selections.doors?.colorHex ?? "#3d2c1e" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[#5a6b3a]" />
        <p className="absolute bottom-2 left-3 text-[10px] text-white/90">
          Exterior elevation · virtual preview
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[#1a1a1a]/5">
      <div
        className="absolute inset-[6%] origin-center transition-transform duration-500"
        style={{ transform: perspective, transformStyle: "preserve-3d" }}
      >
        <div className="relative h-full w-full overflow-hidden shadow-xl" style={{ background: wall }}>
          <div
            className="absolute inset-x-0 bottom-0 h-[30%]"
            style={{
              background: floor,
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.07) 28px, rgba(0,0,0,0.07) 29px)`,
            }}
          />
          {isKitchen ? (
            <>
              <div
                className="absolute left-[8%] top-[14%] h-16 w-[11.2rem] border border-black/5"
                style={{ background: splash }}
              />
              <div className="absolute bottom-[30%] left-[6%] right-[26%]">
                <div className="h-2.5 border border-black/10" style={{ background: ct }} />
                <div className="h-[4.75rem] border-x border-b border-black/10" style={{ background: cab }} />
                <div
                  className="absolute -top-6 left-[28%] h-6 w-1.5 rounded-t-full"
                  style={{ background: fx }}
                />
              </div>
            </>
          ) : null}
          {isBath ? (
            <div
              className="absolute bottom-[32%] right-[12%] h-28 w-[22%] border border-black/10"
              style={{ background: tile }}
            />
          ) : null}
          <div className="absolute left-1/2 top-[8%] -translate-x-1/2">
            <div
              className="mx-auto h-2 w-2 rounded-full shadow-[0_0_28px_10px_rgba(255,240,200,0.5)]"
              style={{ background: light }}
            />
          </div>
          <p className="absolute bottom-2 left-3 text-[10px] text-black/40">
            CSS fallback preview · not a construction drawing
          </p>
        </div>
      </div>
    </div>
  );
}
