/**
 * Shared residential build-journey phases for marketing case studies + owner portal.
 * Reusable across jobs — Holwege is the flagship seed, not a one-off.
 */

export type BuildJourneyPhases = readonly string[];

/** Default one-level / crawl residential journey (marketing + portal rail). */
export const DEFAULT_RESIDENTIAL_PHASES = [
  "Site",
  "Foundation",
  "Framing",
  "MEP",
  "Insulation",
  "Finishes",
  "Walkthrough",
] as const satisfies BuildJourneyPhases;

export type DefaultResidentialPhase = (typeof DEFAULT_RESIDENTIAL_PHASES)[number];

export type PhaseStatus = "completed" | "current" | "upcoming";

/** Normalize phase labels so "Site Work" / "MEP Rough-In" match rail names. */
export function normalizePhaseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phaseTokens(name: string): string[] {
  return normalizePhaseName(name).split(" ").filter(Boolean);
}

/** True when a and b refer to the same journey step (prefix / shared token). */
export function phasesMatch(a: string, b: string): boolean {
  const na = normalizePhaseName(a);
  const nb = normalizePhaseName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.startsWith(nb) || nb.startsWith(na)) return true;
  const ta = phaseTokens(a);
  const tb = phaseTokens(b);
  // Share a meaningful first token (Site / Foundation / Framing / MEP / …)
  const headA = ta[0];
  const headB = tb[0];
  return Boolean(headA && headB && headA === headB);
}

/**
 * Index of `phaseName` in `phases`, or -1 if unknown.
 * Also accepts project.phase values that fuzzy-match a rail label.
 */
export function phaseIndex(
  phases: readonly string[],
  phaseName: string | undefined | null,
): number {
  if (!phaseName?.trim()) return -1;
  const exact = phases.findIndex((p) => phasesMatch(p, phaseName));
  return exact;
}

/**
 * Visual state of a rail step relative to the job's current phase.
 * Unknown current → all upcoming (pre-start marketing).
 */
export function phaseStatus(
  currentPhase: string | undefined | null,
  phaseName: string,
  phases: readonly string[] = DEFAULT_RESIDENTIAL_PHASES,
): PhaseStatus {
  const currentIdx = phaseIndex(phases, currentPhase);
  const stepIdx = phaseIndex(phases, phaseName);
  if (stepIdx < 0) return "upcoming";
  if (currentIdx < 0) {
    // Pre-start: treat first phase as current when caller passes it explicitly,
    // otherwise all upcoming. Callers that want "Site" as current pass current="Site".
    return "upcoming";
  }
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

/** Resolve a project.phase / schedule label onto the default rail, if possible. */
export function mapToDefaultPhase(
  projectPhase: string | undefined | null,
): DefaultResidentialPhase | undefined {
  if (!projectPhase) return undefined;
  const idx = phaseIndex(DEFAULT_RESIDENTIAL_PHASES, projectPhase);
  if (idx < 0) return undefined;
  return DEFAULT_RESIDENTIAL_PHASES[idx];
}
