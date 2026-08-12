import type { Bid, Client, Project, Proposal, Prospect, Tour } from "@/data/types";

export type CrmSnapshot = {
  clients: Client[];
  prospects: Prospect[];
  projects: Project[];
  bids: Bid[];
  tours: Tour[];
  proposals: Proposal[];
};

type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  address: string;
  notes: string;
  portal_token: string | null;
  portal_status: string | null;
  portal_invited_at: string | null;
  portal_last_login_at: string | null;
};

type ProspectRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lead_type: string;
  stage: string;
  source: string;
  budget_band: string;
  timeline: string;
  interest: string;
  notes: string;
  dual_role_flag: boolean;
  dual_role_acknowledged: boolean;
  score: number;
  lot_id: string | null;
  package_id: string | null;
  assigned_to: string;
  created_at: string;
  last_contact_at: string | null;
  lost_reason: string | null;
  referral_agent: string | null;
  referral_brokerage: string | null;
};

type ProjectRow = {
  id: string;
  client_id: string;
  name: string;
  address: string;
  type: string;
  status: string;
  phase: string;
  progress: number;
  budget: string | number;
  spent: string | number;
  start_date: string;
  end_date: string;
  superintendent: string;
  sqft: number;
  beds: number | null;
  baths: string | number | null;
  description: string;
  milestones: unknown;
  schedule: unknown;
  plan_id: string | null;
  matterport_id: string | null;
};

type BidRow = {
  id: string;
  client_id: string;
  title: string;
  type: string;
  status: string;
  amount: string | number;
  submitted_at: string | null;
  due_date: string;
  notes: string;
  line_items: unknown;
};

type TourRow = {
  id: string;
  prospect_id: string;
  kind: string;
  at: string;
  location: string;
  status: string;
  notes: string;
  host: string;
};

type ProposalRow = {
  id: string;
  prospect_id: string;
  lot_id: string | null;
  package_id: string | null;
  lot_price: string | number;
  build_price: string | number;
  soft_costs: string | number;
  extras: string | number;
  total: string | number;
  status: string;
  created_at: string;
  valid_until: string;
  notes: string;
};

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v) || 0;
}

export function clientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    type: row.type as Client["type"],
    address: row.address,
    notes: row.notes,
    portalToken: row.portal_token ?? undefined,
    portalStatus: (row.portal_status ?? "none") as Client["portalStatus"],
    portalInvitedAt: row.portal_invited_at ?? undefined,
    portalLastLoginAt: row.portal_last_login_at ?? undefined,
  };
}

export function clientToRow(userId: string, client: Client) {
  return {
    id: client.id,
    userId,
    name: client.name,
    email: client.email,
    phone: client.phone,
    type: client.type,
    address: client.address,
    notes: client.notes,
    portalToken: client.portalToken ?? null,
    portalStatus: client.portalStatus ?? "none",
    portalInvitedAt: client.portalInvitedAt ?? null,
    portalLastLoginAt: client.portalLastLoginAt ?? null,
  };
}

export function prospectFromRow(row: ProspectRow): Prospect {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    leadType: row.lead_type as Prospect["leadType"],
    stage: row.stage as Prospect["stage"],
    source: row.source as Prospect["source"],
    budgetBand: row.budget_band as Prospect["budgetBand"],
    timeline: row.timeline as Prospect["timeline"],
    interest: row.interest,
    notes: row.notes,
    dualRoleFlag: row.dual_role_flag,
    dualRoleAcknowledged: row.dual_role_acknowledged,
    score: row.score,
    lotId: row.lot_id ?? undefined,
    packageId: row.package_id ?? undefined,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    lastContactAt: row.last_contact_at ?? undefined,
    lostReason: row.lost_reason ?? undefined,
    referralAgent: row.referral_agent ?? undefined,
    referralBrokerage: row.referral_brokerage ?? undefined,
  };
}

export function prospectToRow(userId: string, prospect: Prospect) {
  return {
    id: prospect.id,
    userId,
    name: prospect.name,
    email: prospect.email,
    phone: prospect.phone,
    leadType: prospect.leadType,
    stage: prospect.stage,
    source: prospect.source,
    budgetBand: prospect.budgetBand,
    timeline: prospect.timeline,
    interest: prospect.interest,
    notes: prospect.notes,
    dualRoleFlag: prospect.dualRoleFlag,
    dualRoleAcknowledged: prospect.dualRoleAcknowledged,
    score: prospect.score,
    lotId: prospect.lotId ?? null,
    packageId: prospect.packageId ?? null,
    assignedTo: prospect.assignedTo,
    createdAt: prospect.createdAt,
    lastContactAt: prospect.lastContactAt ?? null,
    lostReason: prospect.lostReason ?? null,
    referralAgent: prospect.referralAgent ?? null,
    referralBrokerage: prospect.referralBrokerage ?? null,
  };
}

export function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    clientId: row.client_id,
    type: row.type as Project["type"],
    status: row.status as Project["status"],
    phase: row.phase as Project["phase"],
    progress: row.progress,
    budget: num(row.budget),
    spent: num(row.spent),
    startDate: row.start_date,
    endDate: row.end_date,
    superintendent: row.superintendent,
    sqft: row.sqft,
    beds: row.beds ?? undefined,
    baths: row.baths != null ? num(row.baths) : undefined,
    description: row.description,
    milestones: Array.isArray(row.milestones) ? (row.milestones as Project["milestones"]) : [],
    schedule: Array.isArray(row.schedule) ? (row.schedule as Project["schedule"]) : [],
    planId: row.plan_id ?? undefined,
    matterportId: row.matterport_id ?? undefined,
  };
}

export function projectToRow(userId: string, project: Project) {
  return {
    id: project.id,
    userId,
    clientId: project.clientId,
    name: project.name,
    address: project.address,
    type: project.type,
    status: project.status,
    phase: project.phase,
    progress: project.progress,
    budget: project.budget,
    spent: project.spent,
    startDate: project.startDate,
    endDate: project.endDate,
    superintendent: project.superintendent,
    sqft: project.sqft,
    beds: project.beds ?? null,
    baths: project.baths ?? null,
    description: project.description,
    milestones: project.milestones,
    schedule: project.schedule,
    planId: project.planId ?? null,
    matterportId: project.matterportId ?? null,
  };
}

export function bidFromRow(row: BidRow): Bid {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    type: row.type as Bid["type"],
    status: row.status as Bid["status"],
    amount: num(row.amount),
    submittedAt: row.submitted_at ?? undefined,
    dueDate: row.due_date,
    notes: row.notes,
    lineItems: Array.isArray(row.line_items) ? (row.line_items as Bid["lineItems"]) : [],
  };
}

export function bidToRow(userId: string, bid: Bid) {
  return {
    id: bid.id,
    userId,
    clientId: bid.clientId,
    title: bid.title,
    type: bid.type,
    status: bid.status,
    amount: bid.amount,
    submittedAt: bid.submittedAt ?? null,
    dueDate: bid.dueDate,
    notes: bid.notes,
    lineItems: bid.lineItems,
  };
}

export function tourFromRow(row: TourRow): Tour {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    kind: row.kind as Tour["kind"],
    at: row.at,
    location: row.location,
    status: row.status as Tour["status"],
    notes: row.notes,
    host: row.host,
  };
}

export function tourToRow(userId: string, tour: Tour) {
  return {
    id: tour.id,
    userId,
    prospectId: tour.prospectId,
    kind: tour.kind,
    at: tour.at,
    location: tour.location,
    status: tour.status,
    notes: tour.notes,
    host: tour.host,
  };
}

export function proposalFromRow(row: ProposalRow): Proposal {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    lotId: row.lot_id ?? undefined,
    packageId: row.package_id ?? undefined,
    lotPrice: num(row.lot_price),
    buildPrice: num(row.build_price),
    softCosts: num(row.soft_costs),
    extras: num(row.extras),
    total: num(row.total),
    status: row.status as Proposal["status"],
    createdAt: row.created_at,
    validUntil: row.valid_until,
    notes: row.notes,
  };
}

export function proposalToRow(userId: string, proposal: Proposal) {
  return {
    id: proposal.id,
    userId,
    prospectId: proposal.prospectId,
    lotId: proposal.lotId ?? null,
    packageId: proposal.packageId ?? null,
    lotPrice: proposal.lotPrice,
    buildPrice: proposal.buildPrice,
    softCosts: proposal.softCosts,
    extras: proposal.extras,
    total: proposal.total,
    status: proposal.status,
    createdAt: proposal.createdAt,
    validUntil: proposal.validUntil,
    notes: proposal.notes,
  };
}
