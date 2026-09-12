import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyExact } from "./utils";
import { HOLWEGE_CONTRACT, HOLWEGE_DRAW_BASE } from "@/data/holwege-money";

describe("formatCurrencyExact", () => {
  it("shows Holwege contract with exact cents (no round-to-dollar)", () => {
    expect(HOLWEGE_CONTRACT).toBe(689_299.65);
    expect(formatCurrencyExact(HOLWEGE_CONTRACT)).toBe("$689,299.65");
    expect(formatCurrencyExact(HOLWEGE_CONTRACT)).not.toBe("$689,300");
    // whole-dollar helper still rounds (documents the bug we fixed for Holwege displays)
    expect(formatCurrency(HOLWEGE_CONTRACT)).toBe("$689,300");
  });

  it("shows draw base with exact cents", () => {
    expect(formatCurrencyExact(HOLWEGE_DRAW_BASE)).toBe("$659,330.10");
  });
});
