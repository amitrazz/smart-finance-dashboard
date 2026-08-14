import { describe, expect, it } from "vitest";
import { resolveActionRoute } from "../actionRoutes";

/**
 * The resolver is the only thing standing between a loose backend string and
 * `setActiveTab()`. The previous code cast `deepLink` straight to `NavTab`, so
 * an unrecognised value navigated the app to a tab that doesn't exist.
 */
describe("resolveActionRoute", () => {
  it("resolves a bare backend token", () => {
    expect(resolveActionRoute({ deepLink: "loans" })).toEqual({
      tab: "loans",
      subTab: null,
      label: "Review debt",
    });
  });

  it("normalises hash, slash and server-path prefixes to the same destination", () => {
    const expected = { tab: "credit-cards", subTab: null, label: "Review credit card" };
    expect(resolveActionRoute({ deepLink: "#/credit-cards" })).toEqual(expected);
    expect(resolveActionRoute({ deepLink: "/finance/credit-cards" })).toEqual(expected);
    expect(resolveActionRoute({ deepLink: "CREDIT-CARDS" })).toEqual(expected);
    expect(resolveActionRoute({ deepLink: "credit-cards/statements?id=1" })).toEqual(expected);
  });

  it("routes domains that live under a sub-tab of Planning", () => {
    expect(resolveActionRoute({ deepLink: "goals" })).toEqual({
      tab: "planning",
      subTab: "goals",
      label: "Review goals",
    });
    expect(resolveActionRoute({ deepLink: "budgets" })).toEqual({
      tab: "planning",
      subTab: "budgets",
      label: "Review budget",
    });
  });

  it("returns null for an unresolvable link instead of guessing a tab", () => {
    expect(resolveActionRoute({ deepLink: "https://example.com/somewhere" })).toBeNull();
    expect(resolveActionRoute({ deepLink: "totally-unknown" })).toBeNull();
    expect(resolveActionRoute({})).toBeNull();
    expect(resolveActionRoute({ deepLink: null })).toBeNull();
  });

  it("falls back to the health dimension when no link is supplied", () => {
    expect(resolveActionRoute({ component: "CREDIT_UTILIZATION" })?.tab).toBe("credit-cards");
    expect(resolveActionRoute({ component: "EMERGENCY_FUND" })).toEqual({
      tab: "planning",
      subTab: "goals",
      label: "Review goals",
    });
    expect(resolveActionRoute({ component: "DEBT_HEALTH" })?.tab).toBe("loans");
  });

  it("falls back to the risk category last", () => {
    expect(resolveActionRoute({ category: "Overspending" })?.tab).toBe("transactions");
    expect(resolveActionRoute({ category: "Investments" })?.tab).toBe("investments");
  });

  it("prefers an explicit backend link over either fallback", () => {
    const resolved = resolveActionRoute({
      deepLink: "investments",
      component: "CASH_FLOW",
      category: "Credit",
    });
    expect(resolved?.tab).toBe("investments");
  });

  it("never routes into Insights itself", () => {
    // Insights aggregates and interprets; domain workflows stay in their own
    // modules. A recommendation that links back here is a dead end.
    const destinations = [
      resolveActionRoute({ deepLink: "loans" }),
      resolveActionRoute({ component: "SPENDING_DISCIPLINE" }),
      resolveActionRoute({ category: "Savings" }),
    ];
    for (const destination of destinations) {
      expect(destination?.tab).not.toBe("insights");
    }
  });
});

describe("action labels state intent, not address", () => {
  it("never resolves to a label that only names a place or a dialog", () => {
    // "View details" and "Open" tell the reader nothing about what acting on a
    // finding will accomplish; every resolvable destination has to name the task.
    const samples = [
      resolveActionRoute({ deepLink: "transactions" }),
      resolveActionRoute({ deepLink: "credit-cards" }),
      resolveActionRoute({ deepLink: "loans" }),
      resolveActionRoute({ deepLink: "investments" }),
      resolveActionRoute({ component: "EMERGENCY_FUND" }),
      resolveActionRoute({ component: "SAVINGS_RATE" }),
    ];

    for (const resolved of samples) {
      expect(resolved).not.toBeNull();
      expect(resolved!.label).not.toMatch(/^(open|view)\b/i);
      expect(resolved!.label).not.toMatch(/details/i);
    }
  });

  it("names the intent for the finding's own domain", () => {
    expect(resolveActionRoute({ deepLink: "transactions" })!.label).toBe("Review spending");
    expect(resolveActionRoute({ deepLink: "investments" })!.label).toBe("Review portfolio");
  });
});
