import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileUp,
  Plus,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldOff,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COI_REQUIREMENTS,
  SAMPLE_VENDORS,
  daysUntil,
  policiesNeedingAttention,
  refreshPolicyStatuses,
  samplePolicies,
  simulateExtractFromUpload,
  vendorComplianceScore,
  verifyCoi,
} from "@/lib/sub-insurance";
import {
  SAMPLE_ACORD_25_TEXT,
  acordPoliciesForVendor,
  parseAcord25Text,
  type Acord25ParseResult,
} from "@/lib/acord-25";
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

const ADDITIONAL_INSURED_NAME = COI_REQUIREMENTS.additionalInsuredName;

function statusBadgeVariant(status: CoiStatus | string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "valid" || status === "active" || status === "passed") return "success";
  if (status === "expiring_soon" || status === "pending_review" || status === "needs_review") return "warning";
  if (status === "expired" || status === "missing" || status === "failed") return "destructive";
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
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAcord, setShowAcord] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const [formType, setFormType] = useState<InsurancePolicyType>("general_liability");
  const [formCarrier, setFormCarrier] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formExp, setFormExp] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [formAI, setFormAI] = useState(true);
  const [formFileName, setFormFileName] = useState<string | null>(null);

  const [acordText, setAcordText] = useState("");
  const [acordResult, setAcordResult] = useState<Acord25ParseResult | null>(null);

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
    : { score: 0, missing: [], expiring: [], expired: [], failedVerification: [] };

  function recordCoi() {
    if (!selectedVendorId || !formCarrier || !formNumber || !formExp) return;
    const limitNum = formLimit ? Number(formLimit.replace(/[^0-9.]/g, "")) : undefined;
    const draft: InsurancePolicy = {
      id: `pol-${Date.now()}`,
      vendorId: selectedVendorId,
      type: formType,
      carrier: formCarrier.trim(),
      policyNumber: formNumber.trim(),
      expirationDate: formExp,
      status: "pending_review",
      additionalInsured: formType === "general_liability" ? formAI : false,
      additionalInsuredNamed:
        formType === "general_liability" && formAI ? ADDITIONAL_INSURED_NAME : undefined,
      coverageLimit: Number.isFinite(limitNum) ? limitNum : undefined,
      certificateUrl: formFileName ? `local://${formFileName}` : undefined,
      notes: formFileName ? `COI on file: ${formFileName}` : undefined,
    };
    const verification = verifyCoi(draft);
    const [enriched] = refreshPolicyStatuses([{ ...draft, verification }]);
    setPolicies((prev) =>
      refreshPolicyStatuses([
        enriched,
        ...prev.filter((p) => !(p.vendorId === selectedVendorId && p.type === formType)),
      ]),
    );
    setExpandedPolicyId(enriched.id);
    setShowAddPolicy(false);
    setFormCarrier("");
    setFormNumber("");
    setFormExp("");
    setFormLimit("");
    setFormFileName(null);
    setFormAI(true);
  }

  function runAcordParse() {
    const result = parseAcord25Text(acordText);
    setAcordResult(result);
  }

  function applyAcordPolicies() {
    if (!selectedVendorId || !acordResult) return;
    const drafts = acordPoliciesForVendor(
      acordResult,
      selectedVendorId,
      formFileName ? `local://${formFileName}` : "local://acord-25-paste.txt",
    );
    if (drafts.length === 0) return;
    const types = new Set(drafts.map((d) => d.type));
    setPolicies((prev) => {
      const kept = prev.filter((p) => !(p.vendorId === selectedVendorId && types.has(p.type)));
      return refreshPolicyStatuses([...drafts, ...kept]);
    });
    setExpandedPolicyId(drafts[0]?.id ?? null);
    setShowAcord(false);
    setAcordResult(null);
    setAcordText("");
  }

  function reVerify(id: string) {
    setVerifyingId(id);
    window.setTimeout(() => {
      setPolicies((prev) =>
        refreshPolicyStatuses(
          prev.map((p) => {
            if (p.id !== id) return p;
            return { ...p, verification: verifyCoi(p) };
          }),
        ),
      );
      setExpandedPolicyId(id);
      setVerifyingId(null);
    }, 400);
  }

  function onFileSelected(file: File | undefined) {
    if (!file) {
      setFormFileName(null);
      return;
    }
    setFormFileName(file.name);
    if (file.type.startsWith("text") || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        setAcordText(text);
        const result = parseAcord25Text(text);
        setAcordResult(result);
        setShowAcord(true);
        setShowAddPolicy(false);
      };
      reader.readAsText(file);
      return;
    }
    const extracted = simulateExtractFromUpload(file.name);
    if (extracted.type) setFormType(extracted.type);
    if (extracted.carrier) setFormCarrier(extracted.carrier);
    if (extracted.policyNumber) setFormNumber(extracted.policyNumber);
    if (extracted.expirationDate) setFormExp(extracted.expirationDate);
    if (extracted.coverageLimit != null) setFormLimit(String(extracted.coverageLimit));
    if (extracted.additionalInsured != null) setFormAI(!!extracted.additionalInsured);
  }

  function addVendor() {
    if (!vCompany.trim()) return;
    const id = `v-${Date.now()}`;
    setVendors((prev) => [
      ...prev,
      {
        id,
        company: vCompany.trim(),
        trade: vTrade.trim() || "General",
        contact: vContact.trim(),
        email: vEmail.trim(),
        phone: vPhone.trim(),
        preferred: false,
      },
    ]);
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
        description="ACORD 25 parsing + automated verification — limits, additional insured, expiration, required coverages."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddVendor(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Add sub
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAcord(true)}
              disabled={!selectedVendorId}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Parse ACORD 25
            </Button>
            <Button size="sm" onClick={() => setShowAddPolicy(true)} disabled={!selectedVendorId}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Record COI
            </Button>
          </div>
        }
      />

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
              const overall = p.verification?.overall;
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[12px]">
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={() => {
                      if (p.vendorId) setSelectedVendorId(p.vendorId);
                      setExpandedPolicyId(p.id);
                    }}
                  >
                    {v?.company ?? "Unknown"} · {typeLabel(p.type)}
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(String(p.status))}>{statusLabel(String(p.status))}</Badge>
                    {overall && overall !== "passed" && (
                      <Badge variant={statusBadgeVariant(overall)}>verify: {statusLabel(overall)}</Badge>
                    )}
                    <span className="tabular-nums text-fg-muted">
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`} · {p.expirationDate}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
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
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreDot score={score.score} large />
                    <span className="text-[18px] font-medium tabular-nums">{score.score}</span>
                  </div>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-fg-subtle">
                  Parse an ACORD 25 to import GL, auto, umbrella, and WC in one pass, then auto-verify each line.
                  Certificate holder / description of operations drives additional insured detection for{" "}
                  <strong className="text-fg-muted">{ADDITIONAL_INSURED_NAME}</strong>.
                </p>
              </div>

              <div className="border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <p className="text-[12px] font-medium">Certificates on file</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAcord(true)}>
                      <FileText className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                      ACORD 25
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddPolicy(true)}>
                      <FileUp className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                      Manual
                    </Button>
                  </div>
                </div>
                {vendorPolicies.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[13px] text-fg-muted">
                    No COIs recorded. Parse an ACORD 25 or enter a certificate manually.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {vendorPolicies.map((p) => {
                      const days = daysUntil(p.expirationDate);
                      const open = expandedPolicyId === p.id;
                      const v = p.verification;
                      return (
                        <li key={p.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[13px] font-medium">{typeLabel(p.type)}</span>
                                <Badge variant={statusBadgeVariant(String(p.status))}>
                                  {statusLabel(String(p.status))}
                                </Badge>
                                {v && (
                                  <Badge variant={statusBadgeVariant(v.overall)}>
                                    {statusLabel(v.overall)} · {v.score}%
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-[12px] text-fg-muted">
                                {p.carrier} · {p.policyNumber}
                                {p.coverageLimit != null
                                  ? ` · $${p.coverageLimit.toLocaleString()} limit`
                                  : ""}
                              </p>
                              {p.notes && <p className="mt-0.5 text-[11px] text-fg-subtle">{p.notes}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1 text-right text-[12px] tabular-nums text-fg-muted">
                              <p>Exp {p.expirationDate}</p>
                              <p className="text-[11px] text-fg-subtle">
                                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                              </p>
                              <div className="mt-1 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px]"
                                  onClick={() => setExpandedPolicyId(open ? null : p.id)}
                                >
                                  {open ? "Hide checks" : "View checks"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px]"
                                  disabled={verifyingId === p.id}
                                  onClick={() => reVerify(p.id)}
                                >
                                  <ScanSearch className="mr-1 h-3 w-3" strokeWidth={1.75} />
                                  {verifyingId === p.id ? "Running…" : "Re-verify"}
                                </Button>
                              </div>
                            </div>
                          </div>
                          {open && v && (
                            <div className="mt-3 border border-border bg-bg p-3">
                              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle">
                                Automated verification · {new Date(v.verifiedAt).toLocaleString()}
                              </p>
                              <ul className="space-y-2">
                                {v.checks.map((c) => (
                                  <li key={c.id} className="flex gap-2 text-[12px]">
                                    {c.result === "pass" && (
                                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={1.75} />
                                    )}
                                    {c.result === "warn" && (
                                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={1.75} />
                                    )}
                                    {c.result === "fail" && (
                                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" strokeWidth={1.75} />
                                    )}
                                    <div>
                                      <p className="font-medium text-fg">{c.label}</p>
                                      <p className="text-fg-muted">{c.detail}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border border-border bg-bg-elevated p-4 text-[11px] leading-relaxed text-fg-subtle">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-fg-muted">
                  <Shield className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ACORD 25 parsing
                </p>
                Paste OCR or text-extracted certificate content. The parser reads coverage rows (GL, auto,
                umbrella, WC), limits, dates, insurer letters, additional insured checkboxes, and
                Description of Operations / Certificate Holder for AI language. Binary PDF OCR is not
                bundled — export text or paste from your scanner workflow.
              </div>
            </>
          ) : (
            <p className="border border-border px-4 py-12 text-center text-[13px] text-fg-muted">
              Select or add a subcontractor to manage insurance.
            </p>
          )}
        </div>
      </div>

      {/* ACORD 25 parser modal */}
      {showAcord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden border border-border bg-bg shadow-lg">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-medium">Parse ACORD 25</h3>
              <p className="mt-1 text-[12px] text-fg-muted">
                {selectedVendor?.company} — paste certificate text or load the sample form.
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAcordText(SAMPLE_ACORD_25_TEXT);
                    setAcordResult(parseAcord25Text(SAMPLE_ACORD_25_TEXT));
                  }}
                >
                  Load sample certificate
                </Button>
                <Button size="sm" onClick={runAcordParse} disabled={acordText.trim().length < 20}>
                  Parse text
                </Button>
              </div>
              <div>
                <Label className="text-[11px]">Certificate text (OCR / paste)</Label>
                <textarea
                  className="mt-1 min-h-[180px] w-full border border-border bg-bg px-3 py-2 font-mono text-[11px] leading-relaxed"
                  value={acordText}
                  onChange={(e) => setAcordText(e.target.value)}
                  placeholder="Paste ACORD 25 text here…"
                />
              </div>
              {acordResult && (
                <div className="border border-border bg-bg-elevated p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <Badge variant={acordResult.isAcord25 ? "success" : "warning"}>
                      {acordResult.isAcord25 ? "ACORD 25 detected" : "Uncertain form"}
                    </Badge>
                    <span className="text-fg-muted">Confidence {acordResult.confidence}%</span>
                    {acordResult.formEdition && (
                      <span className="text-fg-subtle">Edition {acordResult.formEdition}</span>
                    )}
                  </div>
                  {(acordResult.insuredName || acordResult.certificateHolder) && (
                    <p className="mt-2 text-[12px] text-fg-muted">
                      {acordResult.insuredName && <>Insured: {acordResult.insuredName}</>}
                      {acordResult.insuredName && acordResult.certificateHolder && " · "}
                      {acordResult.certificateHolder && <>Holder: {acordResult.certificateHolder}</>}
                    </p>
                  )}
                  {acordResult.additionalInsuredMentioned && (
                    <p className="mt-1 flex items-center gap-1 text-[12px] text-fg-muted">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      AI language: {acordResult.additionalInsuredNamed ?? "(see description)"}
                    </p>
                  )}
                  <ul className="mt-3 divide-y divide-border border border-border">
                    {acordResult.coverages.map((c) => (
                      <li key={c.type} className="px-3 py-2 text-[12px]">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-fg-muted">
                          {" · "}{c.policyNumber ?? "no policy #"}
                          {c.expirationDate ? ` · exp ${c.expirationDate}` : ""}
                          {c.eachOccurrence != null
                            ? ` · $${c.eachOccurrence.toLocaleString()}`
                            : ""}
                          {c.additionalInsuredChecked ? " · AI box" : ""}
                        </span>
                      </li>
                    ))}
                    {acordResult.coverages.length === 0 && (
                      <li className="px-3 py-3 text-fg-muted">No coverage rows extracted.</li>
                    )}
                  </ul>
                  {acordResult.warnings.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] text-fg-subtle">
                      {acordResult.warnings.map((w) => (
                        <li key={w}>• {w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAcord(false);
                  setAcordResult(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={applyAcordPolicies}
                disabled={!acordResult || acordResult.policies.length === 0}
              >
                Import {acordResult?.policies.length ?? 0} coverage
                {(acordResult?.policies.length ?? 0) === 1 ? "" : "s"} & verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddPolicy && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto border border-border bg-bg p-5 shadow-lg">
            <h3 className="text-[15px] font-medium">Record certificate of insurance</h3>
            <p className="mt-1 text-[12px] text-fg-muted">
              {selectedVendor?.company} — or use Parse ACORD 25 for multi-line import.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-[11px]">File (.txt opens ACORD parser)</Label>
                <Input
                  className="mt-1"
                  type="file"
                  accept=".pdf,image/*,.txt,text/plain"
                  onChange={(e) => onFileSelected(e.target.files?.[0])}
                />
              </div>
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
                <Input className="mt-1" value={formCarrier} onChange={(e) => setFormCarrier(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Policy number</Label>
                <Input className="mt-1" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Expiration date</Label>
                <Input className="mt-1" type="date" value={formExp} onChange={(e) => setFormExp(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Coverage limit (USD)</Label>
                <Input className="mt-1" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} />
              </div>
              {formType === "general_liability" && (
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={formAI} onChange={(e) => setFormAI(e.target.checked)} />
                  Additional insured: {ADDITIONAL_INSURED_NAME}
                </label>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddPolicy(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={recordCoi} disabled={!formCarrier || !formNumber || !formExp}>
                Save & auto-verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddVendor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md border border-border bg-bg p-5 shadow-lg">
            <h3 className="text-[15px] font-medium">Add subcontractor</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-[11px]">Company</Label>
                <Input className="mt-1" value={vCompany} onChange={(e) => setVCompany(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Trade</Label>
                <Input className="mt-1" value={vTrade} onChange={(e) => setVTrade(e.target.value)} />
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
  const color = score >= 85 ? "bg-emerald-600" : score >= 60 ? "bg-amber-500" : "bg-red-600";
  return (
    <span
      className={cn("inline-block rounded-full", color, large ? "h-3 w-3" : "h-2 w-2")}
      title={`${score}%`}
    />
  );
}
