import { describe, expect, it } from "vitest";
import { clampText, safeInternalHref, safeNonNegNumber } from "./security";

describe("safeInternalHref", () => {
  const origin = "https://app.example.com";

  it("allows relative paths", () => {
    expect(safeInternalHref("/app/pricing", origin)).toBe("/app/pricing");
    expect(safeInternalHref("/app?x=1#y", origin)).toBe("/app?x=1#y");
  });

  it("allows same-origin absolute URLs as path", () => {
    expect(safeInternalHref("https://app.example.com/app", origin)).toBe("/app");
  });

  it("blocks external absolute and protocol-relative URLs", () => {
    expect(safeInternalHref("https://evil.com/phish", origin)).toBe("/");
    expect(safeInternalHref("//evil.com/phish", origin)).toBe("/");
    expect(safeInternalHref("javascript:alert(1)", origin)).toBe("/");
  });

  it("blocks backslash tricks", () => {
    expect(safeInternalHref("/\\evil.com", origin)).toBe("/");
  });
});

describe("safeNonNegNumber", () => {
  it("rejects NaN and negatives", () => {
    expect(safeNonNegNumber(NaN)).toBe(0);
    expect(safeNonNegNumber(-5)).toBe(0);
    expect(safeNonNegNumber("12.5")).toBe(12.5);
  });
});

describe("clampText", () => {
  it("trims and caps length", () => {
    expect(clampText("  hello world  ", 5)).toBe("hello");
    expect(clampText(null, 10)).toBe("");
  });
});
