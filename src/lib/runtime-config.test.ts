import { describe, expect, it } from "vitest";
import { parseDemoFlag } from "./runtime-config";

describe("parseDemoFlag (VITE_SPLIT_ROCK_DEMO)", () => {
  it("defaults to true when unset (sandbox preview)", () => {
    expect(parseDemoFlag(undefined)).toBe(true);
  });

  it("is true for true/TRUE (production owner tryout)", () => {
    expect(parseDemoFlag("true")).toBe(true);
    expect(parseDemoFlag("TRUE")).toBe(true);
  });

  it("is false for false (live publish)", () => {
    expect(parseDemoFlag("false")).toBe(false);
  });

  it("treats 0 and off as disabled", () => {
    expect(parseDemoFlag("0")).toBe(false);
    expect(parseDemoFlag("off")).toBe(false);
    expect(parseDemoFlag("OFF")).toBe(false);
  });
});
