import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS, DEFAULT_COSTS, calcPrice } from "@/lib/pricing";
import {
  buildJobFromBid,
  estimateToBidLineItems,
  jobNameFromBidTitle,
} from "@/lib/start-from-bid";
import type { Bid } from "@/data/types";

describe("jobNameFromBidTitle", () => {
  it("strips bid suffixes", () => {
    expect(jobNameFromBidTitle("Hart Residence — Base Bid")).toBe("Hart Residence");
    expect(jobNameFromBidTitle("Commerce Park Shell — Design Assist")).toBe("Commerce Park Shell");
  });
});

describe("estimateToBidLineItems", () => {
  it("maps cost buckets and markup to line items", () => {
    const price = calcPrice(DEFAULT_COSTS, DEFAULT_ASSUMPTIONS, 2400);
    const items = estimateToBidLineItems(DEFAULT_COSTS, price);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.label.includes("Foundation"))).toBe(true);
    const sum = items.reduce((s, i) => s + i.amount, 0);
    expect(sum).toBeGreaterThan(price.hardCosts);
  });
});

describe("buildJobFromBid", () => {
  const bid: Bid = {
    id: "b-test",
    title: "Test Ranch — Base Bid",
    clientId: "c-test",
    type: "residential",
    status: "won",
    amount: 500000,
    dueDate: "2026-09-01",
    notes: "Awarded from estimator",
    lineItems: [
      { label: "Site work", amount: 40000 },
      { label: "Foundation", amount: 60000 },
      { label: "Structure", amount: 150000 },
      { label: "Finishes", amount: 120000 },
      { label: "OH&P", amount: 130000 },
    ],
  };

  it("creates a full job package without a plan", () => {
    const built = buildJobFromBid({
      bid,
      client: { id: "c-test", name: "Test Client", address: "123 Main, Rigby" },
    });
    expect(built.project.name).toBe("Test Ranch");
    expect(built.project.budget).toBe(500000);
    expect(built.draws.length).toBeGreaterThan(0);
    expect(built.selections.length).toBeGreaterThan(0);
    expect(built.budgetLines).toHaveLength(5);
    expect(built.documents.length).toBeGreaterThan(0);
    expect(built.closeout.items.length).toBeGreaterThan(0);
    expect(built.project.schedule.length).toBeGreaterThan(0);
  });
});
