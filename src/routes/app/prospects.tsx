import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/data/store";
import {
  budgetLabel,
  isHot,
  needsFollowUp,
  stageLabel,
  timelineLabel,
} from "@/lib/prospects";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProspectStage, TourKind } from "@/data/types";

export const Route = createFileRoute("/app/prospects")({ component: ProspectsPage });

type Filter = "all" | "hot" | "followup" | "tours" | ProspectStage;

function ProspectsPage() {
  const {
    prospects, tours, proposals, tetonLots, tetonPackages,
    setProspectStage, touchProspect, acknowledgeProspectDualRole,
    scheduleTour, setTourStatus, createProposalFromProspect, setProposalStatus, setLotStatus,
  } = useAppStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState(prospects[0]?.id ?? "");
  const [tourKind, setTourKind] = useState<TourKind>("model_home");
  const [tourAt, setTourAt] = useState("");
  const [tourLoc, setTourLoc] = useState("Teton Heights Div #6 — Model Lot 12");

  const selected = prospects.find((p) => p.id === selectedId) ?? prospects[0];
  const selectedTours = tours.filter((t) => t.prospectId === selected?.id);
  const selectedProps = proposals.filter((p) => p.prospectId === selected?.id);

  const filtered = useMemo(() => {
    if (filter === "all") return prospects.filter((p) => p.stage !== "lost" && p.stage !== "won");
    if (filter === "hot") return prospects.filter(isHot);
    if (filter === "followup") return prospects.filter((p) => needsFollowUp(p));
    if (filter === "tours") {
      const ids = new Set(tours.filter((t) => t.status === "scheduled").map((t) => t.prospectId));
      return prospects.filter((p) => ids.has(p.id));
    }
    return prospects.filter((p) => p.stage === filter);
  }, [prospects, tours, filter]);

  const hotCount = prospects.filter(isHot).length;
  const followCount = prospects.filter((p) => needsFollowUp(p)).length;
  const tourSoon = tours.filter((t) => t.status === "scheduled").length;

  function bookTour() {
    if (!selected || !tourAt) return;
    scheduleTour({
      prospectId: selected.id,
      kind: tourKind,
      at: new Date(tourAt).toISOString(),
      location: tourLoc,
      notes: "",
      host: selected.assignedTo,
    });
  }

  function makeProposal() {
    if (!selected) return;
    const id = createProposalFromProspect(selected.id);
    if (id && selected.lotId) {
      const lot = tetonLots.find((l) => l.id === selected.lotId);
      if (lot?.status === "available" || lot?.status === "reserved") {
        setLotStatus(selected.lotId, "reserved");
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Prospects"
        description="Lead pipeline, tours, proposals — website, Teton Heights estimator, and agent referrals land here."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/estimate">Public estimator</Link>
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open pipeline" value={String(prospects.filter((p) => !["won", "lost"].includes(p.stage)).length)} />
        <StatCard label="Hot leads" value={String(hotCount)} hint="Score 75+" />
        <StatCard label="Follow-ups due" value={String(followCount)} hint="New or 48h+ silent" />
        <StatCard label="Tours scheduled" value={String(tourSoon)} />
      </div>

      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Active", count: prospects.filter((p) => !["won", "lost"].includes(p.stage)).length },
          { value: "hot", label: "Hot", count: hotCount },
          { value: "followup", label: "Follow-up", count: followCount },
          { value: "tours", label: "Has tour", count: tourSoon },
          { value: "new", label: "New", count: prospects.filter((p) => p.stage === "new").length },
          { value: "qualified", label: "Qualified", count: prospects.filter((p) => p.stage === "qualified").length },
          { value: "proposal_sent", label: "Proposal", count: prospects.filter((p) => p.stage === "proposal_sent").length },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`w-full border p-3 text-left transition-colors ${
                selected?.id === p.id ? "border-primary bg-bg-subtle" : "border-border bg-bg-elevated hover:bg-bg-subtle"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-medium">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-fg-muted">
                    {p.leadType.replace(/_/g, " ")} · {p.source.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={isHot(p) ? "warning" : "secondary"}>score {p.score}</Badge>
                  <Badge variant="outline">{stageLabel(p.stage)}</Badge>
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-[12px] text-fg-subtle">{p.interest}</p>
              {needsFollowUp(p) ? (
                <p className="mt-1 text-[11px] text-warning">Follow-up due</p>
              ) : null}
            </button>
          ))}
          {!filtered.length ? (
            <p className="border border-border px-4 py-8 text-center text-[13px] text-fg-muted">No prospects in this filter.</p>
          ) : null}
        </div>

        {selected ? (
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>{selected.name}</CardTitle>
                <p className="mt-1 text-[12px] text-fg-muted">
                  {selected.phone} · {selected.email}
                </p>
              </div>
              <Badge variant={isHot(selected) ? "warning" : "secondary"}>score {selected.score}</Badge>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="detail">
                <TabsList>
                  <TabsTrigger value="detail">Detail</TabsTrigger>
                  <TabsTrigger value="tour">Tour</TabsTrigger>
                  <TabsTrigger value="proposal">Proposal</TabsTrigger>
                </TabsList>

                <TabsContent value="detail" className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2 text-[12px]">
                    <p><span className="text-fg-subtle">Stage</span><br /><span className="font-medium capitalize">{stageLabel(selected.stage)}</span></p>
                    <p><span className="text-fg-subtle">Budget</span><br /><span className="font-medium">{budgetLabel(selected.budgetBand)}</span></p>
                    <p><span className="text-fg-subtle">Timeline</span><br /><span className="font-medium">{timelineLabel(selected.timeline)}</span></p>
                    <p><span className="text-fg-subtle">Owner</span><br /><span className="font-medium">{selected.assignedTo}</span></p>
                  </div>
                  <p className="text-[13px] text-fg-muted">{selected.interest}</p>
                  {selected.notes ? <p className="text-[12px] text-fg-subtle">{selected.notes}</p> : null}
                  {selected.lotId ? (
                    <p className="text-[12px]">
                      Lot:{" "}
                      <Link to="/app/teton-heights" className="underline">
                        {tetonLots.find((l) => l.id === selected.lotId)
                          ? `B${tetonLots.find((l) => l.id === selected.lotId)!.block}/L${tetonLots.find((l) => l.id === selected.lotId)!.lot}`
                          : selected.lotId}
                      </Link>
                      {selected.packageId
                        ? ` · ${tetonPackages.find((x) => x.id === selected.packageId)?.name ?? selected.packageId}`
                        : ""}
                    </p>
                  ) : null}
                  {selected.referralAgent ? (
                    <p className="text-[12px] text-fg-muted">
                      Referral: {selected.referralAgent} ({selected.referralBrokerage})
                    </p>
                  ) : null}

                  {selected.dualRoleFlag ? (
                    <div className="border border-border p-3 text-[12px]">
                      <p className="font-medium">Dual-role path (builder + licensee)</p>
                      <p className="mt-1 text-fg-muted">
                        {selected.dualRoleAcknowledged
                          ? "Disclosure acknowledged."
                          : "Disclosure not yet recorded — required before negotiation."}
                      </p>
                      {!selected.dualRoleAcknowledged ? (
                        <Button size="sm" className="mt-2" onClick={() => acknowledgeProspectDualRole(selected.id)}>
                          Record acknowledgment
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => touchProspect(selected.id)}>
                      Log contact
                    </Button>
                    {selected.stage === "new" || selected.stage === "contacted" ? (
                      <Button size="sm" onClick={() => setProspectStage(selected.id, "qualified")}>
                        Mark qualified
                      </Button>
                    ) : null}
                    {selected.lotId && selected.stage !== "lot_hold" && selected.stage !== "won" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProspectStage(selected.id, "lot_hold");
                          if (selected.lotId) setLotStatus(selected.lotId, "reserved");
                        }}
                      >
                        Lot hold
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => setProspectStage(selected.id, "won")}>
                      Won
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProspectStage(selected.id, "lost", "Not a fit")}
                    >
                      Lost
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="tour" className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label>Type</Label>
                      <Select value={tourKind} onValueChange={(v) => setTourKind(v as TourKind)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="model_home">Model home</SelectItem>
                          <SelectItem value="lot_walk">Lot walk</SelectItem>
                          <SelectItem value="custom_consult">Custom consult</SelectItem>
                          <SelectItem value="commercial_walk">Commercial walk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>When</Label>
                      <Input type="datetime-local" value={tourAt} onChange={(e) => setTourAt(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={tourLoc} onChange={(e) => setTourLoc(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={bookTour} disabled={!tourAt}>Schedule tour</Button>

                  <div className="space-y-2 pt-2">
                    {selectedTours.map((t) => (
                      <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border border-border p-2 text-[12px]">
                        <div>
                          <p className="font-medium capitalize">{t.kind.replace(/_/g, " ")}</p>
                          <p className="text-fg-muted">{formatDate(t.at)} · {t.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={t.status === "scheduled" ? "warning" : "success"}>{t.status}</Badge>
                          {t.status === "scheduled" ? (
                            <Button size="sm" variant="outline" onClick={() => setTourStatus(t.id, "completed")}>
                              Complete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {!selectedTours.length ? (
                      <p className="text-[12px] text-fg-muted">No tours yet.</p>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="proposal" className="space-y-3">
                  <Button size="sm" onClick={makeProposal}>Create proposal from lot + package</Button>
                  <p className="text-[11px] text-fg-subtle">
                    Uses linked Teton Heights lot and build package when set. Opens as draft; print from Proposals tab below.
                  </p>
                  {selectedProps.map((prop) => (
                    <div key={prop.id} className="border border-border p-3 text-[13px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">Proposal {prop.id}</p>
                        <Badge variant="outline">{prop.status}</Badge>
                      </div>
                      <p className="mt-2 tabular-nums text-fg-muted">
                        Lot {formatCurrency(prop.lotPrice)} · Build {formatCurrency(prop.buildPrice)} · Soft{" "}
                        {formatCurrency(prop.softCosts)}
                      </p>
                      <p className="mt-1 text-[15px] font-medium tabular-nums">{formatCurrency(prop.total)}</p>
                      <p className="text-[11px] text-fg-subtle">Valid through {formatDate(prop.validUntil)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prop.status === "draft" ? (
                          <Button size="sm" onClick={() => setProposalStatus(prop.id, "sent")}>Mark sent</Button>
                        ) : null}
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/app/proposals" search={{ id: prop.id }}>Open / print</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming tours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tours
            .filter((t) => t.status === "scheduled")
            .sort((a, b) => a.at.localeCompare(b.at))
            .map((t) => {
              const pr = prospects.find((p) => p.id === t.prospectId);
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 border border-border p-3 text-[13px]">
                  <div>
                    <p className="font-medium">{pr?.name ?? t.prospectId}</p>
                    <p className="text-[12px] text-fg-muted">
                      {formatDate(t.at)} · {t.location} · {t.host}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(t.prospectId)}>
                    Open
                  </Button>
                </div>
              );
            })}
          {!tours.some((t) => t.status === "scheduled") ? (
            <p className="text-[13px] text-fg-muted">No scheduled tours.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
