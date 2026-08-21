import { describe, expect, it } from "vitest";
import { parseDemoFlag, resolveDemoDataEnabled } from "./runtime-config";

describe("parseDemoFlag (VITE_SPLIT_ROCK_DEMO)", () => {
  it("defaults to true when unset (legacy parse)", () => {
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

describe("resolveDemoDataEnabled", () => {
  it("honors explicit false in production", () => {
    expect(resolveDemoDataEnabled("false", true)).toBe(false);
  });

  it("honors explicit true in production (training deploy)", () => {
    expect(resolveDemoDataEnabled("true", true)).toBe(true);
  });

  it("defaults production builds to live when env unset", () => {
    expect(resolveDemoDataEnabled(undefined, true)).toBe(false);
  });

  it("defaults dev/preview to demo when env unset", () => {
    expect(resolveDemoDataEnabled(undefined, false)).toBe(true);
  });
});
