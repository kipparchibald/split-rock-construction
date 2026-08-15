import { addDays, format, parseISO } from "date-fns";
import type {
  ActivityItem,
  Bid,
  BudgetLine,
  Client,
  CloseoutPackage,
  DocumentItem,
  Phase,
  ProgressDraw,
  Project,
  SelectionItem,
} from "@/data/types";
import type { Plan } from "@/data/types";
import { defaultJobCostCodes, resolveCostCodeId } from "@/lib/cost-codes";
import { buildDrawSchedule } from "@/lib/pricing";
import { buildJobFromPlan } from "@/lib/start-from-plan";

export interface BuildJobFromBidInput {
  bid: Bid;
  client?: Pick<Client, "id" | "name" | "address">;
  plan?: Plan;
  superintendent?: string;
  startDate?: string;
}

export interface BuildJobFromBidResult {
  project: Project;
  client?: Client;
  draws: ProgressDraw[];
  selections: SelectionItem[];
  budgetLines: BudgetLine[];
  documents: DocumentItem[];
  closeout: CloseoutPackage;
  activity: ActivityItem;
}

const RESIDENTIAL_PHASES: { phase: Phase; weeks: number }[] = [
  { phase: "Site Work", weeks: 2 },
  { phase: "Foundation", weeks: 4 },
  { phase: "Framing", weeks: 6 },
  { phase: "MEP Rough-In", weeks: 5 },
  { phase: "Interior Finishes", weeks: 8 },
  { phase: "Final Walkthrough", weeks: 2 },
];

const COMMERCIAL_PHASES: { phase: Phase; weeks: number }[] = [
  { phase: "Site Work", weeks: 3 },
  { phase: "Foundation", weeks: 5 },
  { phase: "Framing", weeks: 8 },
  { phase: "MEP Rough-In", weeks: 6 },
  { phase: "Interior Finishes", weeks: 6 },
  { phase: "Final Walkthrough", weeks: 2 },
];

function uid(prefix: string) {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
    }
  } catch {
    /* fall through */
  }
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** Strip bid suffixes for a cleaner job name. */
export function jobNameFromBidTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*(base bid|design assist|ti|tenant improvement).*$/i, "")
    .replace(/\s*\(lost\)\s*$/i, "")
    .trim();
}

function lineItemsToBudget(projectId: string, lineItems: Bid["lineItems"]): BudgetLine[] {
  if (!lineItems.length) return [];
  return lineItems.map((li) => ({
    id: uid("bl"),
    projectId,
    costCodeId: resolveCostCodeId(li.label),
    category: li.label,
    budgeted: li.amount,
    committed: 0,
    actual: 0,
  }));
}

function defaultWeightedBudget(projectId: string, amount: number, type: Bid["type"]): BudgetLine[] {
  const codes = defaultJobCostCodes(type === "commercial" ? "commercial" : "residential").filter(
    (c) => !c.parentId,
  );
  const weights = codes.map((_, i) => 1 + Math.max(0, 6 - i) * 0.15);
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  return codes.map((c, i) => ({
    id: uid("bl"),
    projectId,
    costCodeId: c.id,
    category: c.name,
    budgeted: Math.round((amount * weights[i]!) / wSum),
    committed: 0,
    actual: 0,
  }));
}

function drawsFromContract(projectId: string, contractPrice: number, startDate: string): ProgressDraw[] {
  return buildDrawSchedule(contractPrice).map((row, i) => ({
    id: uid("dr"),
    projectId,
    name: row.milestone.name,
    pct: row.milestone.pct,
    amount: row.amount,
    status: "upcoming",
    trigger: row.milestone.trigger,
    dueDate: i === 0 ? startDate : undefined,
  }));
}

function buildSchedule(
  phases: { phase: Phase; weeks: number }[],
  start: Date,
): Project["schedule"] {
  let cursor = start;
  return phases.map((ph) => {
    const phaseStart = cursor;
    const phaseEnd = addDays(phaseStart, Math.max(1, ph.weeks) * 7 - 1);
    cursor = addDays(phaseEnd, 1);
    return { phase: ph.phase, start: isoDate(phaseStart), end: isoDate(phaseEnd), pct: 0 };
  });
}

function defaultSelections(projectId: string, type: Bid["type"]): SelectionItem[] {
  if (type === "commercial") {
    return [
      {
        id: uid("sel"),
        projectId,
        room: "Tenant space",
        category: "Finishes package",
        allowance: 0,
        status: "not_started",
        choice: "Per bid line items",
      },
    ];
  }
  return [
    { id: uid("sel"), projectId, room: "Kitchen", category: "Cabinets & countertops", allowance: 0, status: "not_started" },
    { id: uid("sel"), projectId, room: "Whole home", category: "Flooring", allowance: 0, status: "not_started" },
    { id: uid("sel"), projectId, room: "Baths", category: "Plumbing fixtures", allowance: 0, status: "not_started" },
  ];
}

function skeletonDocuments(projectId: string, title: string, superintendent: string): DocumentItem[] {
  const today = isoDate(new Date());
  return [
    {
      id: uid("doc"),
      title: "Construction contract — " + title,
      type: "contract",
      projectId,
      status: "pending",
      updatedAt: today,
      author: superintendent,
    },
    {
      id: uid("doc"),
      title: "Building permit application",
      type: "permit",
      projectId,
      status: "pending",
      updatedAt: today,
      author: superintendent,
      reference: "BP-DRAFT",
    },
    {
      id: uid("doc"),
      title: "Signed proposal / bid package",
      type: "drawing",
      projectId,
      status: "approved",
      updatedAt: today,
      author: superintendent,
    },
  ];
}

function defaultCloseout(projectId: string, superintendent: string): CloseoutPackage {
  return {
    id: uid("co"),
    projectId,
    punchOpen: 0,
    punchClosed: 0,
    notes: "Closeout staged from awarded bid.",
    items: [
      { key: "substantial_completion", label: "Substantial completion certificate", status: "not_started", owner: superintendent },
      { key: "punch_list", label: "Punch list tracked to zero", status: "not_started", owner: superintendent },
      { key: "certificate_of_occupancy", label: "Certificate of occupancy", status: "not_started", owner: "City / County" },
      { key: "final_pay_app", label: "Final pay application / final draw", status: "not_started", owner: superintendent },
      { key: "lien_waivers", label: "Final lien waivers (GC + subs)", status: "not_started", owner: superintendent },
      { key: "warranty_packet", label: "Warranty packet delivered", status: "not_started", owner: superintendent },
    ],
  };
}

/** Open a full job package when a bid is awarded. */
export function buildJobFromBid(input: BuildJobFromBidInput): BuildJobFromBidResult {
  const { bid } = input;
  const jobName = jobNameFromBidTitle(bid.title);
  const superintendent = input.superintendent?.trim() || "Tyler Brooks";
  const start = input.startDate ? parseISO(input.startDate) : addDays(new Date(), 14);
  const startDate = isoDate(start);

  if (input.plan) {
    const built = buildJobFromPlan({
      plan: input.plan,
      clientId: bid.clientId,
      lotAddress: input.client?.address,
      superintendent,
      startDate,
    });
    built.project.name = jobName;
    built.project.budget = bid.amount;
    built.project.description = bid.notes || built.project.description;
    built.project.planId = input.plan.id;

    const drawSchedule = buildDrawSchedule(bid.amount);
    built.draws = drawSchedule.map((row, i) => ({
      id: uid("dr"),
      projectId: built.project.id,
      name: row.milestone.name,
      pct: row.milestone.pct,
      amount: row.amount,
      status: "upcoming",
      trigger: row.milestone.trigger,
      dueDate: i === 0 ? startDate : undefined,
    }));

    if (bid.lineItems.length > 0) {
      built.budgetLines = lineItemsToBudget(built.project.id, bid.lineItems);
    }

    built.activity = {
      id: uid("a"),
      at: new Date().toISOString(),
      text: `Job opened from awarded bid · ${jobName} (${input.plan.code})`,
      kind: "project",
    };
    return built;
  }

  const projectId = uid("p");
  const phases = bid.type === "commercial" ? COMMERCIAL_PHASES : RESIDENTIAL_PHASES;
  const schedule = buildSchedule(phases, start);
  const endDate = schedule.length ? schedule[schedule.length - 1]!.end : isoDate(addDays(start, 180));
  const address = input.client?.address?.trim() || "Address TBD — Rigby, ID";

  const project: Project = {
    id: projectId,
    name: jobName,
    address,
    clientId: bid.clientId,
    type: bid.type,
    status: "planning",
    phase: phases[0]?.phase ?? "Site Work",
    progress: 0,
    budget: bid.amount,
    spent: 0,
    startDate,
    endDate,
    superintendent,
    sqft: bid.type === "commercial" ? 0 : 2200,
    description: bid.notes || `Opened from awarded bid: ${bid.title}`,
    planId: bid.planId,
    milestones: [
      { name: "Contract executed", date: startDate, done: true },
      { name: "Permit submitted", date: isoDate(addDays(start, 21)), done: false },
      { name: "Ground break", date: startDate, done: false },
      { name: "Substantial completion", date: endDate, done: false },
    ],
    schedule,
  };

  const budgetLines =
    bid.lineItems.length > 0
      ? lineItemsToBudget(projectId, bid.lineItems)
      : defaultWeightedBudget(projectId, bid.amount, bid.type);

  const activity: ActivityItem = {
    id: uid("a"),
    at: new Date().toISOString(),
    text: `Job opened from awarded bid · ${jobName}`,
    kind: "project",
  };

  return {
    project,
    draws: drawsFromContract(projectId, bid.amount, startDate),
    selections: defaultSelections(projectId, bid.type),
    budgetLines,
    documents: skeletonDocuments(projectId, jobName, superintendent),
    closeout: defaultCloseout(projectId, superintendent),
    activity,
  };
}

/** Build bid line items from estimator cost buckets + price breakdown. */
export function estimateToBidLineItems(
  costs: import("@/lib/pricing").CostInputs,
  price: import("@/lib/pricing").PriceBreakdown,
): Bid["lineItems"] {
  const labels: { key: keyof import("@/lib/pricing").CostInputs; label: string }[] = [
    { key: "siteWork", label: "Site work" },
    { key: "foundation", label: "Foundation" },
    { key: "structure", label: "Structure & envelope" },
    { key: "mep", label: "MEP" },
    { key: "finishes", label: "Finishes" },
    { key: "landscaping", label: "Landscaping" },
    { key: "permitsFees", label: "Permits & fees" },
    { key: "land", label: "Land" },
    { key: "other", label: "Other" },
  ];
  const items: Bid["lineItems"] = labels
    .map(({ key, label }) => ({ label, amount: Math.round(costs[key] || 0) }))
    .filter((li) => li.amount > 0);

  if (price.softCosts > 0) items.push({ label: "Soft costs / design", amount: price.softCosts });
  if (price.contingency > 0) items.push({ label: "Contingency", amount: price.contingency });
  if (price.markup > 0) items.push({ label: "Overhead & profit", amount: price.markup });
  if (price.tax > 0) items.push({ label: "Sales tax", amount: price.tax });

  return items;
}
