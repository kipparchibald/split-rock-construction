import { describe, expect, it } from "vitest";
import { opsSnapshotHasData, pickOpsSlice } from "./ops-persist";

describe("ops-persist", () => {
  it("pickOpsSlice extracts operational fields only", () => {
    const slice = pickOpsSlice({
      draws: [{ id: "dr1" } as never],
      changeOrders: [],
      selections: [],
      dailyLogs: [],
      documents: [],
      budgetLines: [],
      closeoutPackages: [],
      permitPackages: [],
      safety: [],
      activity: [],
    });
    expect(slice.draws).toHaveLength(1);
    expect(slice.changeOrders).toEqual([]);
  });

  it("opsSnapshotHasData detects non-empty slices", () => {
    expect(opsSnapshotHasData({})).toBe(false);
    expect(opsSnapshotHasData({ dailyLogs: [{ id: "dl1" } as never] })).toBe(true);
  });
});
