import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Plus,
  Shield,
  ShieldAlert,
  ShieldOff,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SAMPLE_VENDORS,
  daysUntil,
  deriveCoiStatus,
  policiesNeedingAttention,
  refreshPolicyStatuses,
  samplePolicies,
  vendorComplianceScore,
} from "@/lib/sub-insurance";
import type { CoiStatus, InsurancePolicy, InsurancePolicyType, Vendor } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/subs")({ component: SubsInsurancePage });

const POLICY_TYPES: { value: InsurancePolicyType; label: string }[] = [
  { value: "general_liability", label: "General liability" },
  { value: "workers_comp", label: "Workers' comp" },
  { value: "auto", label: "Auto" },
  { value: "umbrella", label: "Umbrella" },
  { value: "builders_risk", label: "Builders risk" },
  { value: "professional", label: "Professional / E&O" },
];

const ADDITIONAL_INSURED_NAME = "Split Rock Construction LLC";

function statusBadgeVariant(status: CoiStatus | string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "valid" || status === "active") return "success";
  if (status === "expiring_soon" || status === "pending_review") return "warning";
  if (status === "expired" || status === "missing") return "destructive";
  return "secondary";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function typeLabel(t: InsurancePolicyType) {
  return POLICY_TYPES.find((x) => x.value === t)?.label ?? t;
}

function SubsInsurancePage() {
  const [vendors, setVendors] = useState<Vendor[]>(SAMPLE_VENDORS);
  const [policies, setPolicies] = useState<InsurancePolicy[]>(() => refreshPolicyStatuses(samplePolicies));
  const [selectedVendorId, setSelectedVendorId] = useState<string>(SAMPLE_VENDORS[0]?.id ?? "");
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);

  // New policy form
  const [formType, setFormType] = useState<InsurancePolicyType>("general_liability");
  const [formCarrier, setFormCarrier] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formExp, setFormExp] = useState("");
  const [formAI, setFormAI] = useState(true);
  const [formFileName, setFormFileName] = useState<string | null>(null);

  // New vendor form
  const [vCompany, setVCompany] = useState("");
  const [vTrade, setVTrade] = useState("");
  const [vContact, setVContact] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vPhone, setVPhone] = useState("");

  const attention = useMemo(() => policiesNeedingAttention(policies), [policies]);
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  const vendorPolicies = useMemo(
    () => refreshPolicyStatuses(policies.filter((p) => p.vendorId === selectedVendorId)),
    [policies, selectedVendorId],
  );
  const score = selectedVendorId
    ? vendorComplianceScore(selectedVendorId, policies)
    : { score: 0, missing: [], expiring: [], expired: [] };

  function recordCoi() {
    if (!selectedVendorId || !formCarrier || !formNumber || !formExp) return;
    const status = deriveCoiStatus({ expirationDate: formExp });
    const pol: InsurancePolicy = {
      id: `pol-${Date.now()}`,
      vendorId: selectedVendorId,
      type: formType,
      carrier: formCarrier.trim(),
      policyNumber: formNumber.trim(),
      expirationDate: formExp,
      status,
      additionalInsured: formType === "general_liability" ? formAI : false,
      additionalInsuredNamed:
        formType === "general_liability" && formAI ? ADDITIONAL_INSURED_NAME : undefined,
      certificateUrl: formFileName ? `local://${formFileName}` : undefined,
      notes: formFileName ? `COI on file: ${formFileName}` : undefined,
    };
    setPolicies((prev) => refreshPolicyStatuses([pol, ...prev.filter((p) => !(p.vendorId === selectedVendorId && p.type === formType))]));
    setShowAddPolicy(false);
    setFormCarrier("");
    setFormNumber("");
    setFormExp("");
    setFormFileName(null);
    setFormAI(true);
  }

  function addVendor() {
    if (!vCompany.trim()) return;
    const id = `v-${Date.now()}`;
    const v: Vendor = {
      id,
      company: vCompany.trim(),
      trade: vTrade.trim() || "General",
      contact: vContact.trim(),
      email: vEmail.trim(),
      phone: vPhone.trim(),
      preferred: false,
    };
    setVendors((prev) => [...prev, v]);
    setSelectedVendorId(id);
    setShowAddVendor(false);
    setVCompany("");
    setVTrade("");
    setVContact("");
    setVEmail("");
    setVPhone("");
  }

  function togglePreferred(id: string) {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, preferred: !v.preferred } : v)));
  }

  return (
    <div>
      <PageHeader
        title="Sub insurance"
        description="COI portal — track general liability, workers' comp, additional insured, and expiration alerts so your own coverage stays clean."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddVendor(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Add sub
            </Button>
            <Button size="sm" onClick={() => setShowAddPolicy(true)} disabled={!selectedVendorId}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Record COI
            </Button>
          </div>
        }
      />

      {/* Attention strip */}
      {attention.length > 0 && (
        <div className="mb-6 border border-border bg-bg-elevated">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-fg" strokeWidth={1.75} />
            <p className="text-[12px] font-medium">Needs attention ({attention.length})</p>
          </div>
          <ul className="divide-y divide-border">
            {attention.map((p) => {
              const v = vendors.find((x) => x.id === p.vendorId);
              const days = daysUntil(p.expirationDate);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px]">
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={() => p.vendorId && setSelectedVendorId(p.vendorId)}
                  >
                    {v?.company ?? "Unknown"} · {typeLabel(p.type)}
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(String(p.status))}>{statusLabel(String(p.status))}</Badge>
                    <span className="tabular-nums text-fg-muted">
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`} · {p.expirationDate}
                    </span>
                    {!p.additionalInsured && p.type === "general_liability" && (
                      <span className="text-fg-subtle">No AI</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Vendor list */}
        <div className="border border-border">
          <p className="label-caps border-b border-border px-3 py-2">Subcontractors</p>
          <div className="divide-y divide-border">
            {vendors.map((v) => {
              const sc = vendorComplianceScore(v.id, policies);
              const active = v.id === selectedVendorId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVendorId(v.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-3 py-3 text-left transition-colors",
                    active ? "bg-bg-subtle" : "hover:bg-bg-elevated",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-medium">{v.company}</span>
                    {v.preferred && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        Preferred
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-fg-muted">{v.trade}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <ScoreDot score={sc.score} />
                    <span className="text-[11px] tabular-nums text-fg-subtle">{sc.score}% compliant</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-4">
          {selectedVendor ? (
            <>
              <div className="border border-border bg-bg-elevated p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-medium">{selectedVendor.company}</h2>
                    <p className="mt-1 text-[12px] text-fg-muted">
                      {selectedVendor.trade}
                      {selectedVendor.contact ? ` · ${selectedVendor.contact}` : ""}
                      {selectedVendor.phone ? ` · ${selectedVendor.phone}` : ""}
                    </p>
                    {selectedVendor.email && (
                      <a
                        href={`mailto:${selectedVendor.email}`}
                        className="mt-0.5 block text-[12px] text-fg-muted hover:text-fg hover:underline"
                      >
                        {selectedVendor.email}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <ScoreDot score={score.score} large />
                      <span className="text-[18px] font-medium tabular-nums">{score.score}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => togglePreferred(selectedVendor.id)}>
                      {selectedVendor.preferred ? "Remove preferred" : "Mark preferred"}
                    </Button>
                  </div>
                </div>

                {(score.missing.length > 0 || score.expired.length > 0 || score.expiring.length > 0) && (
                  <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
                    {score.missing.length > 0 && (
                      <div className="flex gap-2 text-[12px] text-fg-muted">
                        <ShieldOff className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span>Missing: {score.missing.map((m) => typeLabel(m as InsurancePolicyType)).join(", ")}</span>
                      </div>
                    )}
                    {score.expired.length > 0 && (
                      <div className="flex gap-2 text-[12px] text-fg-muted">
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{score.expired.length} expired</span>
                      </div>
                    )}
                    {score.expiring.length > 0 && (
                      <div className="flex gap-2 text-[12px] text-fg-muted">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{score.expiring.length} expiring ≤30d</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-4 text-[11px] leading-relaxed text-fg-subtle">
                  Required for field work: general liability + workers' comp. GL must name{" "}
                  <strong className="text-fg-muted">{ADDITIONAL_INSURED_NAME}</strong> as additional insured.
                  Score penalizes missing AI, gaps, and near-term expirations.
                </p>
              </div>

              <div className="border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <p className="text-[12px] font-medium">Certificates on file</p>
                  <Button size="sm" variant="outline" onClick={() => setShowAddPolicy(true)}>
                    <FileUp className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                    Upload / record
                  </Button>
                </div>
                {vendorPolicies.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[13px] text-fg-muted">
                    No COIs recorded. Request GL and workers' comp with additional insured before mobilizing.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {vendorPolicies.map((p) => {
                      const days = daysUntil(p.expirationDate);
                      return (
                        <li key={p.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-medium">{typeLabel(p.type)}</span>
                                <Badge variant={statusBadgeVariant(String(p.status))}>
                                  {statusLabel(String(p.status))}
                                </Badge>
                                {p.type === "general_liability" && (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[11px]",
                                      p.additionalInsured ? "text-fg-muted" : "text-fg-subtle",
                                    )}
                                  >
                                    {p.additionalInsured ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
                                        AI: {p.additionalInsuredNamed ?? ADDITIONAL_INSURED_NAME}
                                      </>
                                    ) : (
                                      <>
                                        <ShieldOff className="h-3 w-3" strokeWidth={1.75} />
                                        Additional insured missing
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[12px] text-fg-muted">
                                {p.carrier} · {p.policyNumber}
                              </p>
                              {p.notes && <p className="mt-0.5 text-[11px] text-fg-subtle">{p.notes}</p>}
                            </div>
                            <div className="text-right text-[12px] tabular-nums text-fg-muted">
                              <p>Exp {p.expirationDate}</p>
                              <p className="text-[11px] text-fg-subtle">
                                {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days remaining`}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border border-border bg-bg-elevated p-4 text-[11px] leading-relaxed text-fg-subtle">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-fg-muted">
                  <Shield className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Why this matters
                </p>
                Keeping current COIs with Split Rock named as additional insured protects your own
                policy and job-site exposure. Expired or incomplete certificates should block
                mobilization until corrected.
              </div>
            </>
          ) : (
            <p className="border border-border px-4 py-12 text-center text-[13px] text-fg-muted">
              Select or add a subcontractor to manage insurance.
            </p>
          )}
        </div>
      </div>

      {/* Record COI modal-ish panel */}
      {showAddPolicy && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md border border-border bg-bg p-5 shadow-lg">
            <h3 className="text-[15px] font-medium">Record certificate of insurance</h3>
            <p className="mt-1 text-[12px] text-fg-muted">
              {selectedVendor?.company} — attach or enter policy details from the COI PDF.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-[11px]">Policy type</Label>
                <select
                  className="mt-1 flex h-9 w-full border border-border bg-bg px-3 text-[13px]"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as InsurancePolicyType)}
                >
                  {POLICY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[11px]">Carrier</Label>
                <Input className="mt-1" value={formCarrier} onChange={(e) => setFormCarrier(e.target.value)} placeholder="Carrier name" />
              </div>
              <div>
                <Label className="text-[11px]">Policy number</Label>
                <Input className="mt-1" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} placeholder="Policy #" />
              </div>
              <div>
                <Label className="text-[11px]">Expiration date</Label>
                <Input className="mt-1" type="date" value={formExp} onChange={(e) => setFormExp(e.target.value)} />
              </div>
              {formType === "general_liability" && (
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={formAI} onChange={(e) => setFormAI(e.target.checked)} />
                  Additional insured: {ADDITIONAL_INSURED_NAME}
                </label>
              )}
              <div>
                <Label className="text-[11px]">COI file (local reference)</Label>
                <Input
                  className="mt-1"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFormFileName(e.target.files?.[0]?.name ?? null)}
                />
                {formFileName && <p className="mt-1 text-[11px] text-fg-subtle">Attached: {formFileName}</p>}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddPolicy(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={recordCoi} disabled={!formCarrier || !formNumber || !formExp}>
                Save certificate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddVendor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md border border-border bg-bg p-5 shadow-lg">
            <h3 className="text-[15px] font-medium">Add subcontractor</h3>
            <p className="mt-1 text-[12px] text-fg-muted">They'll appear in the portal so you can collect COIs before work starts.</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-[11px]">Company</Label>
                <Input className="mt-1" value={vCompany} onChange={(e) => setVCompany(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Trade</Label>
                <Input className="mt-1" value={vTrade} onChange={(e) => setVTrade(e.target.value)} placeholder="Framing, Electrical…" />
              </div>
              <div>
                <Label className="text-[11px]">Contact</Label>
                <Input className="mt-1" value={vContact} onChange={(e) => setVContact(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Email</Label>
                <Input className="mt-1" type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Phone</Label>
                <Input className="mt-1" value={vPhone} onChange={(e) => setVPhone(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddVendor(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={addVendor} disabled={!vCompany.trim()}>
                Add sub
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreDot({ score, large }: { score: number; large?: boolean }) {
  const color =
    score >= 85 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-red-600";
  return (
    <span
      className={cn("inline-block rounded-full", color, large ? "h-3 w-3" : "h-2 w-2")}
      title={`${score}%`}
    />
  );
}
