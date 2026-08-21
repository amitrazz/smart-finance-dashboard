import { describe, expect, it } from "vitest";
import { mapPeriodToAnalysisWindow } from "../insightsTypes";

describe("mapPeriodToAnalysisWindow", () => {
  it("maps every workspace period to its backend window", () => {
    expect(mapPeriodToAnalysisWindow("3M")).toBe("3m");
    expect(mapPeriodToAnalysisWindow("6M")).toBe("6m");
    expect(mapPeriodToAnalysisWindow("1Y")).toBe("12m");
  });

  it("maps the longest workspace period (3Y) to the largest named trailing window rather than lifetime", () => {
    // The backend has no 3-year window; falling back to "all" (lifetime)
    // would silently show more history than the header selector claims.
    expect(mapPeriodToAnalysisWindow("3Y")).toBe("24m");
  });
});
