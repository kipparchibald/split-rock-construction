/**
 * ACORD 25 (Certificate of Liability Insurance) text parser.
 * Accepts OCR / copy-paste / text-extracted PDF content and maps to policy rows.
 * Not a substitute for reading the actual certificate or confirming endorsements with the carrier.
 */

import type { InsurancePolicy, InsurancePolicyType } from "@/data/types";
import { COI_REQUIREMENTS, matchesAdditionalInsured } from "@/lib/sub-insurance";

export interface Acord25CoverageLine {
  type: InsurancePolicyType;
  label: string;
  insurerLetter?: string;
  policyNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  /** Primary limit used for compliance (occurrence / CSL / each accident) */
  eachOccurrence?: number;
  generalAggregate?: number;
  productsAggregate?: number;
  additionalInsuredChecked: boolean;
  waiverOfSubrogationChecked: boolean;
  rawLimitHints: string[];
}

export interface Acord25ParseResult {
  isAcord25: boolean;
  confidence: number; // 0–100
  formEdition?: string;
  producer?: string;
  insuredName?: string;
  insurers: { letter: string; name: string; naic?: string }[];
  certificateHolder?: string;
  descriptionOfOperations?: string;
  coverages: Acord25CoverageLine[];
  additionalInsuredMentioned: boolean;
  additionalInsuredNamed?: string;
  warnings: string[];
  /** Ready-to-save policy drafts (one per detected coverage with a policy # or type) */
  policies: Partial<InsurancePolicy>[];
}

const MONEY_RE = /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\d+)\s*(?:per\s+occurrence|each\s+occurrence|csl|combined\s+single|each\s+accident)?/gi;

function parseMoney(raw: string): number | undefined {
  const cleaned = raw.replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // Heuristic: bare "1" or "2" on certificates often means millions
  if (n > 0 && n < 20) return n * 1_000_000;
  if (n >= 100 && n < 10_000) return n * 1_000; // e.g. 1000 → 1,000,000 sometimes written without commas poorly
  return n;
}

function extractAllMoney(block: string): number[] {
  const out: number[] = [];
  const re = /\$?\s*([0-9]{1,3}(?:,[0-9]{3})+|\d{4,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const v = parseMoney(m[1]);
    if (v && v >= 50_000) out.push(v);
  }
  return out;
}

/** Normalize common date forms to YYYY-MM-DD */
export function parseAcordDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  // ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // MM/DD/YYYY or M/D/YY
  const us = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (us) {
    let y = Number(us[3]);
    if (y < 100) y += 2000;
    const mo = us[1].padStart(2, "0");
    const da = us[2].padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  // Month DD, YYYY
  const named = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (named) {
    const months: Record<string, string> = {
      jan: "01",
      january: "01",
      feb: "02",
      february: "02",
      mar: "03",
      march: "03",
      apr: "04",
      april: "04",
      may: "05",
      jun: "06",
      june: "06",
      jul: "07",
      july: "07",
      aug: "08",
      august: "08",
      sep: "09",
      sept: "09",
      september: "09",
      oct: "10",
      october: "10",
      nov: "11",
      november: "11",
      dec: "12",
      december: "12",
    };
    const mo = months[named[1].toLowerCase()];
    if (mo) return `${named[3]}-${mo}-${named[2].padStart(2, "0")}`;
  }
  return undefined;
}

function sectionAfter(text: string, startRe: RegExp, endRes: RegExp[]): string {
  const start = text.search(startRe);
  if (start < 0) return "";
  const from = text.slice(start);
  let end = from.length;
  for (const er of endRes) {
    const m = from.search(er);
    if (m > 20 && m < end) end = m;
  }
  return from.slice(0, end);
}

function detectCheckbox(block: string, labels: string[]): boolean {
  const lower = block.toLowerCase();
  for (const label of labels) {
    const idx = lower.indexOf(label.toLowerCase());
    if (idx < 0) continue;
    const window = lower.slice(Math.max(0, idx - 12), idx + label.length + 12);
    if (/[x✓✔☒]|\byes\b|\bchecked\b|\btrue\b/.test(window)) return true;
    // "ADDL INSR  Y" style
    if (/\by\b|\byes\b/.test(window.replace(label.toLowerCase(), ""))) return true;
  }
  // Explicit phrases
  if (/additional\s+insured[^\n]{0,40}(yes|x|✓)/i.test(block)) return true;
  if (/\bAI\b[^\n]{0,10}(yes|x|✓)/i.test(block)) return true;
  return false;
}

function extractPolicyNumber(block: string): string | undefined {
  const patterns = [
    /policy\s*(?:number|#|no\.?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-]{4,})/i,
    /\bpol(?:icy)?\s*#\s*([A-Z0-9][A-Z0-9\-]{4,})/i,
    /\b([A-Z]{2,5}[- ]?[A-Z]{0,3}\d{4,}[A-Z0-9\-]*)\b/,
  ];
  for (const p of patterns) {
    const m = block.match(p);
    if (m?.[1] && !/^(ACORD|NAIC|FORM)$/i.test(m[1])) return m[1].trim();
  }
  return undefined;
}

function extractDatePair(block: string): { effective?: string; expiration?: string } {
  const eff =
    block.match(/(?:eff(?:ective)?|inception)\s*(?:date)?\s*[:.]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i)?.[1] ??
    block.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–to]+\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
  const exp =
    block.match(/(?:exp(?:iration|iry)?|expires)\s*(?:date)?\s*[:.]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i)?.[1] ??
    block.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[-–to]+\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[2];
  return {
    effective: parseAcordDate(eff),
    expiration: parseAcordDate(exp),
  };
}

function extractInsurers(text: string): { letter: string; name: string; naic?: string }[] {
  const insurers: { letter: string; name: string; naic?: string }[] = [];
  // "INSURER A: Travelers Indemnity Company  NAIC # 25658"
  const re =
    /insurer\s*([A-F])\s*[:.\-]?\s*([A-Za-z0-9][^\n]{2,60}?)(?:\s+NAIC\s*#?\s*(\d{3,6}))?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    insurers.push({
      letter: m[1].toUpperCase(),
      name: m[2].replace(/\s+/g, " ").trim(),
      naic: m[3],
    });
  }
  return insurers;
}

function coverageBlock(
  text: string,
  type: InsurancePolicyType,
  headings: RegExp,
  nextHeadings: RegExp[],
): Acord25CoverageLine | null {
  const block = sectionAfter(text, headings, nextHeadings);
  if (!block || block.length < 8) return null;

  // Must look like a coverage row — skip empty templates
  const hasPolicyCue =
    /policy|eff|exp|\d{1,2}[\/\-]\d{1,2}|\$[\d,]+|occurrence|aggregate|statutory|each accident/i.test(
      block,
    );
  if (!hasPolicyCue) return null;

  const money = extractAllMoney(block);
  const dates = extractDatePair(block);
  const policyNumber = extractPolicyNumber(block);
  const letter = block.match(/insurer\s*letter\s*[:.]?\s*([A-F])/i)?.[1]?.toUpperCase()
    ?? block.match(/\b([A-F])\b\s*(?:insurer)?/)?.[1];

  const ai = detectCheckbox(block, ["addl insr", "additional insured", "addl. insr", "ai"]);
  const wos = detectCheckbox(block, ["subr wvd", "waiver of subrogation", "subrogation waived"]);

  let eachOccurrence = money[0];
  let generalAggregate = money[1];
  let productsAggregate = money[2];

  const occMatch = block.match(/(?:each\s+occurrence|per\s+occurrence|combined\s+single\s+limit|csl|each\s+accident)[^\d$]{0,12}(\$?[\d,]+)/i);
  if (occMatch) eachOccurrence = parseMoney(occMatch[1]) ?? eachOccurrence;

  const aggMatch = block.match(/(?:general\s+aggregate)[^\d$]{0,12}(\$?[\d,]+)/i);
  if (aggMatch) generalAggregate = parseMoney(aggMatch[1]) ?? generalAggregate;

  if (type === "workers_comp" && /statutory/i.test(block) && !eachOccurrence) {
    eachOccurrence = COI_REQUIREMENTS.minLimits.workers_comp;
  }

  return {
    type,
    label:
      type === "general_liability"
        ? "Commercial General Liability"
        : type === "auto"
          ? "Automobile Liability"
          : type === "umbrella"
            ? "Umbrella / Excess"
            : type === "workers_comp"
              ? "Workers Compensation"
              : type,
    insurerLetter: letter,
    policyNumber,
    effectiveDate: dates.effective,
    expirationDate: dates.expiration,
    eachOccurrence,
    generalAggregate,
    productsAggregate,
    additionalInsuredChecked: ai,
    waiverOfSubrogationChecked: wos,
    rawLimitHints: money.map((n) => `$${n.toLocaleString()}`),
  };
}

function findDescriptionOfOperations(text: string): string | undefined {
  const block = sectionAfter(
    text,
    /description\s+of\s+operations(?:\s*\/\s*locations(?:\s*\/\s*vehicles)?)?/i,
    [/certificate\s+holder/i, /cancellation/i, /authorized\s+representative/i],
  );
  const cleaned = block
    .replace(/^description[\s\S]{0,80}?\n/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 10 ? cleaned.slice(0, 1200) : undefined;
}

function findCertificateHolder(text: string): string | undefined {
  const block = sectionAfter(text, /certificate\s+holder/i, [
    /cancellation/i,
    /authorized\s+representative/i,
    /should\s+any\s+of\s+the\s+above/i,
  ]);
  const lines = block
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^certificate\s+holder$/i.test(l));
  const name = lines[0]?.replace(/^name\s*[:.]?\s*/i, "").trim();
  return name && name.length > 2 ? name.slice(0, 200) : undefined;
}

function findInsured(text: string): string | undefined {
  const m =
    text.match(/insured\s*[:\n]\s*([A-Za-z0-9][^\n]{2,80})/i) ??
    text.match(/named\s+insured\s*[:\n]\s*([A-Za-z0-9][^\n]{2,80})/i);
  return m?.[1]?.trim();
}

function findProducer(text: string): string | undefined {
  const m = text.match(/producer\s*[:\n]\s*([A-Za-z0-9][^\n]{2,80})/i);
  return m?.[1]?.trim();
}

function resolveAdditionalInsuredName(
  description?: string,
  holder?: string,
  aiChecked?: boolean,
): { mentioned: boolean; named?: string } {
  const blob = `${description ?? ""}\n${holder ?? ""}`;
  if (matchesAdditionalInsured(blob)) {
    return { mentioned: true, named: COI_REQUIREMENTS.additionalInsuredName };
  }
  // Generic "additional insured" language with certificate holder
  if (/additional\s+insured/i.test(blob) && holder) {
    return { mentioned: true, named: holder.trim() };
  }
  if (aiChecked && holder) {
    return { mentioned: true, named: holder.trim() };
  }
  if (aiChecked) {
    return { mentioned: true, named: undefined };
  }
  return { mentioned: false };
}

/**
 * Parse free-text content from an ACORD 25 certificate (OCR, paste, or text PDF extract).
 */
export function parseAcord25Text(raw: string): Acord25ParseResult {
  const text = raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  const isAcord25 =
    /acord\s*25/i.test(text) ||
    (/certificate\s+of\s+liability\s+insurance/i.test(text) &&
      (/commercial\s+general\s+liability/i.test(text) || /general\s+liability/i.test(text)));

  let confidence = 0;
  if (/acord\s*25/i.test(text)) confidence += 35;
  if (/certificate\s+of\s+liability\s+insurance/i.test(text)) confidence += 25;
  if (/commercial\s+general\s+liability|general\s+liability/i.test(text)) confidence += 15;
  if (/workers[\s']*compensation/i.test(text)) confidence += 10;
  if (/certificate\s+holder/i.test(text)) confidence += 10;
  if (/description\s+of\s+operations/i.test(text)) confidence += 5;

  const formEdition = text.match(/ACORD\s*25\s*(\d{4}\s*\/\s*\d{2}|\d{2}\s*\/\s*\d{4})/i)?.[1]?.replace(/\s/g, "");

  const insurers = extractInsurers(text);
  const producer = findProducer(text);
  const insuredName = findInsured(text);
  const descriptionOfOperations = findDescriptionOfOperations(text);
  const certificateHolder = findCertificateHolder(text);

  const gl = coverageBlock(
    text,
    "general_liability",
    /commercial\s+general\s+liability|general\s+liability/i,
    [/automobile\s+liability/i, /umbrella/i, /workers[\s']*compensation/i, /description\s+of\s+operations/i],
  );
  const auto = coverageBlock(
    text,
    "auto",
    /automobile\s+liability|auto\s+liability/i,
    [/umbrella/i, /workers[\s']*compensation/i, /description\s+of\s+operations/i, /other\s+coverage/i],
  );
  const umbrella = coverageBlock(
    text,
    "umbrella",
    /umbrella\s*(?:liability)?|excess\s+liability/i,
    [/workers[\s']*compensation/i, /description\s+of\s+operations/i, /other\s+coverage/i],
  );
  const wc = coverageBlock(
    text,
    "workers_comp",
    /workers[\s']*compensation(?:\s+and\s+employers?[\s']*liability)?/i,
    [/description\s+of\s+operations/i, /other\s+coverage/i, /certificate\s+holder/i],
  );

  const coverages = [gl, auto, umbrella, wc].filter(Boolean) as Acord25CoverageLine[];

  if (coverages.length === 0) {
    warnings.push("No coverage rows detected — paste fuller ACORD 25 text or enter fields manually.");
  }

  const anyAiChecked = coverages.some((c) => c.additionalInsuredChecked);
  const aiInfo = resolveAdditionalInsuredName(
    descriptionOfOperations,
    certificateHolder,
    anyAiChecked || /additional\s+insured/i.test(descriptionOfOperations ?? ""),
  );

  if (anyAiChecked && !aiInfo.named) {
    warnings.push(
      "Additional insured box appears checked but named entity was not found in Description of Operations / Certificate Holder.",
    );
  }

  const policies: Partial<InsurancePolicy>[] = coverages.map((c) => {
    const insurer =
      (c.insurerLetter && insurers.find((i) => i.letter === c.insurerLetter)?.name) ||
      insurers[0]?.name ||
      "(Carrier from ACORD — confirm)";

    const limit = c.eachOccurrence ?? c.generalAggregate;
    const wantsAI =
      c.type === "general_liability" &&
      (c.additionalInsuredChecked || aiInfo.mentioned || matchesAdditionalInsured(certificateHolder));

    return {
      type: c.type,
      carrier: insurer,
      policyNumber: c.policyNumber ?? "(see certificate)",
      effectiveDate: c.effectiveDate,
      expirationDate: c.expirationDate,
      coverageLimit: limit,
      additionalInsured: wantsAI,
      additionalInsuredNamed: wantsAI
        ? aiInfo.named ??
          (matchesAdditionalInsured(certificateHolder)
            ? COI_REQUIREMENTS.additionalInsuredName
            : certificateHolder)
        : undefined,
      notes: [
        "Parsed from ACORD 25 text",
        c.generalAggregate ? `Gen agg $${c.generalAggregate.toLocaleString()}` : null,
        c.waiverOfSubrogationChecked ? "Waiver of subrogation indicated" : null,
        formEdition ? `Form ${formEdition}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });

  if (!isAcord25) {
    warnings.push("Document may not be an ACORD 25 — review extracted fields carefully.");
  }

  return {
    isAcord25,
    confidence: Math.min(100, confidence + coverages.length * 5),
    formEdition,
    producer,
    insuredName,
    insurers,
    certificateHolder,
    descriptionOfOperations,
    coverages,
    additionalInsuredMentioned: aiInfo.mentioned,
    additionalInsuredNamed: aiInfo.named,
    warnings,
    policies,
  };
}

/** Sample ACORD 25–style text for demos and tests */
export const SAMPLE_ACORD_25_TEXT = `
ACORD 25 (2016/03)
CERTIFICATE OF LIABILITY INSURANCE
DATE (MM/DD/YYYY) 03/15/2026

PRODUCER
Mountain West Insurance Agency
100 Main St, Idaho Falls, ID 83401

INSURED
Eastern Idaho Framing LLC
500 Industrial Way, Rigby, ID 83442

INSURER A: Mountain West Mutual NAIC # 12345
INSURER B: Idaho State Fund NAIC # 67890

COVERAGES

COMMERCIAL GENERAL LIABILITY
INSURER LETTER A
POLICY NUMBER MW-GL-88421
POLICY EFF 11/15/2025 EXP 11/15/2026
ADDL INSR X   SUBR WVD
EACH OCCURRENCE $1,000,000
DAMAGE TO RENTED PREMISES $100,000
MED EXP $5,000
PERSONAL & ADV INJURY $1,000,000
GENERAL AGGREGATE $2,000,000
PRODUCTS - COMP/OP AGG $2,000,000

AUTOMOBILE LIABILITY
INSURER LETTER A
POLICY NUMBER MW-AU-22100
POLICY EFF 11/15/2025 EXP 11/15/2026
COMBINED SINGLE LIMIT $1,000,000

WORKERS COMPENSATION AND EMPLOYERS' LIABILITY
INSURER LETTER B
POLICY NUMBER ISF-WC-99201
POLICY EFF 09/01/2025 EXP 09/01/2026
WC STATUTORY LIMITS
E.L. EACH ACCIDENT $500,000
E.L. DISEASE - EA EMPLOYEE $500,000
E.L. DISEASE - POLICY LIMIT $500,000

DESCRIPTION OF OPERATIONS / LOCATIONS / VEHICLES
Certificate holder is listed as additional insured on general liability per CG 20 10 and CG 20 37
regarding operations performed for Split Rock Construction LLC. Primary and noncontributory.

CERTIFICATE HOLDER
Split Rock Construction LLC
Rigby, ID 83442

CANCELLATION
Should any of the above described policies be cancelled before the expiration date thereof,
notice will be delivered in accordance with the policy provisions.
`.trim();

/** Map parse result into full InsurancePolicy drafts for a vendor */
export function acordPoliciesForVendor(
  parsed: Acord25ParseResult,
  vendorId: string,
  certificateRef?: string,
): InsurancePolicy[] {
  const now = Date.now();
  return parsed.policies
    .filter((p) => p.type && (p.policyNumber || p.expirationDate))
    .map((p, i) => ({
      id: `acord-${now}-${i}`,
      vendorId,
      type: p.type!,
      carrier: p.carrier ?? "(unknown)",
      policyNumber: p.policyNumber ?? "(see certificate)",
      expirationDate: p.expirationDate ?? new Date().toISOString().slice(0, 10),
      effectiveDate: p.effectiveDate,
      status: "pending_review" as const,
      additionalInsured: !!p.additionalInsured,
      additionalInsuredNamed: p.additionalInsuredNamed,
      coverageLimit: p.coverageLimit,
      certificateUrl: certificateRef,
      notes: p.notes,
    }));
}
