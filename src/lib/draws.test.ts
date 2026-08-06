import { describe, expect, it } from "vitest";
import type { ProgressDraw } from "@/data/types";
import { sortDrawsForQueue, summarizeDraws } from "./draws";

const sample: ProgressDraw[] = [
  { id: "1", projectId: "p1", name: "Deposit", pct: 0.1, amount: 10000, status: "paid", trigger: "Signed" },
  { id: "2", projectId: "p1", name: "Foundation", pct: 0.2, amount: 20000, status: "ready", trigger: "Inspected" },
  { id: "3", projectId: "p1", name: "Shell", pct: 0.3, amount: 30000, status: "upcoming", trigger: "Dry-in" },
  { id: "4", projectId: "p1", name: "Finishes", pct: 0.4, amount: 40000, status: "held", trigger: "Cabinets" },
];

describe("summarizeDraws", () => {
  it("totals cash buckets and finds next action (held first)", () => {
    const s = summarizeDraws(sample);
    expect(s.total).toBe(100000);
    expect(s.paid).toBe(10000);
    expect(s.ready).toBe(20000);
    expect(s.held).toBe(40000);
    expect(s.remaining).toBe(90000);
    expect(s.paidPct).toBe(10);
    expect(s.nextAction?.id).toBe("4");
    expect(s.nextActionLabel).toMatch(/hold/i);
  });
});

describe("sortDrawsForQueue", () => {
  it("orders held → ready → submitted → upcoming → paid", () => {
    const sorted = sortDrawsForQueue(sample);
    expect(sorted.map((d) => d.status)).toEqual(["held", "ready", "upcoming", "paid"]);
  });
});
