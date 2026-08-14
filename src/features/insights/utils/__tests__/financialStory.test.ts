import { describe, expect, it } from "vitest";
import type { FinancialChange } from "../../api/insightsMappers";
import type { CashFlowAnalytics } from "../../types/insightsTypes";
import { StorySegment, buildFinancialStory } from "../financialStory";

const money = (amount: string) => ({ amount, currency: "INR" });

const change = (over: Partial<FinancialChange> & { id: string }): FinancialChange => ({
  label: over.id,
  amount: null,
  percent: null,
  points: null,
  upIsGood: true,
  caption: null,
  ...over,
});

const cashFlow: CashFlowAnalytics = {
  period: "2026-07",
  totalIncome: money("200000"),
  totalExpenses: money("140000"),
  netCashFlow: money("60000"),
  savingsRatePercent: 30,
  savingsRateChangePoints: 2.5,
  history: [
    { month: "2026-06", income: 190000, expenses: 120000, netCashFlow: 70000 },
    { month: "2026-07", income: 200000, expenses: 140000, netCashFlow: 60000 },
  ],
  largestExpenseCategory: null,
  largestIncomeSource: null,
};

const textOf = (segments: StorySegment[]) =>
  segments.map((s) => (s.kind === "text" ? s.text : "«value»")).join("");

describe("the story is a comparison or it is nothing", () => {
  it("returns null when there is nothing to compare against", () => {
    expect(buildFinancialStory({ netWorth: null, cashFlow, changes: [] })).toBeNull();
  });

  it("names both periods it measured between", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [change({ id: "net-worth", amount: money("42000"), upIsGood: true })],
    });

    expect(story!.basis).toBe("Measured between two recorded periods, Jun 26 and Jul 26.");
  });
});

describe("the verdict follows the figures", () => {
  it("reads net worth first, because it already nets everything else", () => {
    const improved = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [change({ id: "net-worth", amount: money("42000") })],
    });
    const weakened = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [change({ id: "net-worth", amount: money("-42000") })],
    });

    expect(improved!.verdict).toBe("improved");
    expect(weakened!.verdict).toBe("weakened");
  });

  it("falls back to the savings rate when net worth is unknown", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [change({ id: "savings-rate", points: -4.2 })],
    });

    expect(story!.verdict).toBe("weakened");
  });

  it("reports a mixed period as mixed rather than rounding it to good news", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow: { ...cashFlow, savingsRateChangePoints: null },
      changes: [
        change({ id: "income", amount: money("10000"), upIsGood: true }),
        change({ id: "spending", amount: money("20000"), upIsGood: false }),
      ],
    });

    expect(story!.verdict).toBe("mixed");
  });
});

describe("what the story may and may not claim", () => {
  it("joins movements with 'while', never with a cause", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [
        change({ id: "income", amount: money("10000"), percent: 5.3, upIsGood: true }),
        change({ id: "spending", amount: money("20000"), percent: 16.7, upIsGood: false }),
      ],
    });

    const sentence = textOf(story!.detail[0].segments);
    expect(sentence).toMatch(/Income rose «value» \(«value»\) while spending rose/);
    expect(story!.detail.map((d) => textOf(d.segments)).join(" ")).not.toMatch(
      /because|due to|driven by|caused|will |expect/i,
    );
  });

  it("puts every amount in a money segment so privacy mode can mask it", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [change({ id: "income", amount: money("10000"), upIsGood: true }),
        change({ id: "spending", amount: money("20000"), upIsGood: false })],
    });

    const allSegments = story!.detail.flatMap((d) => d.segments);
    const moneySegments = allSegments.filter((s) => s.kind === "money");

    expect(moneySegments.length).toBeGreaterThan(0);
    // No rupee figure may be baked into a text segment: text is rendered raw and
    // would survive "hide amounts".
    for (const segment of allSegments) {
      if (segment.kind === "text") expect(segment.text).not.toMatch(/[₹\d]/);
    }
  });

  it("reports a shortfall as a shortfall rather than as negative cash flow", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow: { ...cashFlow, netCashFlow: money("-187322") },
      changes: [change({ id: "net-worth", amount: money("-42000") })],
    });

    const sentences = story!.detail.map((d) => textOf(d.segments));
    expect(sentences.some((s) => s.includes("That left a shortfall of"))).toBe(true);
  });

  it("caps the detail at four sentences", () => {
    const story = buildFinancialStory({
      netWorth: null,
      cashFlow,
      changes: [
        change({ id: "net-worth", amount: money("42000") }),
        change({ id: "income", amount: money("10000") }),
        change({ id: "spending", amount: money("20000"), upIsGood: false }),
        change({ id: "savings-rate", points: 2.5 }),
        change({ id: "debt", amount: money("15000"), upIsGood: false, label: "Debt" }),
      ],
    });

    expect(story!.detail.length).toBeLessThanOrEqual(4);
  });
});
