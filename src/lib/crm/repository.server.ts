import { getSql } from "@/lib/db";
import type { Bid, Client, Project, Proposal, Prospect, Tour } from "@/data/types";
import type { CrmSnapshot } from "./mappers";
import {
  bidFromRow,
  bidToRow,
  clientFromRow,
  clientToRow,
  projectFromRow,
  projectToRow,
  proposalFromRow,
  proposalToRow,
  prospectFromRow,
  prospectToRow,
  tourFromRow,
  tourToRow,
} from "./mappers";

export async function loadCrmSnapshot(userId: string): Promise<CrmSnapshot> {
  const sql = await getSql();
  const [clients, prospects, projects, bids, tours, proposals] = await Promise.all([
    sql`select * from crm_clients where user_id = ${userId} order by updated_at desc`,
    sql`select * from crm_prospects where user_id = ${userId} order by created_at desc`,
    sql`select * from crm_projects where user_id = ${userId} order by updated_at desc`,
    sql`select * from crm_bids where user_id = ${userId} order by updated_at desc`,
    sql`select * from crm_tours where user_id = ${userId} order by at desc`,
    sql`select * from crm_proposals where user_id = ${userId} order by created_at desc`,
  ]);
  return {
    clients: clients.map((r) => clientFromRow(r as Parameters<typeof clientFromRow>[0])),
    prospects: prospects.map((r) => prospectFromRow(r as Parameters<typeof prospectFromRow>[0])),
    projects: projects.map((r) => projectFromRow(r as Parameters<typeof projectFromRow>[0])),
    bids: bids.map((r) => bidFromRow(r as Parameters<typeof bidFromRow>[0])),
    tours: tours.map((r) => tourFromRow(r as Parameters<typeof tourFromRow>[0])),
    proposals: proposals.map((r) => proposalFromRow(r as Parameters<typeof proposalFromRow>[0])),
  };
}

export async function upsertClient(userId: string, client: Client): Promise<void> {
  const sql = await getSql();
  const row = clientToRow(userId, client);
  await sql`
    insert into crm_clients (
      id, user_id, name, email, phone, type, address, notes,
      portal_token, portal_status, portal_invited_at, portal_last_login_at, updated_at
    ) values (
      ${row.id}, ${row.userId}, ${row.name}, ${row.email}, ${row.phone}, ${row.type},
      ${row.address}, ${row.notes}, ${row.portalToken}, ${row.portalStatus},
      ${row.portalInvitedAt}, ${row.portalLastLoginAt}, now()
    )
    on conflict (user_id, id) do update set
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      type = excluded.type,
      address = excluded.address,
      notes = excluded.notes,
      portal_token = excluded.portal_token,
      portal_status = excluded.portal_status,
      portal_invited_at = excluded.portal_invited_at,
      portal_last_login_at = excluded.portal_last_login_at,
      updated_at = now()
  `;
}

export async function deleteClient(userId: string, id: string): Promise<void> {
  const sql = await getSql();
  await sql`delete from crm_clients where user_id = ${userId} and id = ${id}`;
}

export async function upsertProspect(userId: string, prospect: Prospect): Promise<void> {
  const sql = await getSql();
  const row = prospectToRow(userId, prospect);
  await sql`
    insert into crm_prospects (
      id, user_id, name, email, phone, lead_type, stage, source, budget_band, timeline,
      interest, notes, dual_role_flag, dual_role_acknowledged, score, lot_id, package_id,
      assigned_to, created_at, last_contact_at, lost_reason, referral_agent, referral_brokerage,
      updated_at
    ) values (
      ${row.id}, ${row.userId}, ${row.name}, ${row.email}, ${row.phone}, ${row.leadType},
      ${row.stage}, ${row.source}, ${row.budgetBand}, ${row.timeline}, ${row.interest},
      ${row.notes}, ${row.dualRoleFlag}, ${row.dualRoleAcknowledged}, ${row.score},
      ${row.lotId}, ${row.packageId}, ${row.assignedTo}, ${row.createdAt},
      ${row.lastContactAt}, ${row.lostReason}, ${row.referralAgent}, ${row.referralBrokerage},
      now()
    )
    on conflict (user_id, id) do update set
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      lead_type = excluded.lead_type,
      stage = excluded.stage,
      source = excluded.source,
      budget_band = excluded.budget_band,
      timeline = excluded.timeline,
      interest = excluded.interest,
      notes = excluded.notes,
      dual_role_flag = excluded.dual_role_flag,
      dual_role_acknowledged = excluded.dual_role_acknowledged,
      score = excluded.score,
      lot_id = excluded.lot_id,
      package_id = excluded.package_id,
      assigned_to = excluded.assigned_to,
      last_contact_at = excluded.last_contact_at,
      lost_reason = excluded.lost_reason,
      referral_agent = excluded.referral_agent,
      referral_brokerage = excluded.referral_brokerage,
      updated_at = now()
  `;
}

export async function deleteProspect(userId: string, id: string): Promise<void> {
  const sql = await getSql();
  await sql`delete from crm_prospects where user_id = ${userId} and id = ${id}`;
}

export async function upsertProject(userId: string, project: Project): Promise<void> {
  const sql = await getSql();
  const row = projectToRow(userId, project);
  await sql`
    insert into crm_projects (
      id, user_id, client_id, name, address, type, status, phase, progress, budget, spent,
      start_date, end_date, superintendent, sqft, beds, baths, description, milestones, schedule,
      plan_id, matterport_id, updated_at
    ) values (
      ${row.id}, ${row.userId}, ${row.clientId}, ${row.name}, ${row.address}, ${row.type},
      ${row.status}, ${row.phase}, ${row.progress}, ${row.budget}, ${row.spent},
      ${row.startDate}, ${row.endDate}, ${row.superintendent}, ${row.sqft}, ${row.beds},
      ${row.baths}, ${row.description}, ${JSON.stringify(row.milestones)}::jsonb,
      ${JSON.stringify(row.schedule)}::jsonb, ${row.planId}, ${row.matterportId}, now()
    )
    on conflict (user_id, id) do update set
      client_id = excluded.client_id,
      name = excluded.name,
      address = excluded.address,
      type = excluded.type,
      status = excluded.status,
      phase = excluded.phase,
      progress = excluded.progress,
      budget = excluded.budget,
      spent = excluded.spent,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      superintendent = excluded.superintendent,
      sqft = excluded.sqft,
      beds = excluded.beds,
      baths = excluded.baths,
      description = excluded.description,
      milestones = excluded.milestones,
      schedule = excluded.schedule,
      plan_id = excluded.plan_id,
      matterport_id = excluded.matterport_id,
      updated_at = now()
  `;
}

export async function upsertBid(userId: string, bid: Bid): Promise<void> {
  const sql = await getSql();
  const row = bidToRow(userId, bid);
  await sql`
    insert into crm_bids (
      id, user_id, client_id, title, type, status, amount, submitted_at, due_date, notes,
      line_items, updated_at
    ) values (
      ${row.id}, ${row.userId}, ${row.clientId}, ${row.title}, ${row.type}, ${row.status},
      ${row.amount}, ${row.submittedAt}, ${row.dueDate}, ${row.notes},
      ${JSON.stringify(row.lineItems)}::jsonb, now()
    )
    on conflict (user_id, id) do update set
      client_id = excluded.client_id,
      title = excluded.title,
      type = excluded.type,
      status = excluded.status,
      amount = excluded.amount,
      submitted_at = excluded.submitted_at,
      due_date = excluded.due_date,
      notes = excluded.notes,
      line_items = excluded.line_items,
      updated_at = now()
  `;
}

export async function upsertTour(userId: string, tour: Tour): Promise<void> {
  const sql = await getSql();
  const row = tourToRow(userId, tour);
  await sql`
    insert into crm_tours (
      id, user_id, prospect_id, kind, at, location, status, notes, host, updated_at
    ) values (
      ${row.id}, ${row.userId}, ${row.prospectId}, ${row.kind}, ${row.at}, ${row.location},
      ${row.status}, ${row.notes}, ${row.host}, now()
    )
    on conflict (user_id, id) do update set
      prospect_id = excluded.prospect_id,
      kind = excluded.kind,
      at = excluded.at,
      location = excluded.location,
      status = excluded.status,
      notes = excluded.notes,
      host = excluded.host,
      updated_at = now()
  `;
}

export async function upsertProposal(userId: string, proposal: Proposal): Promise<void> {
  const sql = await getSql();
  const row = proposalToRow(userId, proposal);
  await sql`
    insert into crm_proposals (
      id, user_id, prospect_id, lot_id, package_id, lot_price, build_price, soft_costs,
      extras, total, status, created_at, valid_until, notes, updated_at
    ) values (
      ${row.id}, ${row.userId}, ${row.prospectId}, ${row.lotId}, ${row.packageId},
      ${row.lotPrice}, ${row.buildPrice}, ${row.softCosts}, ${row.extras}, ${row.total},
      ${row.status}, ${row.createdAt}, ${row.validUntil}, ${row.notes}, now()
    )
    on conflict (user_id, id) do update set
      prospect_id = excluded.prospect_id,
      lot_id = excluded.lot_id,
      package_id = excluded.package_id,
      lot_price = excluded.lot_price,
      build_price = excluded.build_price,
      soft_costs = excluded.soft_costs,
      extras = excluded.extras,
      total = excluded.total,
      status = excluded.status,
      valid_until = excluded.valid_until,
      notes = excluded.notes,
      updated_at = now()
  `;
}
