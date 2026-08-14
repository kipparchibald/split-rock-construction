import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/data/store";
import type { BudgetBand, LeadType, TimelineBand } from "@/data/types";

export const Route = createFileRoute("/agents")({ component: AgentsPage });

function AgentsPage() {
  const addProspect = useAppStore((s) => s.addProspect);
  const [agentName, setAgent] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [leadType, setLeadType] = useState<LeadType>("lot_and_build");
  const [budgetBand, setBudget] = useState<BudgetBand>("500_650k");
  const [timeline, setTimeline] = useState<TimelineBand>("3_6mo");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentName || !clientName || !clientPhone) return;
    addProspect({
      name: clientName,
      email: clientEmail || agentEmail,
      phone: clientPhone,
      leadType,
      source: "referral_agent",
      budgetBand,
      timeline,
      interest: notes || "Agent referral",
      notes: `Referred by ${agentName} (${brokerage || "brokerage n/a"}). Agent: ${agentPhone} ${agentEmail}`,
      dualRoleFlag: leadType === "lot_only" || leadType === "lot_and_build",
      dualRoleAcknowledged: false,
      assignedTo: "Kipp Archibald",
      referralAgent: agentName,
      referralBrokerage: brokerage || "—",
    });
    setDone(true);
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Logo />
          <Button variant="ghost" size="sm" asChild><Link to="/">Home</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="label-caps">Partner agents</p>
        <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] sm:text-3xl">Refer a buyer</h1>
        <p className="mt-3 text-[14px] text-fg-muted">
          Submit a client interested in Teton Heights, a custom build, or commercial work.
          Split Rock will follow up and keep you in the loop.
        </p>

        {done ? (
          <Card className="mt-8">
            <CardContent className="flex flex-col gap-3 py-8">
              <CheckCircle2 className="h-6 w-6 text-success" strokeWidth={1.75} />
              <p className="font-medium">Referral received.</p>
              <p className="text-[13px] text-fg-muted">We'll contact your client and update you on status.</p>
              <Button asChild><Link to="/">Done</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Card>
              <CardHeader><CardTitle>Your info</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Agent name</Label>
                  <Input required value={agentName} onChange={(e) => setAgent(e.target.value)} />
                </div>
                <div>
                  <Label>Brokerage</Label>
                  <Input value={brokerage} onChange={(e) => setBrokerage(e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Client</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Client name</Label>
                  <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <Label>Client email</Label>
                  <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Client phone</Label>
                  <Input required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Need</Label>
                  <Select value={leadType} onValueChange={(v) => setLeadType(v as LeadType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lot_and_build">Lot + build</SelectItem>
                      <SelectItem value="lot_only">Lot only</SelectItem>
                      <SelectItem value="custom_own_land">Custom on own land</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
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
                      <SelectItem value="browsing">Browsing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Budget band</Label>
                  <Select value={budgetBand} onValueChange={(v) => setBudget(v as BudgetBand)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_400k">Under $400k</SelectItem>
                      <SelectItem value="400_500k">$400–500k</SelectItem>
                      <SelectItem value="500_650k">$500–650k</SelectItem>
                      <SelectItem value="650_800k">$650–800k</SelectItem>
                      <SelectItem value="800k_plus">$800k+</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Must-haves, lot preference, financing…" />
                </div>
              </CardContent>
            </Card>
            <Button type="submit" size="lg">
              Submit referral <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          </form>
        )}
      </main>
      <MarketingFooter />
    </div>
  );
}
