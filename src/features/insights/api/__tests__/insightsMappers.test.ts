import { describe, expect, it } from "vitest";
import {
  diffMoney,
  diffPercent,
  diffPercentPoints,
  mapBudgets,
  mapCashFlow,
  mapChanges,
  mapDebt,
  mapFinancialHealth,
  mapForecast,
  mapGoals,
  mapInvestments,
  mapIncome,
  mapSpending,
  riskSubject,
  mapNetWorth,
  mapRecommendations,
  mapRisks,
  mapSubscriptions,
  num,
  riskConfidencePercent,
} from "../insightsMappers";
import type {
  CashFlowSnapshot,
  CategoryTrend,
  FinancialHealthScore,
  MerchantTrend,
  NetWorthSnapshot,
  PeriodComparisonResult,
  ResolvedAnalysisWindow,
  SmartActionItem,
} from "../../../../types";

const money = (amount: string, currency = "INR") => ({ amount, currency });

/**
 * These mappers are where "no data" is decided, so they get the closest
 * scrutiny. Almost every case below is a regression test for a figure the
 * previous implementation invented.
 */
describe("insights mappers — absent data never becomes zero", () => {
  it("returns null for a health score the backend didn't produce", () => {
    expect(mapFinancialHealth(null, null)).toBeNull();
    expect(mapFinancialHealth(undefined, [])).toBeNull();
  });

  it("returns null rather than a 0/100 'Critical' score when the payload has no score", () => {
    // The old mapper fell back to `{ overallScore: 0, rating: "Critical" }`, so a
    // backend outage rendered as the worst possible financial health.
    const malformed = { rating: "GOOD" } as unknown as FinancialHealthScore;
    expect(mapFinancialHealth(malformed, null)).toBeNull();
  });

  it("keeps an unscored dimension null instead of scoring it zero", () => {
    const health = {
      overallScore: 42,
      rating: "POOR",
      componentScores: {
        CASH_FLOW: { code: "CASH_FLOW", score: 10, stars: 1, why: "Negative last month" },
        EMERGENCY_FUND: { code: "EMERGENCY_FUND", why: "Not enough history" },
      },
      topRecommendations: [],
    } as unknown as FinancialHealthScore;

    const result = mapFinancialHealth(health, null);
    const byCode = Object.fromEntries(result!.dimensions.map((d) => [d.code, d]));

    expect(byCode.CASH_FLOW.score).toBe(10);
    expect(byCode.EMERGENCY_FUND.score).toBeNull();
  });

  it("reports no trend when the backend gives no monthly movement", () => {
    const health = {
      overallScore: 60,
      rating: "NEEDS_ATTENTION",
      componentScores: {},
      topRecommendations: [],
    } as unknown as FinancialHealthScore;

    expect(mapFinancialHealth(health, null)!.monthlyTrend).toBeNull();
  });

  it("drops history points that carry no score", () => {
    const health = {
      overallScore: 55,
      rating: "NEEDS_ATTENTION",
      componentScores: {},
      topRecommendations: [],
    } as unknown as FinancialHealthScore;

    const result = mapFinancialHealth(health, [
      { snapshotDate: "2026-02-01", overallScore: 50 },
      { snapshotDate: "2026-01-01" },
      { snapshotDate: "2026-03-01", overallScore: 55 },
    ] as never);

    expect(result!.history).toEqual([
      { date: "2026-02-01", score: 50 },
      { date: "2026-03-01", score: 55 },
    ]);
  });

  it("returns null for debt when there are no loans and no breakdown", () => {
    expect(mapDebt([], null, null)).toBeNull();
  });

  it("reports no debt-to-income ratio rather than 0% when the summary is missing", () => {
    const result = mapDebt(
      [
        {
          id: "l1",
          name: "Car loan",
          type: "VEHICLE",
          currency: "INR",
          interestRate: 9,
          outstandingPrincipal: money("400000"),
          status: "ACTIVE",
          version: 1,
        },
      ] as never,
      null,
      null,
    );

    expect(result!.debtToIncomeRatioPercent).toBeNull();
    expect(result!.totalDebt).toEqual(money("400000.00"));
  });

  it("reports no monthly EMI when no loan states one", () => {
    const result = mapDebt(
      [
        {
          id: "l1",
          name: "Interest-free family loan",
          type: "PERSONAL",
          currency: "INR",
          interestRate: 0,
          outstandingPrincipal: money("50000"),
          status: "ACTIVE",
          version: 1,
        },
      ] as never,
      null,
      null,
    );

    expect(result!.totalMonthlyEMI).toBeNull();
  });

  it("reports no XIRR when no portfolio publishes one", () => {
    const result = mapInvestments(
      [
        {
          portfolioId: "p1",
          name: "Equity",
          xirr: null,
          totalMarketValue: "150000",
          totalCostBasis: "120000",
          totalUnrealizedGain: "30000",
          holdings: [],
        },
      ],
      null,
    );

    expect(result!.xirrPercent).toBeNull();
    expect(result!.totalGainPercent).toBeCloseTo(25, 5);
  });

  it("leaves goal pacing unknown when the backend graded no goals", () => {
    const result = mapGoals(null, [
      {
        id: "g1",
        name: "House",
        targetAmount: money("1000000"),
        currentAmount: money("100000"),
        progressPercent: 10,
        currency: "INR",
        targetDate: "2030-01-01",
      },
    ] as never);

    // Counting an ungraded goal as "on track" is how the old mapper reported
    // perfect goal health for accounts with no goal analytics at all.
    expect(result!.goals[0].isBehindSchedule).toBeNull();
    expect(result!.onTrackCount).toBeNull();
    expect(result!.behindCount).toBeNull();
  });

  it("sums only monthly-billed subscriptions and never divides an annual plan by twelve", () => {
    const result = mapSubscriptions([
      { id: "s1", name: "Music", amount: money("199"), billingCycle: "MONTHLY", nextDueDate: "" },
      { id: "s2", name: "Storage", amount: money("2400"), billingCycle: "ANNUAL", nextDueDate: "" },
    ]);

    expect(result!.totalMonthlyCost).toEqual(money("199.00"));
    expect(result!.totalSubscriptionsCount).toBe(2);
  });

  it("carries no interpolated path or confidence figure on a forecast", () => {
    const result = mapForecast(
      {
        currentAge: 30,
        retirementAge: 60,
        expectedReturnPercent: 8,
        projectedCorpus: money("50000000"),
        monthlySavingsNeeded: money("25000"),
      },
      null,
    );

    expect(result!.projectedCorpus).toEqual(money("50000000"));
    expect(result!.history).toEqual([]);
    // The shape itself forbids the fabricated series and confidence score the
    // old implementation derived from a single corpus figure.
    expect(result).not.toHaveProperty("forecasts");
    expect(result).not.toHaveProperty("confidenceScorePercent");
  });
});

describe("num", () => {
  it("distinguishes absent from zero", () => {
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
    expect(num("")).toBeNull();
    expect(num("not a number")).toBeNull();
    expect(num("0")).toBe(0);
    expect(num(0)).toBe(0);
  });
});

describe("period-over-period differences", () => {
  it("returns null when either side is missing", () => {
    expect(diffMoney(money("100"), null)).toBeNull();
    expect(diffMoney(null, money("100"))).toBeNull();
    expect(diffPercent(money("100"), null)).toBeNull();
    expect(diffPercentPoints(4, null)).toBeNull();
  });

  it("never leaks binary-float dust into a money string", () => {
    expect(diffMoney(money("0.3"), money("0.1"))).toEqual(money("0.20"));
    expect(diffMoney(money("142000.10"), money("100000.11"))).toEqual(money("41999.99"));
  });

  it("returns null rather than dividing by a zero base", () => {
    expect(diffPercent(money("100"), money("0"))).toBeNull();
  });

  it("computes percentage-point movement for rates", () => {
    expect(diffPercentPoints(12.4, 16.6)).toBe(-4.2);
  });
});

describe("mapChanges", () => {
  const netWorthSnapshot = (date: string, netWorth: string, liabilities: string): NetWorthSnapshot => ({
    date,
    netWorth: money(netWorth),
    totalAssets: money("1000000"),
    totalLiabilities: money(liabilities),
    breakdown: {
      liquidCash: "100000",
      investments: "400000",
      realEstate: "500000",
      loans: liabilities,
      creditCards: "0",
    },
  });

  const cashFlowSnapshot = (period: string, income: string, expense: string, rate: number) =>
    ({
      period,
      totalIncome: money(income),
      totalExpense: money(expense),
      netSavings: money(String(Number(income) - Number(expense))),
      savingsRate: rate,
      categoryBreakdown: [],
    }) as CashFlowSnapshot;

  it("produces no rows when there is nothing to compare against", () => {
    expect(mapChanges(null, null)).toEqual([]);
  });

  it("omits comparisons that need a prior period rather than reporting zero change", () => {
    const netWorth = {
      currentNetWorth: money("500000"),
      totalAssets: money("500000"),
      totalLiabilities: money("0"),
      periodChangeAmount: null,
      periodChangePercent: null,
      windowChangeAmount: null,
      windowChangePercent: null,
      history: [],
      assetBreakdown: [],
      liabilityBreakdown: [],
      asOf: null,
    };

    expect(mapChanges(netWorth, null).map((c) => c.id)).toEqual([]);
  });

  it("reports movement in both directions with the right polarity", () => {
    const netWorth = mapNetWorthFixture();
    const cashFlow = mapCashFlow(
      [cashFlowSnapshot("2026-06", "200000", "120000", 40), cashFlowSnapshot("2026-07", "200000", "140000", 30)],
      null,
    );

    const changes = mapChanges(netWorth, cashFlow);
    const byId = Object.fromEntries(changes.map((c) => [c.id, c]));

    expect(byId.spending.amount).toEqual(money("20000.00"));
    expect(byId.spending.upIsGood).toBe(false);
    expect(byId["savings-rate"].points).toBe(-10);
    expect(byId.debt.upIsGood).toBe(false);
    expect(byId["net-worth"].upIsGood).toBe(true);
  });

  function mapNetWorthFixture() {
    return mapNetWorth(netWorthSnapshot("2026-07-01", "900000", "300000"), [
      netWorthSnapshot("2026-06-01", "850000", "320000"),
      netWorthSnapshot("2026-07-01", "900000", "300000"),
    ]);
  }
});

describe("mapRisks", () => {
  const action = (over: Partial<SmartActionItem>): SmartActionItem =>
    ({
      id: "a1",
      type: "CARD_PAYMENT_DUE",
      category: "PAYMENT",
      priority: "HIGH",
      status: "ACTIVE",
      title: "Card payment due",
      description: "Pay your card",
      explanation: "₹18,000 due in 1 day",
      dismissible: true,
      actionable: true,
      version: 1,
      createdAt: "2026-08-01T00:00:00Z",
      ...over,
    }) as SmartActionItem;

  it("excludes chores that are not risks", () => {
    const matrix = mapRisks([
      action({ id: "risk", category: "PAYMENT" }),
      action({ id: "chore", category: "DATA_QUALITY" }),
      action({ id: "import", category: "IMPORT" }),
    ]);

    expect(matrix.risks.map((r) => r.id)).toEqual(["risk"]);
    expect(matrix.highCount).toBe(1);
  });

  it("folds INFO priority into the low band", () => {
    const matrix = mapRisks([action({ priority: "INFO" })]);
    expect(matrix.risks[0].severity).toBe("LOW");
    expect(matrix.lowCount).toBe(1);
  });

  it("reports no confidence when the rule carried no evidence", () => {
    // The old mapper substituted a flat 90%, dressing an unquantified detection
    // as a measured one.
    expect(riskConfidencePercent(action({ evidence: null }))).toBeNull();
    expect(mapRisks([action({ evidence: null })]).risks[0].confidencePercent).toBeNull();
  });

  it("takes confidence from the weakest piece of evidence", () => {
    const withEvidence = action({
      evidence: [
        { metric: "a", value: 1, unit: "CURRENCY", period: null, baseline: null, comparison: null, source: "s", sourceEntityIds: [], confidence: 1 },
        { metric: "b", value: 2, unit: "CURRENCY", period: null, baseline: null, comparison: null, source: "s", sourceEntityIds: [], confidence: 0.6 },
      ] as never,
    });

    expect(riskConfidencePercent(withEvidence)).toBe(60);
  });
});

describe("mapRecommendations", () => {
  it("buckets by the score movement the engine attributes", () => {
    const recs = mapRecommendations([
      { text: "Big one", estimatedImpact: 8 },
      { text: "Small one", estimatedImpact: 2 },
      { text: "Unquantified" },
    ] as never);

    expect(recs.map((r) => r.impactType)).toEqual(["HIGH_IMPACT", "QUICK_WIN", "LONG_TERM"]);
    expect(recs[2].scoreImpact).toBeNull();
  });

  it("carries the raw deep link without resolving or defaulting it", () => {
    const [withLink, withoutLink] = mapRecommendations([
      { text: "A", deepLink: "loans" },
      { text: "B" },
    ] as never);

    expect(withLink.deepLink).toBe("loans");
    // The old mapper wrote a magic "#insights/recommendations" sentinel here and
    // string-compared against it in the card.
    expect(withoutLink.deepLink).toBeNull();
  });

  it("never advertises an estimated monetary saving", () => {
    const [rec] = mapRecommendations([{ text: "A", estimatedImpact: 3 }] as never);
    expect(rec).not.toHaveProperty("estimatedMonthlySavings");
    expect(rec).not.toHaveProperty("confidencePercent");
    expect(rec).not.toHaveProperty("difficulty");
  });
});

describe("cash flow reads the shape the endpoint actually sends", () => {
  // Regression: `/finance/analytics/cash-flow` returns CashFlowResponseDto —
  // `periodStart`, `netCashFlow`, a fractional `savingsRate` string and bare
  // string category amounts — not the `CashFlowSnapshot` its client is typed
  // with. Read literally, the section showed a real income and a real expense
  // beside "Not enough data" for net cash flow, no period caption, an empty
  // chart, and a −69.8% savings rate rendered as −0.7%.
  const wireRow = (periodStart: string, income: string, expense: string, savingsRate: string) => ({
    periodStart,
    periodEnd: `${periodStart.slice(0, 8)}28`,
    totalIncome: money(income),
    totalExpense: money(expense),
    netCashFlow: money(String(Number(income) - Number(expense))),
    savingsRate,
    categoryBreakdown: [
      { categoryId: null, categoryName: "Rent", amount: "120000" },
      { categoryId: "c2", categoryName: "Food", amount: "40000" },
    ],
  });

  it("maps the DTO's own field names and scales the fractional rate to percent", () => {
    const result = mapCashFlow(
      [
        wireRow("2026-06-01", "268315", "402472", "-0.5"),
        wireRow("2026-07-01", "268315", "455637", "-0.6979"),
      ] as never,
      null,
    );

    expect(result!.period).toBe("2026-07-01");
    expect(result!.netCashFlow).toEqual(money("-187322"));
    expect(result!.savingsRatePercent).toBe(-69.79);
    expect(result!.savingsRateChangePoints).toBe(-19.8);
    expect(result!.history.map((p) => p.month)).toEqual(["2026-06-01", "2026-07-01"]);
    expect(result!.history[1].netCashFlow).toBe(-187322);
    expect(result!.largestExpenseCategory).toEqual({ name: "Rent", amount: money("120000.00") });
  });

  it("still reads the declared DTO, whose rate is already whole percent", () => {
    const result = mapCashFlow(
      [
        {
          period: "2026-07",
          totalIncome: money("200000"),
          totalExpense: money("140000"),
          netSavings: money("60000"),
          savingsRate: 30,
          categoryBreakdown: [],
        },
      ] as never,
      null,
    );

    expect(result!.savingsRatePercent).toBe(30);
    expect(result!.netCashFlow).toEqual(money("60000"));
  });
});

describe("malformed rows never take down a section", () => {
  // Regression: a snapshot without a `date` (or a cash-flow row without a
  // `period`) reached `String.prototype.localeCompare` inside a `.sort()` and
  // threw, so one bad row blanked the entire workspace behind the error
  // boundary. Undated rows are now sorted harmlessly and filtered out.
  it("survives a net-worth snapshot with no date", () => {
    const good = {
      date: "2026-07-01",
      netWorth: money("900000"),
      totalAssets: money("1200000"),
      totalLiabilities: money("300000"),
      breakdown: { liquidCash: "100000", investments: "0", realEstate: "0", loans: "300000", creditCards: "0" },
    };
    const undated = { ...good, date: undefined };

    const result = mapNetWorth(good as never, [undated, good] as never);

    expect(result).not.toBeNull();
    expect(result!.history.map((p) => p.date)).toEqual(["2026-07-01"]);
  });

  it("survives a cash-flow snapshot with no period", () => {
    const rows = [
      { totalIncome: money("100"), totalExpense: money("50"), netSavings: money("50"), savingsRate: 50, categoryBreakdown: [] },
      { period: "2026-07", totalIncome: money("200"), totalExpense: money("120"), netSavings: money("80"), savingsRate: 40, categoryBreakdown: [] },
    ];

    const result = mapCashFlow(rows as never, null);

    expect(result!.period).toBe("2026-07");
    expect(result!.history.map((p) => p.month)).toEqual(["2026-07"]);
  });

  it("survives a health history point with no date", () => {
    const health = {
      overallScore: 50,
      rating: "POOR",
      componentScores: {},
      topRecommendations: [],
    } as unknown as FinancialHealthScore;

    expect(() =>
      mapFinancialHealth(health, [{ overallScore: 40 }, { snapshotDate: "2026-07-01", overallScore: 50 }] as never),
    ).not.toThrow();
  });
});

describe("optional wire fields never reach a string method", () => {
  // Regression: the wire types declare `payFrequency` and `billingCycle` as
  // required, but manually-created rows come back without them. The component
  // called `.toLowerCase()` on the value and took the section down with
  // "Cannot read properties of undefined (reading 'toLowerCase')". The mappers
  // normalise absent to `null` so the type forces callers to handle it.
  it("normalises a missing income frequency to null", () => {
    const result = mapIncome(
      [
        { id: "s1", name: "Salary", payFrequency: "MONTHLY", expectedAmount: "100000", expectedCurrency: "INR" },
        { id: "s2", name: "Consulting", expectedAmount: "25000", expectedCurrency: "INR" },
      ] as never,
      null,
      null,
    );

    expect(result!.sources.map((s) => s.frequency)).toEqual(["MONTHLY", null]);
  });

  it("normalises a missing subscription billing cycle to null", () => {
    const result = mapSubscriptions([
      { id: "s1", name: "Unknown cadence", amount: money("499"), nextDueDate: "" },
    ] as never);

    expect(result!.subscriptions[0].billingCycle).toBeNull();
    // An unknown cycle is not a monthly one, so it contributes no monthly cost.
    expect(result!.totalMonthlyCost).toBeNull();
  });

  it("returns no risk subject when the evidence entity has no type", () => {
    const base = {
      id: "a1",
      type: "T",
      category: "PAYMENT",
      priority: "HIGH",
      status: "ACTIVE",
      title: "t",
      description: "d",
      explanation: "e",
      dismissible: true,
      actionable: true,
      version: 1,
      createdAt: "2026-08-01T00:00:00Z",
    };
    const evidence = (sourceEntityIds: unknown) => ({
      metric: "m",
      value: 1,
      unit: "CURRENCY",
      period: null,
      baseline: null,
      comparison: null,
      source: "s",
      sourceEntityIds,
      confidence: 1,
    });

    expect(riskSubject({ ...base, evidence: [evidence([{}])] } as never)).toBeNull();
    expect(riskSubject({ ...base, evidence: [evidence(undefined)] } as never)).toBeNull();
    expect(
      riskSubject({ ...base, evidence: [evidence([{ type: "CREDIT_CARD" }])] } as never),
    ).toBe("Credit Card");
  });
});

describe("wire numbers arriving as decimal strings", () => {
  /**
   * Regression: this backend serialises decimals as strings on many routes even
   * where the DTO declares `number`. TypeScript believed the declaration, the
   * component called `.toFixed()`, and the section died with "toFixed is not a
   * function". Every numeric now passes through `num()` at the boundary.
   */
  it("coerces a string goal progress into a number", () => {
    const result = mapGoals(null, [
      {
        id: "g1",
        name: "House",
        targetAmount: money("1000000"),
        currentAmount: money("250000"),
        progressPercent: "25.5",
        currency: "INR",
        targetDate: "2030-01-01",
        goalHealth: "GOOD",
      },
    ] as never);

    const progress = result!.goals[0].progressPercent;
    expect(progress).toBe(25.5);
    expect(typeof progress).toBe("number");
    expect(() => (progress as number).toFixed(0)).not.toThrow();
  });

  it("reports unknown goal progress as null, not as zero percent", () => {
    const result = mapGoals(null, [
      { id: "g1", name: "House", targetAmount: money("1"), currency: "INR", targetDate: "2030-01-01" },
    ] as never);

    expect(result!.goals[0].progressPercent).toBeNull();
  });

  it("coerces a string health score and its component scores", () => {
    const result = mapFinancialHealth(
      {
        overallScore: "39",
        rating: "CRITICAL",
        monthlyTrend: "2.5",
        componentScores: { CASH_FLOW: { code: "CASH_FLOW", score: "0" } },
        topRecommendations: [],
      } as never,
      null,
    );

    expect(result!.overallScore).toBe(39);
    expect(result!.monthlyTrend).toBe(2.5);
    // "0" is a real zero and must survive as one, not become "not enough data".
    expect(result!.dimensions[0].score).toBe(0);
  });

  it("coerces a string category share", () => {
    const result = mapSpending(
      [{ categoryId: "c1", categoryName: "Rent", amount: money("40000"), percentage: "33.3" }] as never,
      null,
      null,
      [],
    );

    expect(result!.categories[0].percentage).toBe(33.3);
  });

  it("coerces a string budget utilisation and health score", () => {
    const result = mapBudgets({
      totalBudget: "50000",
      totalSpent: "20000",
      overallUtilization: "40",
      budgetHealthScore: "72",
      activeBudgets: [
        {
          id: "b1",
          name: "Food",
          currency: "INR",
          totalLimit: money("10000"),
          totalSpent: money("9000"),
          utilizationPercent: "90",
        },
      ],
      exceededBudgets: [],
      nearLimitBudgets: [],
    } as never);

    expect(result!.budgetHealthScore).toBe(72);
    expect(result!.budgets[0].percentUsed).toBe(90);
    expect(result!.budgets[0].status).toBe("WARNING");
  });

  it("coerces a string loan interest rate and tenure", () => {
    const result = mapDebt(
      [
        {
          id: "l1",
          name: "Car",
          type: "VEHICLE",
          currency: "INR",
          interestRate: "9.25",
          remainingTenureMonths: "36",
          outstandingPrincipal: money("400000"),
          status: "ACTIVE",
          version: 1,
        },
      ] as never,
      null,
      null,
    );

    expect(result!.debts[0].interestRatePercent).toBe(9.25);
    expect(result!.debts[0].remainingTenureMonths).toBe(36);
  });
});

/**
 * Zero and "unavailable" are different facts, and the difference is the whole
 * point of this workspace. These cases are the ones where collapsing them would
 * be actively reassuring: an unmeasured budget looking healthy, an unreported
 * loan looking repaid, an unpublished corpus looking unfunded.
 */
describe("zero is not the same as unavailable", () => {
  it("does not call a budget healthy when its spend was never reported", () => {
    const result = mapBudgets({
      totalBudget: "60000",
      totalSpent: "0",
      overallUtilization: "0",
      budgetHealthScore: 0,
      topSpendingCategories: [],
      activeBudgets: [
        // No `totalSpent`, no `utilizationPercent` — the backend measured nothing.
        { id: "b1", name: "Food", currency: "INR", totalLimit: money("60000") },
      ],
      exceededBudgets: [],
      nearLimitBudgets: [],
    } as never);

    const budget = result!.budgets[0];
    expect(budget.spentAmount).toBeNull();
    expect(budget.percentUsed).toBeNull();
    // The dangerous case: `percentUsed ?? 0` used to land this in the HEALTHY band.
    expect(budget.status).toBe("UNKNOWN");
  });

  it("still reports a genuine zero as zero", () => {
    const result = mapBudgets({
      totalBudget: "60000",
      totalSpent: "0",
      overallUtilization: "0",
      budgetHealthScore: 80,
      topSpendingCategories: [],
      activeBudgets: [
        {
          id: "b1",
          name: "Food",
          currency: "INR",
          totalLimit: money("60000"),
          totalSpent: money("0"),
          utilizationPercent: "0",
        },
      ],
      exceededBudgets: [],
      nearLimitBudgets: [],
    } as never);

    const budget = result!.budgets[0];
    expect(budget.spentAmount).toEqual(money("0"));
    expect(budget.percentUsed).toBe(0);
    expect(budget.status).toBe("HEALTHY");
  });

  it("reports a dashboard with no totals as having none, not as ₹0 budgeted", () => {
    const result = mapBudgets({
      activeBudgets: [{ id: "b1", name: "Food", currency: "INR", totalLimit: money("60000") }],
      exceededBudgets: [],
      nearLimitBudgets: [],
    } as never);

    expect(result!.totalBudgeted).toBeNull();
    expect(result!.totalSpent).toBeNull();
  });

  it("never shows an unreported loan balance as ₹0 owed", () => {
    const result = mapDebt(
      [{ id: "l1", name: "Home loan", type: "HOME", currency: "INR" }] as never,
      { totalDebt: money("240000") } as never,
      null,
    );

    expect(result!.debts[0].principalOutstanding).toBeNull();
  });

  it("never shows an unreported goal corpus as ₹0 saved", () => {
    const result = mapGoals(null, [
      { id: "g1", name: "Emergency fund", currency: "INR", targetAmount: money("300000") },
    ] as never);

    expect(result!.goals[0].currentAmount).toBeNull();
  });

  it("distinguishes a portfolio worth nothing from portfolios that published no valuation", () => {
    const unreported = mapInvestments(
      [{ portfolioId: "p1", name: "Equity", xirr: null, holdings: [] }] as never,
      null,
    );
    const genuinelyZero = mapInvestments(
      [
        {
          portfolioId: "p1",
          name: "Equity",
          xirr: null,
          totalMarketValue: "0",
          totalCostBasis: "0",
          totalUnrealizedGain: "0",
          holdings: [],
        },
      ] as never,
      null,
    );

    expect(unreported!.totalValuation).toBeNull();
    expect(genuinelyZero!.totalValuation).toEqual(money("0.00"));
  });
});

describe("XIRR is a rate, not a number to average", () => {
  const portfolio = (id: string, xirr: string | null, marketValue = "150000") => ({
    portfolioId: id,
    name: id,
    xirr,
    totalMarketValue: marketValue,
    totalCostBasis: "120000",
    totalUnrealizedGain: "30000",
    holdings: [],
  });

  it("scales the wire fraction to whole percent, like every other consumer", () => {
    // Regression: the wire sends a fraction ("0.125"). Five other screens
    // multiply by 100; Insights did not, so a 12.5% return read "0.1%".
    const result = mapInvestments([portfolio("p1", "0.125")], null);
    expect(result!.xirrPercent).toBe(12.5);
  });

  it("refuses to blend two portfolios' XIRRs into one figure", () => {
    // Internal rates of return are roots of different cash-flow polynomials.
    // The old mapper averaged them, so a small portfolio at 40% beside a large
    // one at 2% reported 21% — a number describing no actual portfolio.
    const result = mapInvestments(
      [portfolio("small", "0.40", "5000"), portfolio("large", "0.02", "500000")],
      null,
    );

    expect(result!.xirrPercent).toBeNull();
  });

  it("still reports the real figure when only one portfolio publishes one", () => {
    const result = mapInvestments(
      [portfolio("p1", "0.083"), portfolio("p2", null)],
      null,
    );

    expect(result!.xirrPercent).toBeCloseTo(8.3, 5);
  });
});

describe("mapSpending — trending panel", () => {
  // mapSpending returns null outright when there's no current-period spend at
  // all (see the categoriesRaw.length === 0 guard) — unrelated to whether
  // trend data arrived, but every case here needs to clear that guard first.
  const baseCategoryRows = [
    { categoryId: "c1", categoryName: "Rent", amount: money("40000"), percentage: 100 },
  ] as never;

  const window = (coverage: ResolvedAnalysisWindow["coverage"] = "FULL"): ResolvedAnalysisWindow => ({
    requestedWindow: "3m",
    actualStartDate: "2026-05-01",
    actualEndDate: "2026-08-01",
    availableHistoryMonths: 6,
    coverage,
    confidence: "HIGH",
  });

  const comparison = (
    percentageDelta: string | null,
    direction: PeriodComparisonResult["direction"] = "INCREASE",
  ): PeriodComparisonResult => ({
    currentValue: "1000",
    baselineValue: "800",
    absoluteDelta: "200",
    percentageDelta,
    direction,
    confidence: "HIGH",
  });

  const categoryTrend = (overrides: Partial<CategoryTrend> = {}): CategoryTrend => ({
    categoryId: "c1",
    categoryName: "Dining",
    window: window(),
    currentTotal: "3000",
    currentMonthlyAverage: "1000",
    currentMonthlyMedian: "1000",
    monthsObserved: 3,
    shareOfTotalExpense: "20",
    volatility: "0.1",
    vsPreviousPeriod: comparison("25.0"),
    vsTwelveMonthBaseline: comparison("10.0"),
    ...overrides,
  });

  const merchantTrend = (overrides: Partial<MerchantTrend> = {}): MerchantTrend => ({
    merchantId: "m1",
    merchantName: "Corner Cafe",
    window: window(),
    currentTotal: "3000",
    currentMonthlyAverage: "1000",
    currentMonthlyMedian: "1000",
    monthsObserved: 3,
    currentTransactionCount: 12,
    currentAverageTransaction: "83.33",
    volatility: "0.1",
    vsPreviousPeriod: comparison("25.0"),
    vsTwelveMonthBaseline: comparison("10.0"),
    pattern: "RECURRING",
    isPersistentIncrease: false,
    ...overrides,
  });

  it("returns null trending when neither trend endpoint responded", () => {
    const result = mapSpending(baseCategoryRows, [], [], [], null, null);
    expect(result!.trending).toBeNull();
  });

  it("ranks movers by the size of the move and carries direction straight through", () => {
    const result = mapSpending(
      baseCategoryRows,
      [],
      [],
      [],
      [categoryTrend({ categoryId: "small", categoryName: "Small move", vsPreviousPeriod: comparison("5.0") }),
       categoryTrend({ categoryId: "big", categoryName: "Big move", vsPreviousPeriod: comparison("-40.0", "DECREASE") })],
      [],
    );

    expect(result!.trending!.categories.map((c) => c.id)).toEqual(["big", "small"]);
    expect(result!.trending!.categories[0].direction).toBe("DECREASE");
    expect(result!.trending!.categories[0].changePercent).toBe(-40);
  });

  it("drops flat movers rather than reporting a 0% change as a trend", () => {
    const result = mapSpending(
      baseCategoryRows,
      [],
      [],
      [],
      [categoryTrend({ vsPreviousPeriod: comparison("0.0", "FLAT") })],
      [],
    );

    expect(result!.trending!.categories).toHaveLength(0);
  });

  it("carries the merchant's spending pattern through, categories have none", () => {
    const result = mapSpending(baseCategoryRows, [], [], [], [], [merchantTrend({ pattern: "ONE_TIME_LARGE_PURCHASE" })]);

    expect(result!.trending!.merchants[0].pattern).toBe("ONE_TIME_LARGE_PURCHASE");
    expect(result!.trending!.categories).toEqual([]);
  });

  it("surfaces insufficient-history coverage from the resolved window, not invented locally", () => {
    const result = mapSpending(
      baseCategoryRows,
      [],
      [],
      [],
      [categoryTrend({ window: window("INSUFFICIENT") })],
      [],
    );

    expect(result!.trending!.coverage).toBe("INSUFFICIENT");
  });
});
