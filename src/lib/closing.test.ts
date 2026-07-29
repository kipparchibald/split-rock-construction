import { describe, expect, it } from "vitest";
import { closeoutReady, dualCloseReady, itemProgress, realtyReady } from "./closing";
import type { CloseoutPackage, RealtyDeal } from "@/data/types";

const baseCloseout = (over: Partial<CloseoutPackage> = {}): CloseoutPackage => ({
  id: "c",
  projectId: "p",
  punchOpen: 0,
  punchClosed: 10,
  notes: "",
  items: [
    { key: "substantial_completion", label: "SC", status: "complete", owner: "A" },
    { key: "certificate_of_occupancy", label: "CO", status: "complete", owner: "A" },
    { key: "lien_waivers", label: "Liens", status: "complete", owner: "A" },
    { key: "punch_list", label: "Punch", status: "complete", owner: "A" },
  ],
  ...over,
});

const baseDeal = (over: Partial<RealtyDeal> = {}): RealtyDeal => ({
  id: "r",
  projectId: "p",
  status: "pending_close",
  agencyRole: "seller_agent",
  dualCapacity: "disclosed",
  brokerage: "Demo",
  agentName: "Agent",
  earnestHeldBy: "Brokerage trust account",
  trustAccountNote: "trust only",
  notes: "",
  items: [
    { key: "purchase_sale_agreement", label: "P&S", status: "complete", systemOfRecord: "e-sign" },
    { key: "dual_capacity_disclosure", label: "Dual", status: "complete", systemOfRecord: "e-sign" },
  ],
  ...over,
});

describe("itemProgress", () => {
  it("ignores waived and n_a", () => {
    const p = itemProgress([
      { status: "complete" },
      { status: "waived" },
      { status: "n_a" },
      { status: "not_started" },
    ]);
    expect(p.done).toBe(1);
    expect(p.total).toBe(2);
    expect(p.pct).toBe(50);
  });
});

describe("closeoutReady", () => {
  it("passes when substantial, CO, liens, punch clear", () => {
    expect(closeoutReady(baseCloseout()).constructionGate).toBe(true);
  });

  it("fails when punch open", () => {
    expect(closeoutReady(baseCloseout({ punchOpen: 3 })).constructionGate).toBe(false);
  });

  it("fails without lien waivers", () => {
    const pkg = baseCloseout();
    pkg.items = pkg.items.map((i) =>
      i.key === "lien_waivers" ? { ...i, status: "in_progress" } : i,
    );
    expect(closeoutReady(pkg).constructionGate).toBe(false);
  });
});

describe("realtyReady", () => {
  it("requires dual disclosure when dual-role", () => {
    expect(realtyReady(baseDeal({ dualCapacity: "pending_disclosure" })).dualOk).toBe(false);
    expect(realtyReady(baseDeal({ dualCapacity: "disclosed" })).dualOk).toBe(true);
  });
});

describe("dualCloseReady", () => {
  it("construction-only when realty n/a", () => {
    const r = dualCloseReady(
      baseCloseout(),
      baseDeal({ status: "n_a", dualCapacity: "not_applicable" }),
    );
    expect(r.ready).toBe(true);
  });

  it("blocks dual sale without construction gate", () => {
    const r = dualCloseReady(baseCloseout({ punchOpen: 2 }), baseDeal());
    expect(r.ready).toBe(false);
    expect(r.reason).toMatch(/construction/i);
  });

  it("clears when both gates pass", () => {
    const r = dualCloseReady(baseCloseout(), baseDeal());
    expect(r.ready).toBe(true);
  });
});
