import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInsightsFilters } from "../useInsightsFilters";
import { INSIGHTS_PERIOD_MONTHS } from "../../types/insightsTypes";

describe("Insights filter state", () => {
  beforeEach(() => {
    localStorage.clear();
    useInsightsFilters.getState().reset();
  });

  it("defaults to a one-year window", () => {
    expect(useInsightsFilters.getState().period).toBe("1Y");
  });

  it("persists the selection so the workspace opens the way it was left", () => {
    useInsightsFilters.getState().setPeriod("3M");
    expect(localStorage.getItem("insights.filters.period")).toBe("3M");
  });

  it("keeps one window across every section rather than resetting per page", () => {
    useInsightsFilters.getState().setPeriod("6M");
    // Any component reading the store — Overview, Analytics, Intelligence —
    // sees the same value; there is no per-page filter state to diverge.
    expect(useInsightsFilters.getState().period).toBe("6M");
  });

  it("maps each window to a real request limit in months", () => {
    expect(INSIGHTS_PERIOD_MONTHS).toEqual({ "3M": 3, "6M": 6, "1Y": 12, "3Y": 36 });
  });

  it("survives storage being unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => useInsightsFilters.getState().setPeriod("3Y")).not.toThrow();
    expect(useInsightsFilters.getState().period).toBe("3Y");

    setItem.mockRestore();
  });
});
