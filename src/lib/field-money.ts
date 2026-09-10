/**
 * SRC-5 field money — crews labor burn, cost-code CSV, COs that move draws.
 * Holwege-first. Does not mutate src/data/holwege.ts contract/draw-base constants.
 * Portal owner UI stays Portal's — this module is operator/ops only.
 */

import type {
  BudgetLine,
  ChangeOrder,
  Crew,
  CrewMember,
  DailyLog,
  ProgressDraw,
} from "@/data/types";
import { HOLWEGE_PROJECT_ID } from "@/data/holwege";

export const FIELD_MONEY_LABOR_CODE = "01-LAB";

/** Draw id for a CO-backed schedule line (ops only). */
export function drawIdForChangeOrder(coId: string): string {
  return `pd-co-${coId}`;
}

export function isChangeOrderDraw(draw: ProgressDraw): boolean {
  return draw.id.startsWith("pd-co-");
}

/**
 * When a CO is approved, add (or refresh) an ops draw line for that amount.
 * Does not rewrite Holwege base draws (pd-holwege-1…6).
 * On reverse (un-approve), remove the CO draw if still unpaid.
 */
export function applyApprovedCoToDraws(
  draws: ProgressDraw[],
  co: ChangeOrder,
  opts: { approve: boolean },
): ProgressDraw[] {
  const drawId = drawIdForChangeOrder(co.id);
  const existing = draws.find((d) => d.id === drawId);

  if (!opts.approve) {
    if (!existing) return draws;
    if (existing.status === "paid" || existing.status === "submitted") {
      return draws;
    }
    return draws.filter((d) => d.id !== drawId);
  }

  const amount = Math.max(0, Math.round(co.amount * 100) / 100);
  if (amount <= 0) {
    return existing ? draws.filter((d) => d.id !== drawId) : draws;
  }

  const next: ProgressDraw = {
    id: drawId,
    projectId: co.projectId,
    name: `${co.number}: ${co.title}`.slice(0, 120),
    pct: 0,
    amount,
    status: existing?.status === "paid" || existing?.status === "submitted" ? existing.status : "ready",
    dueDate: existing?.dueDate,
    paidDate: existing?.paidDate,
    trigger: `Approved change order ${co.number} — moves draws (ops)`,
  };

  if (existing) {
    return draws.map((d) => (d.id === drawId ? next : d));
  }
  const projectDraws = draws.filter((d) => d.projectId === co.projectId);
  const others = draws.filter((d) => d.projectId !== co.projectId);
  return [...projectDraws, next, ...others];
}

export interface LaborBurnRow {
  projectId: string;
  costCodeId: string;
  hours: number;
  laborCost: number;
  crewCountDays: number;
  logCount: number;
}

/** Roll labor from daily logs × assigned member rates (ops burn, not owner portal). */
export function laborBurnForProject(
  projectId: string,
  logs: DailyLog[],
  members: CrewMember[],
): LaborBurnRow {
  const projectLogs = logs.filter((l) => l.projectId === projectId);
  const assigned = members.filter((m) => m.projectId === projectId && m.status !== "pto");
  const avgRate =
    assigned.length > 0
      ? assigned.reduce((s, m) => s + (Number(m.rate) || 0), 0) / assigned.length
      : 45; // ASSUME: fallback blended rate when no crew on job yet
  const hours = projectLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0);
  const crewCountDays = projectLogs.reduce((s, l) => s + (Number(l.crewCount) || 0), 0);
  return {
    projectId,
    costCodeId: FIELD_MONEY_LABOR_CODE,
    hours,
    laborCost: Math.round(hours * avgRate * 100) / 100,
    crewCountDays,
    logCount: projectLogs.length,
  };
}

export function laborBurnCsv(rows: LaborBurnRow[], projects: { id: string; name: string }[]): string {
  const header = "projectId,projectName,costCodeId,hours,laborCost,crewCountDays,logCount";
  const lines = rows.map((r) => {
    const name = projects.find((p) => p.id === r.projectId)?.name ?? "";
    return [
      r.projectId,
      csvEscape(name),
      r.costCodeId,
      String(r.hours),
      String(r.laborCost),
      String(r.crewCountDays),
      String(r.logCount),
    ].join(",");
  });
  return [header, ...lines].join("\n") + "\n";
}

export function costCodeChartLaborCsv(
  codes: { code: string; name: string; group: string }[],
): string {
  const header = "code,name,group";
  const lines = codes.map((c) => [c.code, csvEscape(c.name), c.group].join(","));
  return [header, ...lines].join("\n") + "\n";
}

/** Parse labor burn CSV; updates BudgetLine.actual for matching project+costCode. */
export function parseLaborBurnCsv(text: string): {
  rows: { projectId: string; costCodeId: string; laborCost: number; hours: number }[];
  errors: string[];
} {
  const errors: string[] = [];
  const rows: { projectId: string; costCodeId: string; laborCost: number; hours: number }[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows, errors: ["Empty CSV"] };

  const header = lines[0]!.toLowerCase();
  const hasHeader = header.includes("projectid") || header.includes("costcode");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  for (let i = 0; i < dataLines.length; i++) {
    const cols = splitCsvLine(dataLines[i]!);
    if (cols.length < 4) {
      errors.push(`Line ${i + 2}: need projectId,costCodeId,hours,laborCost`);
      continue;
    }
    let projectId: string;
    let costCodeId: string;
    let hours: number;
    let laborCost: number;
    if (hasHeader && header.includes("projectname")) {
      projectId = cols[0] ?? "";
      costCodeId = cols[2] ?? FIELD_MONEY_LABOR_CODE;
      hours = Number(cols[3]) || 0;
      laborCost = Number(cols[4]) || 0;
    } else {
      projectId = cols[0] ?? "";
      costCodeId = cols[1] ?? FIELD_MONEY_LABOR_CODE;
      hours = Number(cols[2]) || 0;
      laborCost = Number(cols[3]) || 0;
    }
    if (!projectId) {
      errors.push(`Line ${i + 2}: missing projectId`);
      continue;
    }
    rows.push({
      projectId: projectId.trim(),
      costCodeId: (costCodeId || FIELD_MONEY_LABOR_CODE).trim(),
      hours,
      laborCost: Math.round(laborCost * 100) / 100,
    });
  }
  return { rows, errors };
}

export function applyLaborBurnToBudgetLines(
  budgetLines: BudgetLine[],
  imported: { projectId: string; costCodeId: string; laborCost: number }[],
): BudgetLine[] {
  let next = [...budgetLines];
  for (const row of imported) {
    const idx = next.findIndex(
      (b) => b.projectId === row.projectId && b.costCodeId === row.costCodeId,
    );
    if (idx >= 0) {
      const cur = next[idx]!;
      next[idx] = { ...cur, actual: row.laborCost };
    } else {
      next = [
        {
          id: `bl-labor-${row.projectId}-${row.costCodeId}`,
          projectId: row.projectId,
          costCodeId: row.costCodeId,
          category: "Self-perform labor (CSV)",
          budgeted: 0,
          committed: 0,
          actual: row.laborCost,
        },
        ...next,
      ];
    }
  }
  return next;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** Holwege site crew — live/demo seed helpers (does not touch holwege.ts money constants). */
export const HOLWEGE_CREW_LEAD: CrewMember = {
  id: "m-holwege-kyle",
  name: "Kyle Christensen",
  role: "Field Supervisor",
  trade: "General",
  phone: "",
  status: "active",
  rate: 55, // ASSUME: placeholder ops rate until payroll wired
  certifications: ["OSHA 30"],
  projectId: HOLWEGE_PROJECT_ID,
};

export const HOLWEGE_CREW: Crew = {
  id: "cr-holwege",
  name: "Holwege Site",
  leadId: HOLWEGE_CREW_LEAD.id,
  trade: "General",
  memberIds: [HOLWEGE_CREW_LEAD.id],
  projectId: HOLWEGE_PROJECT_ID,
};

export type FieldMoneyCrewSlice = {
  members: CrewMember[];
  crews: Crew[];
};

export function ensureHolwegeCrewSeed(slice: FieldMoneyCrewSlice): FieldMoneyCrewSlice & {
  seeded: boolean;
} {
  const hasMember = slice.members.some((m) => m.id === HOLWEGE_CREW_LEAD.id);
  const hasCrew = slice.crews.some((c) => c.id === HOLWEGE_CREW.id);
  if (hasMember && hasCrew) return { ...slice, seeded: false };
  return {
    members: hasMember ? slice.members : [HOLWEGE_CREW_LEAD, ...slice.members],
    crews: hasCrew ? slice.crews : [HOLWEGE_CREW, ...slice.crews],
    seeded: true,
  };
}
