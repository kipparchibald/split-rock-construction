/**
 * Fill a residential construction agreement from job inputs.
 * Buyer + plan + cost breakdown → contract body ready for counsel / Form Simplicity PDF.
 * Numbers are computed; legal review still required before signature.
 */

import { COMPANY } from "@/lib/company";

export const DEFAULT_CONTINGENCY_PCT = 0.05;
export const DEFAULT_PROFIT_PCT = 0.1;
export const MOBILIZATION_DEPOSIT = 10_000;

export const DRAW_SCHEDULE = [
  { name: "Agreement, permit, and mobilization", pct: 0.1 },
  { name: "Foundation complete", pct: 0.1 },
  { name: "Dried-in / weather-tight", pct: 0.2 },
  { name: "MEP rough-in and insulation", pct: 0.2 },
  { name: "Finishes substantial", pct: 0.35 },
  { name: "CO, punch, waivers, §45-525(3), unused contingency credit", pct: 0.05 },
] as const;

export type CostLineInput = {
  label: string;
  amount: number;
  kind?: "cost" | "contingency" | "profit" | "exclude";
};

export type ContractJobInput = {
  projectId: string;
  projectName: string;
  owners: string[];
  ownerEmail?: string;
  propertyAddress: string;
  legalDescription?: string;
  planTitle: string;
  planDate?: string;
  planAuthor?: string;
  sqft?: number;
  startDate?: string;
  endDate?: string;
  costOfWork?: number;
  lines?: CostLineInput[];
  contingencyPct?: number;
  profitPct?: number;
  landPaid?: number;
  landNote?: string;
  dualCapacity?: boolean;
};

export type FilledContractMoney = {
  costOfWork: number;
  contingency: number;
  profitAndOverhead: number;
  contractPrice: number;
  drawBase: number;
  deposit: number;
  draws: { name: string; pct: number; amount: number }[];
};

export type FilledContract = {
  projectId: string;
  title: string;
  owners: string[];
  money: FilledContractMoney;
  missing: string[];
  ready: boolean;
  agreementBody: string;
  exhibitB: string;
};

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeMoney(input: ContractJobInput): FilledContractMoney {
  const lines = input.lines ?? [];
  const costFromLines = lines
    .filter((l) => (l.kind ?? "cost") === "cost")
    .reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0);
  const costOfWork = round2(
    input.costOfWork && input.costOfWork > 0 ? input.costOfWork : costFromLines,
  );
  const cPct = input.contingencyPct ?? DEFAULT_CONTINGENCY_PCT;
  const pPct = input.profitPct ?? DEFAULT_PROFIT_PCT;
  const contingency = round2(costOfWork * cPct);
  const profitAndOverhead = round2(costOfWork * pPct);
  const contractPrice = round2(costOfWork + contingency + profitAndOverhead);
  const drawBase = round2(costOfWork + profitAndOverhead);
  const draws = DRAW_SCHEDULE.map((d) => ({
    name: d.name,
    pct: d.pct,
    amount: round2(drawBase * d.pct),
  }));
  return {
    costOfWork,
    contingency,
    profitAndOverhead,
    contractPrice,
    drawBase,
    deposit: MOBILIZATION_DEPOSIT,
    draws,
  };
}

export function missingInputs(input: ContractJobInput): string[] {
  const miss: string[] = [];
  if (!input.owners.length || input.owners.every((o) => !o.trim())) miss.push("buyer / owners");
  if (!input.propertyAddress.trim()) miss.push("property address");
  if (!input.planTitle.trim()) miss.push("plan");
  const m = computeMoney(input);
  if (!(m.costOfWork > 0)) miss.push("cost breakdown");
  return miss;
}

export function fillContract(input: ContractJobInput): FilledContract {
  const moneyStack = computeMoney(input);
  const missing = missingInputs(input);
  const owners = input.owners.filter(Boolean);
  const ownerLine = owners.join(" and ");
  const planBit = [input.planTitle, input.planDate, input.planAuthor]
    .filter(Boolean)
    .join(" — ");
  const land =
    input.landPaid && input.landPaid > 0
      ? `Land of ${money(input.landPaid)} closed separately and is not part of the Contract Price.${input.landNote ? ` ${input.landNote}` : ""}`
      : input.landNote ?? "Land is not part of the Contract Price unless listed in Exhibit B.";

  const drawLines = moneyStack.draws
    .map((d, i) => `${i + 1}. ${d.name} — ${(d.pct * 100).toFixed(0)}% — ${money(d.amount)}`)
    .join("\n");

  const exhibitLines = (input.lines ?? [])
    .filter((l) => (l.kind ?? "cost") !== "exclude")
    .map((l) => `- ${l.label}: ${money(l.amount)}`)
    .join("\n");

  const dual =
    input.dualCapacity !== false
      ? `Kipp Archibald, qualifying party of Contractor, also acted as the real-estate licensee in any related lot sale through Archibald-Bagley Real Estate. That brokerage relationship, if any, ended at lot closing. Owner acknowledges this dual role. Construction draws shall be paid only to ${COMPANY.legalName} and shall never be deposited to a brokerage trust account.`
      : `No dual-capacity lot representation applies to this Project.`;

  const agreementBody = `# RESIDENTIAL CONSTRUCTION AGREEMENT
${input.projectName}

This Agreement is entered into as of ______________, 20__ (the "Effective Date") by and between ${COMPANY.legalName}, an Idaho limited liability company, Idaho contractor license no. ${COMPANY.idahoContractorRegistration} ("Contractor"), and ${ownerLine} (collectively, "Owner").

Kipp Archibald is the qualifying party and authorized signer for Contractor. Kyle Christensen may supervise field work and is not a party to this Agreement.

## 1. Property
${input.propertyAddress}${input.legalDescription ? `\n${input.legalDescription}` : ""}
${land}

## 2. Scope of Work
Contractor shall construct the Work described in the plans titled "${planBit || input.planTitle}" attached as Exhibit A, and the cost breakdown attached as Exhibit B.${input.sqft ? ` Approximate heated area: ${input.sqft.toLocaleString()} square feet.` : ""}

## 3. Contract Price
The Contract Price is ${money(moneyStack.contractPrice)}, composed as follows:
- Cost of Work: ${money(moneyStack.costOfWork)}
- Owner contingency (${((input.contingencyPct ?? DEFAULT_CONTINGENCY_PCT) * 100).toFixed(0)}% of Cost of Work): ${money(moneyStack.contingency)}
- Contractor profit and overhead (${((input.profitPct ?? DEFAULT_PROFIT_PCT) * 100).toFixed(0)}% of Cost of Work): ${money(moneyStack.profitAndOverhead)}
Total Contract Price: ${money(moneyStack.contractPrice)}
Draws 1 through 5 are calculated on a Draw Base of ${money(moneyStack.drawBase)} (Cost of Work plus profit and overhead). Contingency is not advanced in Draws 1 through 5 and is true-up at Draw 6.

## 4. Payment and Draw Schedule
Owner shall pay a mobilization deposit of ${money(moneyStack.deposit)} on signing, credited against Draw 1. Thereafter Owner shall pay:
${drawLines}
Each draw is due within five (5) business days of Contractor's written request with reasonable supporting documentation.

## 5. Line-Item Reallocation
Contractor may reallocate funds among line items so long as the total Contract Price does not increase. Any reallocation exceeding five percent (5%) of a single line item shall be reported to Owner in writing within ten (10) days.

## 6. Shared Savings
Budget line items in Exhibit B are estimates. "Underage" means the difference between the budgeted amount for a line item and the actual cost incurred for that line item, calculated independently per line and excluding Contractor's fee and overhead. Savings on one line shall not be offset by overruns on another.
If actual costs on a line come in below budget, the underage is shared equally: fifty percent (50%) retained by Contractor, fifty percent (50%) credited to Owner against subsequent draws or final payment. Contractor's supervision line and unused Owner contingency are excluded from the shared-savings split.
Contractor shall provide actual subcontractor and supplier invoices supporting each underage calculation within ten (10) days. Owner may request competing bids under a written confidentiality acknowledgment; those remain Contractor's confidential information.

## 7. Change Orders
Any change to scope, materials, schedule, or Contract Price requires a written change order signed by both parties before the changed work is performed.

## 8. Termination for Convenience
Either party may terminate this Agreement for convenience, without cause, by giving the other party at least fourteen (14) days' prior written notice. Upon the effective date, Owner shall pay Contractor for all Work properly performed and materials delivered through that date, plus reasonable demobilization, preservation, and wind-down costs actually incurred, less amounts already paid. That payment is Contractor's sole remedy under this section. Neither party is liable for lost profits on unperformed Work. This section does not limit termination for material breach.

## 9. Termination for Cause
Either party may terminate for material breach if the other fails to cure within fourteen (14) days after written notice specifying the breach.

## 10. Dual-Capacity Disclosure
${dual}

## 11. Idaho Code § 45-525
Before signing, Contractor has provided the initial disclosure required by Idaho Code § 45-525(2). Before final payment, Contractor shall provide the completion disclosure listing subcontractors, materialmen, and rental-equipment providers as required by Idaho Code § 45-525(3).

## 12. Contingency
The Owner contingency of ${money(moneyStack.contingency)} is reserved for unforeseen conditions and work not covered by a formal change order. Unused contingency is credited to Owner on Draw 6 and is not shared under Section 6.

## 13. Schedule
Target start: ${input.startDate ?? "________________"}. Target substantial completion: ${input.endDate ?? "________________"}. Dates are targets, not guarantees.

## 14. Warranties
Contractor warrants the Work against defects in workmanship for one (1) year from substantial completion. Manufacturer warranties pass through to Owner.

## 15. Dispute Resolution
Good-faith negotiation, then non-binding mediation in Jefferson County or Bonneville County, Idaho, before suit. Idaho law. Venue in Jefferson County, Idaho.

## 16. Entire Agreement
This Agreement and Exhibits A–D are the entire agreement. Amendments must be in writing and signed by both parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.

OWNER: ${owners.map((o) => `${o}  Signature ______________  Date ________`).join("\n")}

CONTRACTOR: ${COMPANY.legalName}, by Kipp Archibald, Qualifying Party
Signature ______________  Date ________
`;

  const exhibitB = `# Exhibit B — Cost breakdown
${input.projectName}
${exhibitLines || `- Cost of Work: ${money(moneyStack.costOfWork)}`}
- Owner contingency: ${money(moneyStack.contingency)}
- Profit and overhead: ${money(moneyStack.profitAndOverhead)}
- Contract Price: ${money(moneyStack.contractPrice)}
- Draw Base: ${money(moneyStack.drawBase)}
`;

  return {
    projectId: input.projectId,
    title: `${input.projectName} — construction agreement`,
    owners,
    money: moneyStack,
    missing,
    ready: missing.length === 0,
    agreementBody,
    exhibitB,
  };
}

/** Map a live job (client + project + budget / bid lines) into generator input. */
export function jobToContractInput(opts: {
  projectId: string;
  projectName: string;
  address: string;
  clientName: string;
  clientEmail?: string;
  description?: string;
  sqft?: number;
  startDate?: string;
  endDate?: string;
  planTitle?: string;
  planDate?: string;
  planAuthor?: string;
  budgetLines?: { category: string; budgeted: number }[];
  bidLines?: { label: string; amount: number }[];
  landPaid?: number;
  landNote?: string;
}): ContractJobInput {
  const owners = opts.clientName
    .split(/\s*(?:&| and )\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const rawLines =
    (opts.budgetLines?.length
      ? opts.budgetLines.map((l) => ({ label: l.category, amount: l.budgeted }))
      : opts.bidLines?.map((l) => ({ label: l.label, amount: l.amount }))) ?? [];
  const lines: CostLineInput[] = rawLines.map((l) => {
    const t = l.label.toLowerCase();
    if (/contingenc/.test(t)) return { ...l, kind: "contingency" as const };
    if (/\bp&o\b|profit|overhead/.test(t)) return { ...l, kind: "profit" as const };
    return { ...l, kind: "cost" as const };
  });
  const costOfWork = lines.filter((l) => l.kind === "cost").reduce((s, l) => s + l.amount, 0);
  return {
    projectId: opts.projectId,
    projectName: opts.projectName,
    owners,
    ownerEmail: opts.clientEmail,
    propertyAddress: opts.address,
    planTitle: opts.planTitle ?? opts.description ?? "",
    planDate: opts.planDate,
    planAuthor: opts.planAuthor,
    sqft: opts.sqft,
    startDate: opts.startDate,
    endDate: opts.endDate,
    costOfWork,
    lines,
    landPaid: opts.landPaid,
    landNote: opts.landNote,
    dualCapacity: true,
  };
}
