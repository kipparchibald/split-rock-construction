import { describe, expect, it } from "vitest";
import {
  cityworksWorksheetText,
  fieldCounts,
  fillRigbySfdFromPlans,
} from "./permit-cityworks-fields";

describe("Cityworks AI fill from Holwege plans", () => {
  it("fills locked contractor and valuation and does not invent a PIN", () => {
    const fields = fillRigbySfdFromPlans();
    const pin = fields.find((f) => f.id === "parcel");
    const val = fields.find((f) => f.id === "valuation");
    const found = fields.find((f) => f.id === "foundation");
    expect(pin?.confidence).toBe("missing");
    expect(val?.value).toContain("689,299.65");
    expect(found?.value.toLowerCase()).toContain("crawlspace");
    expect(fieldCounts(fields).missing).toBeGreaterThan(3);
  });

  it("worksheet is copy-paste ready and refuses to call itself filed", () => {
    const text = cityworksWorksheetText();
    expect(text).toContain("NOT A FILED PERMIT");
    expect(text).toContain("6481622");
    expect(text).toContain("Lot 16");
    expect(text).toContain("cityworksonline.com");
  });
});
