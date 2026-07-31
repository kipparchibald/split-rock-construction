/**
 * Closed-job cost history for the offline draft estimator.
 * Starts empty; record completed jobs as they finish so future drafts
 * bias toward your real Eastern Idaho / Treasure Valley numbers.
 */

import type { CostInputs } from "./pricing";

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
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClosedJobRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClosedJobs(jobs: ClosedJobRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function recordClosedJob(
  job: Omit<ClosedJobRecord, "id" | "closedAt"> & { id?: string; closedAt?: string },
): ClosedJobRecord {
  const record: ClosedJobRecord = {
    id: job.id ?? `cj-${Date.now()}`,
    name: job.name,
    kind: job.kind,
    sqft: job.sqft,
    costs: job.costs,
    tags: job.tags ?? [],
    closedAt: job.closedAt ?? new Date().toISOString().slice(0, 10),
    notes: job.notes,
  };
  const all = loadClosedJobs().filter((j) => j.id !== record.id);
  all.unshift(record);
  saveClosedJobs(all.slice(0, 50));
  return record;
}

export function clearClosedJobs(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
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
  const keys = Object.keys(rates) as (keyof CostInputs)[];

  for (const { job, score } of scored) {
    const psf = costsToPerSqft(job.costs, job.sqft);
    const w = score / totalScore;
    for (const k of keys) {
      if (k === "land") continue;
      rates[k] += psf[k] * w;
    }
  }
  for (const k of keys) {
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
