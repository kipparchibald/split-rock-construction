import { describe, expect, it } from "vitest";
import { nextDualRoleAction } from "./closing";
import type { CloseoutPackage, RealtyDeal } from "@/data/types";

describe("nextDualRoleAction", () => {
  it("prioritizes dual-capacity disclosure", () => {
    const deals = [
      {
        id: "r1",
        projectId: "p1",
        status: "under_contract",
        dualCapacity: "pending_disclosure",
        agencyRole: "owner_agent",
        brokerage: "x",
        agentName: "y",
        earnestHeldBy: "trust",
        trustAccountNote: "",
        items: [],
        notes: "",
      },
    ] as unknown as RealtyDeal[];
    const n = nextDualRoleAction({ packages: [], deals });
    expect(n.severity).toBe("high");
    expect(n.title).toMatch(/Dual-capacity/i);
  });

  it("flags open punch", () => {
    const packages = [
      {
        id: "c1",
        projectId: "p3",
        punchOpen: 2,
        punchClosed: 1,
        notes: "",
        items: [{ key: "punch_list", label: "Punch", status: "in_progress", owner: "A" }],
      },
    ] as unknown as CloseoutPackage[];
    const n = nextDualRoleAction({ packages, deals: [] });
    expect(n.title).toMatch(/punch/i);
  });
});
