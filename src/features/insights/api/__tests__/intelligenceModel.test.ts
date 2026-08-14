import { describe, expect, it } from "vitest";
import type { SmartActionItem } from "../../../../types";
import type { SmartRecommendation } from "../../types/insightsTypes";
import {
  attentionCount,
  buildIntelligenceFeed,
  mapIntelligence,
  recommendationsAsItems,
} from "../intelligenceModel";

const action = (over: Partial<SmartActionItem> = {}): SmartActionItem =>
  ({
    id: "a1",
    type: "CREDIT_UTILIZATION",
    category: "CREDIT",
    priority: "HIGH",
    status: "ACTIVE",
    title: "Credit utilisation is high",
    description: "Your card is close to its limit.",
    explanation: "Utilisation is 82% against a 30% target.",
    recommendation: "Pay down the balance before the statement date.",
    dismissible: true,
    actionable: true,
    version: 1,
    createdAt: "2026-08-01T00:00:00Z",
    ...over,
  }) as SmartActionItem;

describe("the feed shows everything the backend detected", () => {
  it("keeps opportunities, which the risk list dropped entirely", () => {
    // `mapRisks` filters to known risk categories, so every OPPORTUNITY the
    // backend raised was invisible — the one category that answers "what
    // opportunities do I have?".
    const items = mapIntelligence([
      action({ id: "risk", category: "CREDIT" }),
      action({ id: "opp", category: "OPPORTUNITY", title: "Idle cash could be earning" }),
    ]);

    expect(items.map((i) => i.id).sort()).toEqual(["opp", "risk"]);
    expect(items.find((i) => i.id === "opp")!.nature).toBe("opportunity");
  });

  it("classifies data chores as housekeeping and floors their rank", () => {
    const items = mapIntelligence([
      action({ id: "chore", category: "DATA_QUALITY", priority: "CRITICAL", title: "Categorise 3 transactions" }),
      action({ id: "money", category: "SPENDING", priority: "MEDIUM" }),
    ]);

    const chore = items.find((i) => i.id === "chore")!;
    const money = items.find((i) => i.id === "money")!;

    expect(chore.nature).toBe("housekeeping");
    // A CRITICAL data chore must not outrank a MEDIUM financial finding, or the
    // top of the feed fills with admin.
    expect(chore.rank).toBeLessThan(money.rank);
    expect(items[0].id).toBe("money");
  });
});

describe("the feed never overrides the backend's lifecycle", () => {
  it("drops anything the user already dismissed, completed or let expire", () => {
    const items = mapIntelligence([
      action({ id: "active", status: "ACTIVE" }),
      action({ id: "dismissed", status: "DISMISSED" }),
      action({ id: "completed", status: "COMPLETED" }),
    ]);

    expect(items.map((i) => i.id)).toEqual(["active"]);
  });

  it("never emits the same backend row twice", () => {
    const items = mapIntelligence([action({ id: "a1" }), action({ id: "a1" })]);
    expect(items).toHaveLength(1);
  });
});

describe("ranking: impact, urgency, confidence, actionability", () => {
  it("puts an overdue critical item above a larger but unhurried one", () => {
    const items = mapIntelligence([
      action({
        id: "big-but-calm",
        priority: "MEDIUM",
        amount: { amount: "500000", currency: "INR" },
      }),
      action({ id: "overdue", priority: "CRITICAL", dueInDays: -2 }),
    ]);

    expect(items[0].id).toBe("overdue");
  });

  it("does not let one large balance bury everything beneath it forever", () => {
    // The money term is log-scaled, so a 100× larger amount is worth a few
    // points rather than an unreachable lead.
    const [huge, small] = mapIntelligence([
      action({ id: "huge", priority: "LOW", amount: { amount: "5000000", currency: "INR" } }),
      action({ id: "small", priority: "LOW", amount: { amount: "50000", currency: "INR" } }),
    ]);

    expect(huge.rank - small.rank).toBeLessThan(10);
  });

  it("ranks a ₹10,000 recurring problem above a ₹50 one", () => {
    const items = mapIntelligence([
      action({ id: "tiny", priority: "MEDIUM", amount: { amount: "50", currency: "INR" } }),
      action({ id: "real", priority: "MEDIUM", amount: { amount: "10000", currency: "INR" } }),
    ]);

    expect(items[0].id).toBe("real");
  });

  it("prefers a finding the user can act on over one that only informs", () => {
    const items = mapIntelligence([
      action({ id: "informational", recommendation: null, deepLink: null }),
      action({ id: "actionable", recommendation: "Pay it", deepLink: "credit-cards" }),
    ]);

    expect(items[0].id).toBe("actionable");
  });

  it("treats an unquantified detection as mid-confidence, not as certain", () => {
    const withEvidence = mapIntelligence([
      action({
        id: "measured",
        evidence: [
          {
            metric: "utilisation",
            value: 0.82,
            unit: "RATIO",
            period: null,
            baseline: null,
            comparison: null,
            source: "SNAPSHOT",
            sourceEntityIds: [],
            confidence: 1,
          },
        ],
      }),
    ])[0];
    const withoutEvidence = mapIntelligence([action({ id: "unmeasured" })])[0];

    expect(withoutEvidence.confidencePercent).toBeNull();
    expect(withEvidence.rank).toBeGreaterThan(withoutEvidence.rank);
  });
});

describe("ranking edge cases", () => {
  const evidence = (confidence: number) => [
    {
      metric: "m",
      value: 1,
      unit: "COUNT" as const,
      period: null,
      baseline: null,
      comparison: null,
      source: "SNAPSHOT",
      sourceEntityIds: [],
      confidence,
    },
  ];

  it("ranks a large-but-uncertain finding below a smaller certain one of the same severity", () => {
    const items = mapIntelligence([
      action({
        id: "big-unsure",
        priority: "MEDIUM",
        amount: { amount: "80000", currency: "INR" },
        evidence: evidence(0.4),
      }),
      action({
        id: "small-sure",
        priority: "MEDIUM",
        amount: { amount: "20000", currency: "INR" },
        evidence: evidence(1),
      }),
    ]);

    // Money is log-scaled and confidence is worth up to 20, so a 4× amount the
    // rule is unsure of does not outrank a measured one.
    expect(items[0].id).toBe("small-sure");
  });

  it("lets an urgent opportunity outrank a distant low risk", () => {
    const items = mapIntelligence([
      action({ id: "far-risk", priority: "LOW", dueInDays: 90 }),
      action({ id: "urgent-opp", category: "OPPORTUNITY", priority: "MEDIUM", dueInDays: 1 }),
    ]);

    expect(items[0].id).toBe("urgent-opp");
  });

  it("keeps a critical risk at the top even against a large opportunity", () => {
    const items = mapIntelligence([
      action({
        id: "opp",
        category: "OPPORTUNITY",
        priority: "MEDIUM",
        amount: { amount: "500000", currency: "INR" },
      }),
      action({ id: "critical", priority: "CRITICAL", dueInDays: 0 }),
    ]);

    expect(items[0].id).toBe("critical");
  });

  it("returns an empty list, not a placeholder, when there is nothing to rank", () => {
    expect(mapIntelligence([])).toEqual([]);
    expect(buildIntelligenceFeed([], [])).toEqual([]);
    expect(attentionCount([])).toBe(0);
  });

  it("is deterministic: the same input always produces the same order", () => {
    const input = [
      action({ id: "a", priority: "HIGH", dueInDays: 3 }),
      action({ id: "b", priority: "HIGH", dueInDays: 3 }),
      action({ id: "c", priority: "MEDIUM", amount: { amount: "9000", currency: "INR" } }),
    ];

    const first = mapIntelligence(input).map((i) => `${i.id}:${i.rank}`);
    const second = mapIntelligence([...input]).map((i) => `${i.id}:${i.rank}`);

    expect(second).toEqual(first);
  });
});

describe("recommendations join the same list", () => {
  const recommendation: SmartRecommendation = {
    id: "r1",
    title: "Increase your emergency fund",
    reason: "₹4,544 remains to reach a six-month target",
    impactType: "HIGH_IMPACT",
    component: "EMERGENCY_FUND",
    scoreImpact: 9,
    deepLink: null,
  };

  it("carries no evidence or due date it doesn't have", () => {
    const [item] = recommendationsAsItems([recommendation]);

    expect(item.nature).toBe("opportunity");
    expect(item.evidence).toEqual([]);
    expect(item.dueInDays).toBeNull();
    expect(item.confidencePercent).toBeNull();
    expect(item.scoreImpact).toBe(9);
  });

  it("namespaces its id so it can never collide with a Smart Action's", () => {
    const [item] = recommendationsAsItems([{ ...recommendation, id: "a1" }]);
    const feed = buildIntelligenceFeed([action({ id: "a1" })], [{ ...recommendation, id: "a1" }]);

    expect(item.id).toBe("recommendation:a1");
    expect(feed).toHaveLength(2);
  });
});

describe("filters and counts", () => {
  it("tags each item with every chip it should answer to", () => {
    const [item] = mapIntelligence([action({ category: "CREDIT" })]);
    expect(item.filters).toEqual(expect.arrayContaining(["all", "risk", "attention", "debt"]));
  });

  it("recognises a subscription finding by rule type, since there is no such category", () => {
    const [item] = mapIntelligence([
      action({ type: "SUBSCRIPTION_PRICE_INCREASE", category: "SPENDING" }),
    ]);
    expect(item.filters).toContain("subscriptions");
  });

  it("counts only severe risks as needing attention", () => {
    const items = mapIntelligence([
      action({ id: "c", priority: "CRITICAL" }),
      action({ id: "h", priority: "HIGH" }),
      action({ id: "m", priority: "MEDIUM" }),
      action({ id: "o", category: "OPPORTUNITY", priority: "CRITICAL" }),
    ]);

    expect(attentionCount(items)).toBe(2);
  });
});
