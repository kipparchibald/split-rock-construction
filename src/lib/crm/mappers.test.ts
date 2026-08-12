import { describe, expect, it } from "vitest";
import {
  bidFromRow,
  bidToRow,
  clientFromRow,
  clientToRow,
  prospectFromRow,
  prospectToRow,
} from "./mappers";
import { isCrmServerPersistenceEnabled } from "./capabilities.server";

describe("crm mappers", () => {
  it("round-trips client fields", () => {
    const client = {
      id: "c1",
      name: "Test Client",
      email: "test@example.com",
      phone: "555-0100",
      type: "homeowner" as const,
      address: "1 Main St",
      notes: "VIP",
      portalToken: "ABC123",
      portalStatus: "invited" as const,
      portalInvitedAt: "2026-01-01",
    };
    const row = clientToRow("user-1", client);
    const back = clientFromRow({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      type: row.type,
      address: row.address,
      notes: row.notes,
      portal_token: row.portalToken,
      portal_status: row.portalStatus,
      portal_invited_at: row.portalInvitedAt,
      portal_last_login_at: null,
    });
    expect(back).toMatchObject(client);
  });

  it("round-trips prospect fields", () => {
    const prospect = {
      id: "pr1",
      name: "Lead",
      email: "lead@example.com",
      phone: "555",
      leadType: "lot_and_build" as const,
      stage: "new" as const,
      source: "website" as const,
      budgetBand: "500_650k" as const,
      timeline: "3_6mo" as const,
      interest: "Ranch on lot 12",
      notes: "",
      dualRoleFlag: false,
      dualRoleAcknowledged: false,
      score: 72,
      assignedTo: "Kipp",
      createdAt: "2026-07-01T00:00:00.000Z",
    };
    const row = prospectToRow("user-1", prospect);
    const back = prospectFromRow({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      lead_type: row.leadType,
      stage: row.stage,
      source: row.source,
      budget_band: row.budgetBand,
      timeline: row.timeline,
      interest: row.interest,
      notes: row.notes,
      dual_role_flag: row.dualRoleFlag,
      dual_role_acknowledged: row.dualRoleAcknowledged,
      score: row.score,
      lot_id: row.lotId,
      package_id: row.packageId,
      assigned_to: row.assignedTo,
      created_at: row.createdAt,
      last_contact_at: row.lastContactAt,
      lost_reason: row.lostReason,
      referral_agent: row.referralAgent,
      referral_brokerage: row.referralBrokerage,
    });
    expect(back).toMatchObject(prospect);
  });

  it("parses bid line items from json", () => {
    const bid = bidFromRow({
      id: "b1",
      client_id: "c1",
      title: "Custom home",
      type: "residential",
      status: "draft",
      amount: "450000",
      submitted_at: null,
      due_date: "2026-08-01",
      notes: "",
      line_items: [{ label: "Base", amount: 450000 }],
    });
    expect(bid.amount).toBe(450000);
    expect(bid.lineItems).toHaveLength(1);
    const row = bidToRow("user-1", bid);
    expect(row.lineItems[0]?.amount).toBe(450000);
  });
});

describe("isCrmServerPersistenceEnabled", () => {
  it("is false without DATABASE_URL", () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(isCrmServerPersistenceEnabled()).toBe(false);
    if (prev) process.env.DATABASE_URL = prev;
  });

  it("is true when DATABASE_URL is set", () => {
    const prev = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://example";
    expect(isCrmServerPersistenceEnabled()).toBe(true);
    if (prev) process.env.DATABASE_URL = prev;
    else delete process.env.DATABASE_URL;
  });
});
