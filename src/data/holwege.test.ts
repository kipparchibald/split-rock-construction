import { describe, expect, it } from "vitest";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_LAND_PAID,
  HOLWEGE_LAND_NOTE,
  HOLWEGE_PORTAL_TOKEN,
  holwegeClient,
  holwegeDraws,
  holwegePackage,
  holwegeProject,
} from "./holwege";

describe("Holwege SOR seed (SRC-2)", () => {
  it("sets construction budget to verified contract total", () => {
    expect(holwegeProject.budget).toBe(689_299.65);
    expect(holwegeProject.budget).toBe(HOLWEGE_CONTRACT);
  });

  it("excludes land $98k from project.budget", () => {
    expect(holwegeProject.budget).not.toBe(HOLWEGE_CONTRACT + HOLWEGE_LAND_PAID);
    expect(holwegeProject.budget + HOLWEGE_LAND_PAID).toBe(787_299.65);
    expect(HOLWEGE_LAND_NOTE.toLowerCase()).toMatch(/not in/);
    expect(holwegeProject.description).toMatch(/Land closed separately/i);
    expect(holwegeClient.notes).toMatch(/98,?000/);
  });

  it("uses verified draw schedule amounts from the construction agreement", () => {
    expect(HOLWEGE_DRAW_BASE).toBe(659_330.1);
    const draws15 = holwegeDraws.filter((d) => d.id !== "pd-holwege-6");
    expect(draws15).toHaveLength(5);
    expect(draws15.map((d) => d.amount)).toEqual([
      65_933.01, 65_933.01, 131_866.02, 131_866.02, 230_765.54,
    ]);
    // Draws 1–5 are 95% of draw base; Draw 6 is the 5% retainage-style closeout line
    const sum15 = draws15.reduce((s, d) => s + d.amount, 0);
    expect(Math.abs(sum15 - HOLWEGE_DRAW_BASE * 0.95)).toBeLessThanOrEqual(0.02);
    const sumAll = holwegeDraws.reduce((s, d) => s + d.amount, 0);
    expect(Math.abs(sumAll - HOLWEGE_DRAW_BASE)).toBeLessThanOrEqual(0.02);
    expect(holwegeDraws[5]?.amount).toBe(32_966.5);
  });

  it("wires owner portal invite for Holwege client", () => {
    expect(holwegeClient.email).toBe("holwegefam@comcast.net");
    expect(holwegeClient.portalToken).toBe(HOLWEGE_PORTAL_TOKEN);
    expect(holwegeClient.portalToken).toBeTruthy();
    expect(holwegeClient.portalStatus).toBe("invited");
    expect(holwegeProject.clientId).toBe(holwegeClient.id);
  });

  it("package budget lines sum to construction contract", () => {
    const sum = holwegePackage.budgetLines.reduce((s, b) => s + b.budgeted, 0);
    expect(Math.abs(sum - HOLWEGE_CONTRACT)).toBeLessThanOrEqual(0.02);
  });
});
