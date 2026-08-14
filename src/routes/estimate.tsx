import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import { packageTotal } from "@/lib/lot-pricing";
import { formatCurrency } from "@/lib/utils";
import type { BudgetBand, TimelineBand } from "@/data/types";

export const Route = createFileRoute("/estimate")({ component: EstimatePage });

function EstimatePage() {
  const { tetonLots, tetonPackages, tetonCommunity, addProspect } = useAppStore();
  const available = tetonLots.filter((l) => l.status === "available" || l.status === "model");
  const [lotId, setLotId] = useState(available.find((l) => l.status === "available")?.id ?? available[0]?.id ?? "");
  const [pkgId, setPkgId] = useState(tetonPackages[1]?.id ?? tetonPackages[0]?.id ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetBand, setBudget] = useState<BudgetBand>("500_650k");
  const [timeline, setTimeline] = useState<TimelineBand>("0_3mo");
  const [dualAck, setDualAck] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const lot = tetonLots.find((l) => l.id === lotId);
  const pack = tetonPackages.find((p) => p.id === pkgId);
  const calc = useMemo(() => (lot && pack ? packageTotal(lot, pack) : null), [lot, pack]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !phone || !dualAck) return;
    const id = addProspect({
      name,
      email,
      phone,
      leadType: "lot_and_build",
      source: "teton_estimator",
      budgetBand,
      timeline,
      interest: `${pack?.name ?? "Package"} on B${lot?.block}/L${lot?.lot} — est. ${calc ? formatCurrency(calc.total) : ""}`,
      notes: "Submitted via public Teton Heights estimator.",
      dualRoleFlag: true,
      dualRoleAcknowledged: dualAck,
      lotId: lot?.id,
      packageId: pack?.id,
      assignedTo: "Kipp Archibald",
    });
    setDoneId(id);
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Logo />
          <Button variant="ghost" size="sm" asChild><Link to="/">Back home</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="label-caps">Teton Heights Division #6</p>
        <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] sm:text-3xl">
          Price a lot + Split Rock home
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
          Base lots from {formatCurrency(tetonCommunity.baseLotPrice)} (0.6+ ac). Pick a lot and plan,
          then send your info — we’ll follow up from Rigby. Estimates exclude well, septic, and driveway.
        </p>

        {doneId ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-start gap-3 py-8">
              <CheckCircle2 className="h-6 w-6 text-success" strokeWidth={1.75} />
              <p className="text-[15px] font-medium">Thanks — we got your estimate request.</p>
              <p className="text-[13px] text-fg-muted">
                A Split Rock teammate will reach out shortly. Reference {doneId}.
              </p>
              <Button asChild><Link to="/">Return home</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-6">
            <Card>
              <CardHeader><CardTitle>1. Lot & plan</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Available lot</Label>
                  <Select value={lotId} onValueChange={setLotId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {available.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          B{l.block}/L{l.lot} · {l.acres} ac · {formatCurrency(l.listPrice)} · {l.premium.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Build package</Label>
                  <Select value={pkgId} onValueChange={setPkgId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tetonPackages.map((bp) => (
                        <SelectItem key={bp.id} value={bp.id}>
                          {bp.name} · {bp.sqft} sf · {formatCurrency(bp.baseBuild)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {calc ? (
                  <div className="sm:col-span-2 border border-border p-4">
                    <div className="flex justify-between text-[13px] text-fg-muted">
                      <span>Lot</span><span className="tabular-nums text-fg">{formatCurrency(calc.lotPrice)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-[13px] text-fg-muted">
                      <span>Build</span><span className="tabular-nums text-fg">{formatCurrency(calc.buildPrice)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-[13px] text-fg-muted">
                      <span>Est. soft / closing</span><span className="tabular-nums text-fg">{formatCurrency(calc.soft)}</span>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-border pt-3 text-[16px] font-medium">
                      <span>All-in estimate</span>
                      <span className="tabular-nums">{formatCurrency(calc.total)}</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>2. Your info</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Budget band</Label>
                  <Select value={budgetBand} onValueChange={(v) => setBudget(v as BudgetBand)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_400k">Under $400k</SelectItem>
                      <SelectItem value="400_500k">$400–500k</SelectItem>
                      <SelectItem value="500_650k">$500–650k</SelectItem>
                      <SelectItem value="650_800k">$650–800k</SelectItem>
                      <SelectItem value="800k_plus">$800k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeline</Label>
                  <Select value={timeline} onValueChange={(v) => setTimeline(v as TimelineBand)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0_3mo">0–3 months</SelectItem>
                      <SelectItem value="3_6mo">3–6 months</SelectItem>
                      <SelectItem value="6_12mo">6–12 months</SelectItem>
                      <SelectItem value="12mo_plus">12+ months</SelectItem>
                      <SelectItem value="browsing">Just browsing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="sm:col-span-2 flex items-start gap-2 text-[12px] text-fg-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={dualAck}
                    onChange={(e) => setDualAck(e.target.checked)}
                    required
                  />
                  <span>
                    I understand Split Rock may act as builder and that a principal may also be a licensed
                    real estate licensee; dual-capacity details will be provided in writing before any agreement.
                  </span>
                </label>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Send my estimate request <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          </form>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
