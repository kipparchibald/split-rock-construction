/**
 * Closed-job cost history for the offline draft estimator.
 * Starts empty; record completed jobs as they finish so future drafts
 * bias toward your real Jefferson County / Eastern Idaho numbers.
 */

import type { CostInputs } from "./pricing";
import { LIMITS, clampText, safeNonNegNumber } from "./security";

const STORAGE_KEY = "src.closed-job-costs.v1";

export type ProjectKind = "residential" | "commercial";

export interface ClosedJobRecord {
  id: string;
  name: string;
  kind: ProjectKind;
  /** Finished living/building area used for $/sf */
  sqft: number;
  /** Actual hard costs by bucket (same shape as Bid & Price) */
  costs: CostInputs;
  /** Optional tags used for matching (ranch, basement, ti, shell, …) */
  tags: string[];
  closedAt: string; // ISO date
  notes?: string;
}

const COST_KEYS: (keyof CostInputs)[] = [
  "land",
  "siteWork",
  "foundation",
  "structure",
  "mep",
  "finishes",
  "landscaping",
  "permitsFees",
  "other",
];

export function emptyCosts(): CostInputs {
  return {
    land: 0,
    siteWork: 0,
    foundation: 0,
    structure: 0,
    mep: 0,
    finishes: 0,
    landscaping: 0,
    permitsFees: 0,
    other: 0,
  };
}

function sanitizeCosts(raw: unknown): CostInputs {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = emptyCosts();
  for (const k of COST_KEYS) {
    out[k] = safeNonNegNumber(src[k]);
  }
  return out;
}

/** Validate and normalize a single closed-job record from untrusted storage. */
export function sanitizeClosedJob(raw: unknown): ClosedJobRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const kind = o.kind === "commercial" ? "commercial" : o.kind === "residential" ? "residential" : null;
  if (!kind) return null;
  const sqft = safeNonNegNumber(o.sqft, 5_000_000);
  if (sqft <= 0) return null;
  const id = clampText(o.id, 64) || `cj-${Date.now()}`;
  const name = clampText(o.name, LIMITS.closedJobName) || "Closed job";
  const tags = Array.isArray(o.tags)
    ? o.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => clampText(t, 40).toLowerCase())
        .filter(Boolean)
        .slice(0, LIMITS.closedJobTags)
    : [];
  const closedAt =
    typeof o.closedAt === "string" && /^\d{4}-\d{2}-\d{2}/.test(o.closedAt)
      ? o.closedAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  const notes = o.notes != null ? clampText(o.notes, LIMITS.closedJobNotes) : undefined;
  return {
    id,
    name,
    kind,
    sqft,
    costs: sanitizeCosts(o.costs),
    tags,
    closedAt,
    notes: notes || undefined,
  };
}

/** Per-sqft rates derived from a closed job (land excluded). */
export function costsToPerSqft(costs: CostInputs, sqft: number): CostInputs {
  if (!sqft || sqft <= 0) return emptyCosts();
  const k = (n: number) => Math.round((n / sqft) * 100) / 100;
  return {
    land: 0,
    siteWork: k(costs.siteWork),
    foundation: k(costs.foundation),
    structure: k(costs.structure),
    mep: k(costs.mep),
    finishes: k(costs.finishes),
    landscaping: k(costs.landscaping),
    permitsFees: k(costs.permitsFees),
    other: k(costs.other),
  };
}

export function loadClosedJobs(): ClosedJobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 500_000) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeClosedJob)
      .filter((j): j is ClosedJobRecord => j != null)
      .slice(0, LIMITS.closedJobsStored);
  } catch {
    return [];
  }
}

export function saveClosedJobs(jobs: ClosedJobRecord[]): void {
  if (typeof window === "undefined") return;
  const clean = jobs
    .map(sanitizeClosedJob)
    .filter((j): j is ClosedJobRecord => j != null)
    .slice(0, LIMITS.closedJobsStored);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function recordClosedJob(
  job: Omit<ClosedJobRecord, "id" | "closedAt"> & { id?: string; closedAt?: string },
): ClosedJobRecord {
  const record = sanitizeClosedJob({
    id: job.id ?? `cj-${Date.now()}`,
    name: job.name,
    kind: job.kind,
    sqft: job.sqft,
    costs: job.costs,
    tags: job.tags ?? [],
    closedAt: job.closedAt ?? new Date().toISOString().slice(0, 10),
    notes: job.notes,
  });
  if (!record) {
    throw new Error("Invalid closed job record");
  }
  const all = loadClosedJobs().filter((j) => j.id !== record.id);
  all.unshift(record);
  saveClosedJobs(all);
  return record;
}

export function clearClosedJobs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export interface HistoryBlend {
  /** Weighted average $/sf rates from matching closed jobs (land = 0) */
  rates: CostInputs;
  /** 0–1 strength of history influence */
  weight: number;
  matched: ClosedJobRecord[];
  summary: string;
}

/**
 * Find closed jobs that match kind + overlapping tags.
 * Returns blended per-sqft rates and how strongly to mix them into the draft.
 */
export function blendHistoryRates(
  kind: ProjectKind,
  tags: string[],
  jobs: ClosedJobRecord[] = typeof window !== "undefined" ? loadClosedJobs() : [],
): HistoryBlend {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  const scored = jobs
    .filter((j) => j.kind === kind && j.sqft > 0)
    .map((j) => {
      const jtags = j.tags.map((t) => t.toLowerCase());
      const overlap = jtags.filter((t) => tagSet.has(t)).length;
      const score = 1 + overlap * 2;
      return { job: j, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    return {
      rates: emptyCosts(),
      weight: 0,
      matched: [],
      summary: "No closed jobs yet — using company baseline rates. Record finished jobs to improve drafts.",
    };
  }

  const totalScore = scored.reduce((s, x) => s + x.score, 0);
  const rates = emptyCosts();

  for (const { job, score } of scored) {
    const psf = costsToPerSqft(job.costs, job.sqft);
    const w = score / totalScore;
    for (const k of COST_KEYS) {
      if (k === "land") continue;
      rates[k] += psf[k] * w;
    }
  }
  for (const k of COST_KEYS) {
    rates[k] = Math.round(rates[k] * 100) / 100;
  }

  // More matches + better tag overlap → stronger pull (cap 55%)
  const avgOverlap =
    scored.reduce((s, x) => {
      const jtags = x.job.tags.map((t) => t.toLowerCase());
      return s + jtags.filter((t) => tagSet.has(t)).length;
    }, 0) / scored.length;
  const weight = Math.min(0.55, 0.2 + scored.length * 0.08 + avgOverlap * 0.06);

  const names = scored.map((x) => x.job.name).join(", ");
  return {
    rates,
    weight,
    matched: scored.map((x) => x.job),
    summary: `Blended ${scored.length} closed job${scored.length === 1 ? "" : "s"} (${names}) at ${Math.round(weight * 100)}% weight.`,
  };
}
