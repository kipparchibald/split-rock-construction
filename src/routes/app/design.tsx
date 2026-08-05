import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ExternalLink,
  Lock,
  ShoppingBag,
  Unlock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DesignCategory } from "@/data/types";
import {
  DEFAULT_SELECTIONS,
  DESIGN_CATEGORY_LABELS,
  DESIGN_OPTIONS,
  formatDelta,
  optionById,
  optionsForCategory,
  partnerCategoryForDesign,
  ROOM_CATEGORIES,
  ROOM_LABELS,
  type DesignRoom,
} from "@/lib/design-catalog";
import {
  AFFILIATE_DISCLOSURE,
  partnersForCategory,
  shopUrl,
} from "@/lib/finish-partners";
import { loadJson, PERSIST_KEYS, saveJson } from "@/lib/local-persist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/design")({ component: DesignCenterPage });

type SelectionMap = Partial<Record<DesignCategory, string>>;

interface DesignSession {
  projectLabel: string;
  room: DesignRoom;
  selections: SelectionMap;
  locked: Partial<Record<DesignCategory, boolean>>;
  updatedAt: string;
}

function loadSession(): DesignSession {
  return loadJson<DesignSession>(PERSIST_KEYS.designSessions, {
    projectLabel: "Current home",
    room: "kitchen",
    selections: { ...DEFAULT_SELECTIONS },
    locked: {},
    updatedAt: new Date().toISOString(),
  });
}

function DesignCenterPage() {
  const [session, setSession] = useState<DesignSession>(loadSession);
  const [activeCat, setActiveCat] = useState<DesignCategory>("paint");

  const roomCats = ROOM_CATEGORIES[session.room];
  const cat =
    roomCats.includes(activeCat) ? activeCat : roomCats[0] ?? "paint";

  const setRoom = (room: DesignRoom) => {
    const nextCats = ROOM_CATEGORIES[room];
    const next: DesignSession = {
      ...session,
      room,
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    saveJson(PERSIST_KEYS.designSessions, next);
    if (!nextCats.includes(cat)) setActiveCat(nextCats[0]!);
  };

  const pick = (category: DesignCategory, optionId: string) => {
    if (session.locked[category]) return;
    const next: DesignSession = {
      ...session,
      selections: { ...session.selections, [category]: optionId },
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    saveJson(PERSIST_KEYS.designSessions, next);
  };

  const toggleLock = (category: DesignCategory) => {
    const next: DesignSession = {
      ...session,
      locked: { ...session.locked, [category]: !session.locked[category] },
      updatedAt: new Date().toISOString(),
    };
    setSession(next);
    saveJson(PERSIST_KEYS.designSessions, next);
  };

  const resolved = useMemo(() => {
    const map: Partial<Record<DesignCategory, ReturnType<typeof optionById>>> = {};
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

  const options = optionsForCategory(cat);
  const partners = partnersForCategory(partnerCategoryForDesign(cat));

  return (
    <div>
      <PageHeader
        title="Design center"
        description="Client picks paint, flooring, cabinets, fixtures, and more. Live virtual room updates with every choice. Purchase through preferred partners when ready to order."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <span className="ml-auto text-[11px] text-fg-subtle">
          {session.projectLabel} · saved locally
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Virtual room */}
        <div className="border border-border bg-bg-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div>
              <p className="text-[13px] font-medium">{ROOM_LABELS[session.room]} preview</p>
              <p className="text-[11px] text-fg-subtle">Finishes update live as you select</p>
            </div>
            <Badge variant={upgradeTotal > 0 ? "secondary" : "outline"}>
              {upgradeTotal === 0
                ? "At allowance"
                : upgradeTotal > 0
                  ? `+$${upgradeTotal.toLocaleString()} upgrades`
                  : `$${Math.abs(upgradeTotal).toLocaleString()} under`}
            </Badge>
          </div>
          <VirtualRoom room={session.room} selections={resolved} />
          <div className="border-t border-border px-4 py-3">
            <p className="label-caps mb-2">Current package</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {roomCats.map((c) => {
                const o = resolved[c];
                return (
                  <li key={c} className="flex items-center gap-2 text-[12px]">
                    <span
                      className="h-3 w-3 shrink-0 border border-border"
                      style={{ background: o?.colorHex ?? "#ddd" }}
                    />
                    <span className="text-fg-muted">{DESIGN_CATEGORY_LABELS[c]}:</span>
                    <span className="truncate font-medium">{o?.name ?? "—"}</span>
                    {session.locked[c] ? (
                      <Lock className="ml-auto h-3 w-3 text-fg-subtle" strokeWidth={1.75} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Picker */}
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

          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="text-[13px] font-medium">{DESIGN_CATEGORY_LABELS[cat]}</p>
            <Button size="sm" variant="outline" onClick={() => toggleLock(cat)}>
              {session.locked[cat] ? (
                <>
                  <Unlock className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                  Lock choice
                </>
              )}
            </Button>
          </div>

          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto border-t border-border">
            {options.map((o) => {
              const selected = session.selections[cat] === o.id;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    disabled={!!session.locked[cat]}
                    onClick={() => pick(cat, o.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      selected ? "bg-bg-subtle" : "hover:bg-bg-subtle/60",
                      session.locked[cat] && "opacity-60",
                    )}
                  >
                    <span
                      className="mt-0.5 h-10 w-10 shrink-0 border border-border"
                      style={{
                        background: o.colorHex,
                        backgroundImage:
                          o.category === "flooring"
                            ? `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)`
                            : undefined,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{o.name}</span>
                        {selected ? (
                          <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-fg-muted">
                        {[o.brand, o.finish, o.woodSpecies].filter(Boolean).join(" · ")}
                      </span>
                      <span className="mt-1 block text-[11px] text-fg-subtle">{o.imageHint}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[12px] font-medium",
                        o.priceDelta > 0
                          ? "text-fg"
                          : o.priceDelta < 0
                            ? "text-fg-muted"
                            : "text-fg-subtle",
                      )}
                    >
                      {formatDelta(o.priceDelta)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border px-4 py-3">
            <p className="label-caps mb-2">Order this category</p>
            <p className="mb-2 text-[11px] leading-relaxed text-fg-subtle">{AFFILIATE_DISCLOSURE}</p>
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

      <div className="mt-4 border border-border bg-bg-elevated p-4 text-[12px] leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">How we use this with owners</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Open Design center in the selection meeting (kitchen first, then baths, then living).</li>
          <li>Lock each category when the owner confirms — locked choices stay for the purchase list.</li>
          <li>Upgrade total above tracks allowance impact across the active package.</li>
          <li>When ready to buy, use Order buttons (affiliate / trade links) or your Ferguson / paint store account.</li>
          <li>Full 3D walkthrough from uploaded plans is the next layer; this room engine is the day-one client experience.</li>
        </ol>
        <p className="mt-3 text-[11px] text-fg-subtle">
          Catalog size: {DESIGN_OPTIONS.length} options · Swaps are CSS-rendered for instant feedback offline.
        </p>
      </div>
    </div>
  );
}

function VirtualRoom({
  room,
  selections,
}: {
  room: DesignRoom;
  selections: Partial<Record<DesignCategory, ReturnType<typeof optionById>>>;
}) {
  const wall = selections.paint?.colorHex ?? "#F0EDE4";
  const floor = selections.flooring?.colorHex ?? "#C4A574";
  const cab = selections.cabinets?.colorHex ?? "#F7F7F5";
  const ct = selections.countertops?.colorHex ?? "#F2EFEA";
  const fx = selections.fixtures?.colorHex ?? "#C0C0C0";
  const light = selections.lighting?.colorHex ?? "#F5F5F5";
  const ext = selections.exterior?.colorHex ?? "#F4F1EA";

  const isBath = room === "primary_bath" || room === "hall_bath";
  const isKitchen = room === "kitchen";
  const isExterior = room === "exterior";

  if (isExterior) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden bg-[#87a0b8]">
        <div
          className="absolute inset-x-[12%] bottom-[18%] top-[22%] shadow-lg"
          style={{
            background: `linear-gradient(180deg, ${ext} 0%, ${ext} 72%, ${selections.exterior?.id?.includes("stone") ? "#8B7D6B" : ext} 72%)`,
          }}
        >
          <div className="absolute left-[18%] top-[28%] h-[28%] w-[22%] border-2 border-[#2a2a2a]/20 bg-[#9ec5e0]/70" />
          <div className="absolute right-[18%] top-[28%] h-[28%] w-[22%] border-2 border-[#2a2a2a]/20 bg-[#9ec5e0]/70" />
          <div className="absolute bottom-0 left-1/2 h-[32%] w-[14%] -translate-x-1/2 bg-[#3d2c1e]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[18%] bg-[#5a6b3a]" />
        <p className="absolute bottom-2 left-3 text-[10px] text-white/80">Exterior elevation preview</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: wall }}>
      {/* Ceiling band */}
      <div className="absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-black/10 to-transparent" />

      {/* Back wall depth */}
      <div
        className="absolute inset-x-[8%] top-[12%] bottom-[32%] border border-black/5"
        style={{ background: wall }}
      />

      {/* Floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[32%]"
        style={{
          background: floor,
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 28px,
            rgba(0,0,0,0.07) 28px,
            rgba(0,0,0,0.07) 29px
          ), linear-gradient(to top, rgba(0,0,0,0.12), transparent)`,
        }}
      />

      {/* Window */}
      <div className="absolute right-[14%] top-[18%] h-[28%] w-[18%] border-2 border-black/15 bg-[#b8d4e8]/55 shadow-inner">
        <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
      </div>

      {/* Light fixture */}
      <div className="absolute left-1/2 top-[10%] -translate-x-1/2">
        <div
          className="mx-auto h-2 w-2 rounded-full shadow-[0_0_24px_8px_rgba(255,240,200,0.45)]"
          style={{ background: light }}
        />
        <div className="mx-auto mt-0.5 h-6 w-10 border border-black/10" style={{ background: light }} />
      </div>

      {isKitchen ? (
        <>
          {/* Upper cabinets */}
          <div className="absolute left-[10%] top-[16%] flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 w-14 border border-black/10 shadow-sm"
                style={{ background: cab }}
              >
                <div className="mx-auto mt-7 h-1 w-4 rounded-full bg-black/25" />
              </div>
            ))}
          </div>
          {/* Base cabinets + counter */}
          <div className="absolute bottom-[32%] left-[8%] right-[28%]">
            <div className="h-2 border border-black/10" style={{ background: ct }} />
            <div className="flex h-20 border-x border-b border-black/10" style={{ background: cab }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="relative flex-1 border-r border-black/10 last:border-r-0">
                  <div className="absolute left-1/2 top-1/2 h-1 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30" />
                </div>
              ))}
            </div>
            {/* Faucet */}
            <div
              className="absolute -top-5 left-[30%] h-5 w-1.5 rounded-t-full"
              style={{ background: fx }}
            />
          </div>
          {/* Island */}
          <div className="absolute bottom-[34%] right-[12%] w-[22%]">
            <div className="h-2 border border-black/10" style={{ background: ct }} />
            <div className="h-14 border-x border-b border-black/10" style={{ background: cab }} />
          </div>
        </>
      ) : null}

      {isBath ? (
        <>
          <div className="absolute bottom-[32%] left-[12%] w-[28%]">
            <div className="h-2 border border-black/10" style={{ background: ct }} />
            <div className="h-16 border-x border-b border-black/10" style={{ background: cab }}>
              <div className="mx-auto mt-6 h-1 w-6 rounded-full bg-black/30" />
            </div>
            <div
              className="absolute -top-6 left-1/2 h-6 w-1.5 -translate-x-1/2 rounded-t-full"
              style={{ background: fx }}
            />
          </div>
          <div
            className="absolute bottom-[34%] right-[16%] h-24 w-16 rounded-t-[40%] border border-black/10 bg-white/80"
          />
        </>
      ) : null}

      {!isKitchen && !isBath ? (
        <>
          {/* Sofa block */}
          <div
            className="absolute bottom-[34%] left-[18%] h-16 w-[36%] border border-black/10"
            style={{ background: `color-mix(in srgb, ${wall} 70%, #6b5b4a)` }}
          />
          <div
            className="absolute bottom-[42%] right-[20%] h-12 w-12 border border-black/10"
            style={{ background: `color-mix(in srgb, ${floor} 40%, #4a4035)` }}
          />
        </>
      ) : null}

      <p className="absolute bottom-2 left-3 text-[10px] text-black/40">
        Interactive preview · not a construction drawing
      </p>
    </div>
  );
}
