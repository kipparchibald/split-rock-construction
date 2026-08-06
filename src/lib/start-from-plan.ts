import { addDays, format, parseISO } from "date-fns";
import type {
  ActivityItem,
  BudgetLine,
  CloseoutPackage,
  Client,
  DocumentItem,
  ProgressDraw,
  Project,
  SelectionItem,
} from "@/data/types";
import type { Plan } from "@/data/types";
import { defaultJobCostCodes, resolveCostCodeId } from "@/lib/cost-codes";

export interface StartFromPlanInput {
  plan: Plan;
  /** Existing client id, or omit to create a placeholder buyer */
  clientId?: string;
  clientName?: string;
  lotAddress?: string;
  elevation?: string;
  superintendent?: string;
  startDate?: string; // yyyy-mm-dd
}

export interface StartFromPlanResult {
  project: Project;
  client?: Client;
  draws: ProgressDraw[];
  selections: SelectionItem[];
  budgetLines: BudgetLine[];
  documents: DocumentItem[];
  closeout: CloseoutPackage;
  activity: ActivityItem;
}

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

/** Build a fully seeded residential job from a Book of Plans entry. */
export function buildJobFromPlan(input: StartFromPlanInput): StartFromPlanResult {
  const { plan } = input;
  const projectId = uid("p");
  const start = input.startDate ? parseISO(input.startDate) : addDays(new Date(), 14);
  const startDate = isoDate(start);

  // Schedule from phase template
  let cursor = start;
  const schedule: Project["schedule"] = plan.phaseTemplate.map((ph) => {
    const phaseStart = cursor;
    const phaseEnd = addDays(phaseStart, Math.max(1, ph.weeks) * 7 - 1);
    cursor = addDays(phaseEnd, 1);
    return {
      phase: ph.phase,
      start: isoDate(phaseStart),
      end: isoDate(phaseEnd),
      pct: 0,
    };
  });
  const endDate = schedule.length ? schedule[schedule.length - 1]!.end : isoDate(addDays(start, 180));

  const elevationNote = input.elevation
    ? `Elevation: ${input.elevation}. `
    : plan.elevationOptions[0]
      ? `Default elevation: ${plan.elevationOptions[0]}. `
      : "";

  let client: Client | undefined;
  let clientId = input.clientId;
  if (!clientId) {
    clientId = uid("c");
    client = {
      id: clientId,
      name: input.clientName?.trim() || `Buyer — ${plan.code}`,
      email: "",
      phone: "",
      type: "homeowner",
      address: input.lotAddress?.trim() || "Teton Heights, Rigby, ID",
      notes: `Seeded from Book of Plans ${plan.code}`,
    };
  }

  const address = input.lotAddress?.trim() || `Teton Heights Lot — ${plan.code}`;
  const sqft = plan.mainFloorSqft + Math.round(plan.basementSqft * 0.35); // main + partial basement finish equiv for display
  const project: Project = {
    id: projectId,
    name: `${plan.name} — new job`,
    address,
    clientId,
    type: "residential",
    status: "planning",
    phase: plan.phaseTemplate[0]?.phase ?? "Site Work",
    progress: 0,
    budget: plan.basePrice,
    spent: 0,
    startDate,
    endDate,
    superintendent: input.superintendent?.trim() || "Tyler Brooks",
    sqft,
    beds: plan.beds,
    baths: plan.baths,
    description: `${elevationNote}${plan.description}`,
    planId: plan.id,
    milestones: [
      { name: "Plan set locked", date: startDate, done: true },
      {
        name: "Permit submitted",
        date: isoDate(addDays(start, 14)),
        done: false,
      },
      {
        name: "Ground break",
        date: startDate,
        done: false,
      },
      {
        name: "Substantial completion",
        date: endDate,
        done: false,
      },
    ],
    schedule,
  };

  // Draws from template
  const draws: ProgressDraw[] = plan.drawTemplate.map((d, i) => ({
    id: uid("dr"),
    projectId,
    name: d.name,
    pct: d.pct,
    amount: Math.round(plan.basePrice * d.pct),
    status: i === 0 ? "upcoming" : "upcoming",
    trigger: d.trigger,
    dueDate: i === 0 ? startDate : undefined,
  }));

  // Selections from allowances
  const selections: SelectionItem[] = plan.allowances.map((a) => ({
    id: uid("sel"),
    projectId,
    room: "Whole home",
    category: a.category,
    allowance: a.amount,
    status: "not_started",
    choice: a.notes,
  }));

  // Budget: default residential cost codes, weighted by rough construction split, plus allowance lines
  const hardCodes = defaultJobCostCodes("residential").filter((c) => !c.parentId);
  const allowanceTotal = plan.allowances.reduce((s, a) => s + a.amount, 0);
  const hardPool = Math.max(0, plan.basePrice - allowanceTotal);
  const weights = hardCodes.map((_, i) => {
    // Front-load site/foundation/framing
    const base = 1 + Math.max(0, 6 - i) * 0.15;
    return base;
  });
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const budgetLines: BudgetLine[] = [
    ...hardCodes.map((c, i) => ({
      id: uid("bl"),
      projectId,
      costCodeId: c.id,
      category: c.name,
      budgeted: Math.round((hardPool * weights[i]!) / wSum),
      committed: 0,
      actual: 0,
    })),
    ...plan.allowances.map((a) => ({
      id: uid("bl"),
      projectId,
      costCodeId: resolveCostCodeId(a.category),
      category: `Allowance · ${a.category}`,
      budgeted: a.amount,
      committed: 0,
      actual: 0,
    })),
  ];

  // Permit package skeleton (Jefferson County / EIPH path)
  const today = isoDate(new Date());
  const documents: DocumentItem[] = [
    {
      id: uid("doc"),
      title: "Building permit application — Jefferson County",
      type: "permit",
      projectId,
      status: "pending",
      updatedAt: today,
      author: project.superintendent,
      reference: "JC-BP-DRAFT",
    },
    {
      id: uid("doc"),
      title: "EIPH septic / health review",
      type: "permit",
      projectId,
      status: "pending",
      updatedAt: today,
      author: project.superintendent,
      reference: "EIPH-DRAFT",
    },
    {
      id: uid("doc"),
      title: "Construction contract (buyer-funded draws)",
      type: "contract",
      projectId,
      status: "pending",
      updatedAt: today,
      author: project.superintendent,
    },
    {
      id: uid("doc"),
      title: "Plan set — " + plan.code,
      type: "drawing",
      projectId,
      status: "approved",
      updatedAt: today,
      author: project.superintendent,
      reference: plan.code,
    },
  ];

  const closeout: CloseoutPackage = {
    id: uid("co"),
    projectId,
    punchOpen: 0,
    punchClosed: 0,
    notes: `Closeout staged from plan ${plan.code}. Complete after substantial completion.`,
    items: [
      { key: "substantial_completion", label: "Substantial completion certificate (G704-style)", status: "not_started", owner: project.superintendent },
      { key: "punch_list", label: "Punch list tracked to zero", status: "not_started", owner: project.superintendent },
      { key: "certificate_of_occupancy", label: "Certificate of occupancy", status: "not_started", owner: "City / County" },
      { key: "final_pay_app", label: "Final pay application / final draw", status: "not_started", owner: project.superintendent },
      { key: "lien_waivers", label: "Final lien waivers (GC + subs)", status: "not_started", owner: project.superintendent },
      { key: "as_builts", label: "As-builts / O&M manuals", status: "not_started", owner: project.superintendent },
      { key: "warranty_packet", label: "Warranty packet delivered", status: "not_started", owner: project.superintendent },
      { key: "keys_codes", label: "Keys, codes, remotes", status: "not_started", owner: project.superintendent },
      { key: "surety_consent", label: "Surety consent to final payment", status: "waived", owner: "—", notes: "Typical residential not bonded." },
      { key: "final_cleaning", label: "Final cleaning", status: "not_started", owner: "Crew" },
    ],
  };

  const activity: ActivityItem = {
    id: uid("a"),
    at: new Date().toISOString(),
    text: `Job started from Book of Plans · ${plan.code} (${plan.name})`,
    kind: "project",
  };

  return { project, client, draws, selections, budgetLines, documents, closeout, activity };
}
