import { describe, expect, it } from "vitest";
import {
  dimensionStatus,
  formatDueIn,
  formatPercentDelta,
  formatPoints,
  healthStatus,
  sortRecommendations,
  sortRisks,
} from "../insightsFormat";
import { rankDimensions, lowestScoringDimensions } from "../healthRanking";
import type { HealthDimension, RiskItem, SmartRecommendation } from "../../types/insightsTypes";

const risk = (over: Partial<RiskItem>): RiskItem => ({
  id: "r",
  title: "Risk",
  category: "Credit",
  severity: "MEDIUM",
  confidencePercent: null,
  reason: "because",
  affectedEntity: null,
  financialImpact: null,
  dueInDays: null,
  resolution: null,
  deepLink: null,
  ...over,
});

const recommendation = (over: Partial<SmartRecommendation>): SmartRecommendation => ({
  id: "x",
  title: "Do something",
  reason: null,
  impactType: "LONG_TERM",
  component: null,
  scoreImpact: null,
  deepLink: null,
  ...over,
});

const dimension = (over: Partial<HealthDimension>): HealthDimension => ({
  code: "CASH_FLOW",
  label: "Cash flow",
  score: 50,
  why: null,
  improvement: null,
  scoreImpact: null,
  deepLink: null,
  ...over,
});

describe("sortRisks", () => {
  it("orders by severity before anything else", () => {
    const sorted = sortRisks([
      risk({ id: "low", severity: "LOW", dueInDays: 0 }),
      risk({ id: "critical", severity: "CRITICAL", dueInDays: 90 }),
      risk({ id: "high", severity: "HIGH" }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["critical", "high", "low"]);
  });

  it("puts the sooner deadline first within a severity band", () => {
    const sorted = sortRisks([
      risk({ id: "later", severity: "HIGH", dueInDays: 10 }),
      risk({ id: "sooner", severity: "HIGH", dueInDays: 1 }),
      risk({ id: "overdue", severity: "HIGH", dueInDays: -2 }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["overdue", "sooner", "later"]);
  });

  it("does not treat an undated risk as more urgent than a dated one", () => {
    const sorted = sortRisks([
      risk({ id: "undated", severity: "HIGH", dueInDays: null }),
      risk({ id: "dated", severity: "HIGH", dueInDays: 30 }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["dated", "undated"]);
  });

  it("prefers the better-evidenced detection as the final tiebreak", () => {
    const sorted = sortRisks([
      risk({ id: "unquantified", severity: "MEDIUM", confidencePercent: null }),
      risk({ id: "certain", severity: "MEDIUM", confidencePercent: 100 }),
      risk({ id: "shaky", severity: "MEDIUM", confidencePercent: 55 }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["certain", "shaky", "unquantified"]);
  });

  it("does not mutate its input", () => {
    const input = [risk({ id: "a", severity: "LOW" }), risk({ id: "b", severity: "CRITICAL" })];
    sortRisks(input);
    expect(input.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("sortRecommendations", () => {
  it("groups by impact bucket, then by attributed score movement", () => {
    const sorted = sortRecommendations([
      recommendation({ id: "quick-small", impactType: "QUICK_WIN", scoreImpact: 1 }),
      recommendation({ id: "long", impactType: "LONG_TERM", scoreImpact: 0 }),
      recommendation({ id: "high-small", impactType: "HIGH_IMPACT", scoreImpact: 5 }),
      recommendation({ id: "high-big", impactType: "HIGH_IMPACT", scoreImpact: 12 }),
      recommendation({ id: "quick-big", impactType: "QUICK_WIN", scoreImpact: 4 }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual([
      "high-big",
      "high-small",
      "quick-big",
      "quick-small",
      "long",
    ]);
  });

  it("sorts an unquantified recommendation last within its bucket", () => {
    const sorted = sortRecommendations([
      recommendation({ id: "unknown", impactType: "QUICK_WIN", scoreImpact: null }),
      recommendation({ id: "known", impactType: "QUICK_WIN", scoreImpact: 2 }),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["known", "unknown"]);
  });
});

describe("health status presentation", () => {
  it("gives every rating a text label, never colour alone", () => {
    for (const rating of ["EXCEPTIONAL", "EXCELLENT", "GOOD", "NEEDS_ATTENTION", "POOR", "CRITICAL"]) {
      expect(healthStatus(rating).label).toBeTruthy();
    }
  });

  it("falls back to 'Unrated' rather than to a severity for an unknown rating", () => {
    expect(healthStatus(undefined).label).toBe("Unrated");
    expect(healthStatus("SOMETHING_NEW").label).toBe("Unrated");
  });

  it("does not give an unscored dimension the colour of a bad one", () => {
    expect(dimensionStatus(null).label).toBe("Unrated");
    expect(dimensionStatus(0).label).toBe("Critical");
    expect(dimensionStatus(null).stroke).not.toBe(dimensionStatus(0).stroke);
  });
});

describe("delta formatting", () => {
  it("returns null for absent values so callers can omit the row entirely", () => {
    expect(formatPoints(null)).toBeNull();
    expect(formatPoints(undefined)).toBeNull();
    expect(formatPercentDelta(null)).toBeNull();
    expect(formatDueIn(null)).toBeNull();
  });

  it("distinguishes a real zero movement from an absent one", () => {
    expect(formatPoints(0)).toBe("No change");
  });

  it("signs movement explicitly", () => {
    expect(formatPoints(2)).toBe("+2 pts");
    expect(formatPoints(-3.26)).toBe("−3.3 pts");
    expect(formatPercentDelta(7.14)).toBe("+7.1%");
  });

  it("phrases due dates relative to today, including overdue", () => {
    expect(formatDueIn(0)).toBe("Due today");
    expect(formatDueIn(1)).toBe("Due tomorrow");
    expect(formatDueIn(5)).toBe("Due in 5 days");
    expect(formatDueIn(-1)).toBe("1 day overdue");
  });
});

describe("dimension ranking", () => {
  it("puts the worst score first", () => {
    const ranked = rankDimensions([
      dimension({ code: "A", score: 80 }),
      dimension({ code: "B", score: 10 }),
      dimension({ code: "C", score: 45 }),
    ]);

    expect(ranked.map((d) => d.code)).toEqual(["B", "C", "A"]);
  });

  it("sorts unscored dimensions last, not as if they scored zero", () => {
    const ranked = rankDimensions([
      dimension({ code: "unscored", score: null }),
      dimension({ code: "crisis", score: 3 }),
    ]);

    expect(ranked.map((d) => d.code)).toEqual(["crisis", "unscored"]);
  });

  it("excludes unscored dimensions from the 'needs attention' selection", () => {
    const lowest = lowestScoringDimensions(
      [
        dimension({ code: "unscored", score: null }),
        dimension({ code: "bad", score: 12 }),
        dimension({ code: "ok", score: 70 }),
      ],
      2,
    );

    expect(lowest.map((d) => d.code)).toEqual(["bad", "ok"]);
  });
});
