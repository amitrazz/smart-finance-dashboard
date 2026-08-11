import { describe, expect, it } from "vitest";
import {
  INSIGHTS_SECTIONS,
  describeRoute,
  parseInsightsRoute,
  serializeInsightsRoute,
} from "../insightsNav";

describe("Insights navigation model", () => {
  it("exposes exactly five top-level sections", () => {
    // The acceptance criterion is that the workspace is legible in seconds; the
    // previous nav offered five sections plus up to seven pills, 17 destinations
    // in all. This test is the guard against that creeping back.
    expect(INSIGHTS_SECTIONS.map((s) => s.id)).toEqual([
      "overview",
      "health",
      "analytics",
      "intelligence",
      "reports",
    ]);
  });

  it("gives Overview, Health and Reports no sub-navigation", () => {
    const single = INSIGHTS_SECTIONS.filter((s) => s.views.length === 0).map((s) => s.id);
    expect(single).toEqual(["overview", "health", "reports"]);
  });
});

describe("parseInsightsRoute", () => {
  it("defaults to Overview", () => {
    expect(parseInsightsRoute(null)).toEqual({ section: "overview", view: null });
    expect(parseInsightsRoute("")).toEqual({ section: "overview", view: null });
  });

  it("round-trips a section and view", () => {
    const route = parseInsightsRoute("analytics/spending");
    expect(route).toEqual({ section: "analytics", view: "spending" });
    expect(serializeInsightsRoute(route)).toBe("analytics/spending");
  });

  it("falls back to a section's first view rather than erroring on an unknown one", () => {
    expect(parseInsightsRoute("analytics/dogecoin")).toEqual({
      section: "analytics",
      view: "net-worth",
    });
  });

  it("keeps a bare section on its default view", () => {
    expect(parseInsightsRoute("intelligence")).toEqual({
      section: "intelligence",
      view: "actions",
    });
    expect(parseInsightsRoute("health")).toEqual({ section: "health", view: null });
  });

  it("lands old bookmarks on their nearest new home instead of the dashboard", () => {
    // Every one of these was a real sub-tab in the previous workspace.
    expect(parseInsightsRoute("financial-health")).toEqual({ section: "health", view: null });
    expect(parseInsightsRoute("forecasts")).toEqual({ section: "analytics", view: "net-worth" });
    expect(parseInsightsRoute("recommendations")).toEqual({
      section: "intelligence",
      view: "actions",
    });
    expect(parseInsightsRoute("risks")).toEqual({ section: "intelligence", view: "risks" });
    expect(parseInsightsRoute("spending")).toEqual({ section: "analytics", view: "spending" });
    expect(parseInsightsRoute("budgets")).toEqual({ section: "analytics", view: "budget" });
    expect(parseInsightsRoute("debts")).toEqual({ section: "analytics", view: "debt" });
  });

  it("falls back to Overview for a hash that means nothing", () => {
    expect(parseInsightsRoute("nonsense/deeper")).toEqual({ section: "overview", view: null });
  });
});

describe("serializeInsightsRoute", () => {
  it("omits the view segment for single-view sections", () => {
    expect(serializeInsightsRoute({ section: "overview", view: null })).toBe("overview");
    expect(serializeInsightsRoute({ section: "reports", view: null })).toBe("reports");
  });

  it("supplies a default view when a multi-view section is given none", () => {
    expect(serializeInsightsRoute({ section: "intelligence", view: null })).toBe(
      "intelligence/actions",
    );
  });
});

describe("describeRoute", () => {
  it("names the section and view for headings", () => {
    expect(describeRoute({ section: "analytics", view: "debt" })).toEqual({
      section: "Analytics",
      view: "Debt",
    });
    expect(describeRoute({ section: "health", view: null })).toEqual({
      section: "Health",
      view: null,
    });
  });
});
