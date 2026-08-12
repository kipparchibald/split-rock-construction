import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { isCrmServerPersistenceEnabled } from "./capabilities.server";
import {
  deleteClient,
  deleteProspect,
  loadCrmSnapshot,
  upsertBid,
  upsertClient,
  upsertProject,
  upsertProposal,
  upsertProspect,
  upsertTour,
} from "./repository.server";
import type { Project } from "@/data/types";
import type { CrmSnapshot } from "./mappers";

const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  type: z.enum(["homeowner", "developer", "commercial"]),
  address: z.string(),
  notes: z.string(),
  portalToken: z.string().optional(),
  portalStatus: z.enum(["none", "invited", "active", "revoked"]).optional(),
  portalInvitedAt: z.string().optional(),
  portalLastLoginAt: z.string().optional(),
});

const prospectSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  leadType: z.enum(["lot_only", "lot_and_build", "custom_own_land", "commercial", "referral"]),
  stage: z.enum([
    "new", "contacted", "tour_scheduled", "tour_done", "qualified", "lot_hold",
    "proposal_sent", "bid", "won", "lost",
  ]),
  source: z.enum([
    "website", "teton_estimator", "model_home", "yard_sign", "referral_agent",
    "social", "open_house", "phone", "other",
  ]),
  budgetBand: z.enum(["under_400k", "400_500k", "500_650k", "650_800k", "800k_plus", "unknown"]),
  timeline: z.enum(["0_3mo", "3_6mo", "6_12mo", "12mo_plus", "browsing"]),
  interest: z.string(),
  notes: z.string(),
  dualRoleFlag: z.boolean(),
  dualRoleAcknowledged: z.boolean(),
  score: z.number(),
  lotId: z.string().optional(),
  packageId: z.string().optional(),
  assignedTo: z.string(),
  createdAt: z.string(),
  lastContactAt: z.string().optional(),
  lostReason: z.string().optional(),
  referralAgent: z.string().optional(),
  referralBrokerage: z.string().optional(),
});

const milestoneSchema = z.object({
  name: z.string(),
  date: z.string(),
  done: z.boolean(),
});

const scheduleSchema = z.object({
  phase: z.string(),
  start: z.string(),
  end: z.string(),
  pct: z.number(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  clientId: z.string(),
  type: z.enum(["residential", "commercial"]),
  status: z.enum(["planning", "permitting", "in_progress", "punch_list", "complete", "on_hold"]),
  phase: z.string(),
  progress: z.number(),
  budget: z.number(),
  spent: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  superintendent: z.string(),
  sqft: z.number(),
  beds: z.number().optional(),
  baths: z.number().optional(),
  description: z.string(),
  milestones: z.array(milestoneSchema),
  schedule: z.array(scheduleSchema),
  planId: z.string().optional(),
  matterportId: z.string().optional(),
});

const bidSchema = z.object({
  id: z.string(),
  title: z.string(),
  clientId: z.string(),
  type: z.enum(["residential", "commercial"]),
  status: z.enum(["draft", "submitted", "won", "lost", "expired"]),
  amount: z.number(),
  submittedAt: z.string().optional(),
  dueDate: z.string(),
  notes: z.string(),
  lineItems: z.array(z.object({ label: z.string(), amount: z.number() })),
});

const tourSchema = z.object({
  id: z.string(),
  prospectId: z.string(),
  kind: z.enum(["model_home", "lot_walk", "custom_consult", "commercial_walk"]),
  at: z.string(),
  location: z.string(),
  status: z.enum(["scheduled", "completed", "no_show", "cancelled"]),
  notes: z.string(),
  host: z.string(),
});

const proposalSchema = z.object({
  id: z.string(),
  prospectId: z.string(),
  lotId: z.string().optional(),
  packageId: z.string().optional(),
  lotPrice: z.number(),
  buildPrice: z.number(),
  softCosts: z.number(),
  extras: z.number(),
  total: z.number(),
  status: z.enum(["draft", "sent", "accepted", "expired"]),
  createdAt: z.string(),
  validUntil: z.string(),
  notes: z.string(),
});

/** Client-safe CRM capability probe (no auth required). */
export const getCrmCapabilities = createServerFn({ method: "GET" }).handler(async () => ({
  serverPersistence: isCrmServerPersistenceEnabled(),
}));

/** Load all CRM entities for the signed-in operator. */
export const fetchCrmSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CrmSnapshot> => {
    if (!isCrmServerPersistenceEnabled()) {
      return { clients: [], prospects: [], projects: [], bids: [], tours: [], proposals: [] };
    }
    return loadCrmSnapshot(context.userId);
  });

export const saveCrmClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(clientSchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await upsertClient(context.userId, data);
    return { ok: true as const };
  });

export const removeCrmClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await deleteClient(context.userId, data.id);
    return { ok: true as const };
  });

export const saveCrmProspect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(prospectSchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await upsertProspect(context.userId, data);
    return { ok: true as const };
  });

export const removeCrmProspect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await deleteProspect(context.userId, data.id);
    return { ok: true as const };
  });

export const saveCrmProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(projectSchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await upsertProject(context.userId, data as Project);
    return { ok: true as const };
  });

export const saveCrmBid = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(bidSchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await upsertBid(context.userId, data);
    return { ok: true as const };
  });

export const saveCrmTour = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(tourSchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await upsertTour(context.userId, data);
    return { ok: true as const };
  });

export const saveCrmProposal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(proposalSchema)
  .handler(async ({ context, data }) => {
    if (!isCrmServerPersistenceEnabled()) return { ok: true as const };
    await upsertProposal(context.userId, data);
    return { ok: true as const };
  });
