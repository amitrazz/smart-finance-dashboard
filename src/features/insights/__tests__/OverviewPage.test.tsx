import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { InsightsQueryResult } from "../hooks/useInsightsQueries";
import type {
  FinancialHealthOverview,
  RiskMatrixAnalytics,
  SmartRecommendation,
} from "../types/insightsTypes";
import { useUIStore } from "../../../store/useUIStore";

/**
 * Overview is tested through its hooks rather than through the network, so
 * these assertions are about *composition decisions* — what gets shown, how
 * much of it, and in what order — not about fetching.
 */
const hooks = vi.hoisted(() => ({
  useFinancialHealth: vi.fn(),
  useRiskMatrix: vi.fn(),
  useNetWorthAnalytics: vi.fn(),
  useCashFlowAnalytics: vi.fn(),
  useDebtAnalytics: vi.fn(),
  useInvestmentAnalytics: vi.fn(),
  useRecommendations: vi.fn(),
  useForecastAnalytics: vi.fn(),
}));

vi.mock("../hooks/useInsightsQueries", () => hooks);

import { OverviewPage } from "../pages/OverviewPage";

function result<T>(data: T | null, over: Partial<InsightsQueryResult<T>> = {}): InsightsQueryResult<T> {
  return {
    data,
    isLoading: false,
    isError: false,
    isPartial: false,
    isStale: false,
    updatedAt: Date.parse("2026-08-11T09:00:00Z"),
    refetch: vi.fn(),
    ...over,
  };
}

const money = (amount: string) => ({ amount, currency: "INR" });

const EIGHT_DIMENSIONS = [
  { code: "CASH_FLOW", label: "Cash flow", score: 0 },
  { code: "SAVINGS_RATE", label: "Savings rate", score: 4 },
  { code: "EMERGENCY_FUND", label: "Emergency fund", score: 12 },
  { code: "DEBT_HEALTH", label: "Debt health", score: 44 },
  { code: "CREDIT_UTILIZATION", label: "Credit utilisation", score: 52 },
  { code: "INVESTMENT_DIVERSIFICATION", label: "Investment diversification", score: 61 },
  { code: "BILL_DISCIPLINE", label: "Bill discipline", score: 78 },
  { code: "SPENDING_DISCIPLINE", label: "Spending discipline", score: 90 },
].map((d) => ({ ...d, why: null, improvement: null, scoreImpact: null, deepLink: null }));

const health: FinancialHealthOverview = {
  overallScore: 36,
  rating: "CRITICAL",
  monthlyTrend: 2,
  history: [],
  dimensions: EIGHT_DIMENSIONS,
  asOf: "2026-08-01",
};

const riskMatrix: RiskMatrixAnalytics = {
  criticalCount: 1,
  highCount: 1,
  mediumCount: 1,
  lowCount: 1,
  risks: [
    {
      id: "medium-1",
      title: "Subscription renewed at a higher price",
      category: "Overspending",
      severity: "MEDIUM",
      confidencePercent: 70,
      reason: "Charged ₹499 against a usual ₹299",
      affectedEntity: null,
      financialImpact: null,
      dueInDays: null,
      resolution: null,
      deepLink: null,
    },
    {
      id: "critical-1",
      title: "Card payment overdue",
      category: "Credit",
      severity: "CRITICAL",
      confidencePercent: 100,
      reason: "₹18,000 was due two days ago",
      affectedEntity: "Credit Card",
      financialImpact: money("18000"),
      dueInDays: -2,
      resolution: "Pay the statement balance",
      deepLink: "credit-cards",
    },
    {
      id: "high-1",
      title: "Emergency fund below target",
      category: "Savings",
      severity: "HIGH",
      confidencePercent: 90,
      reason: "Covers 1.2 months against a 6-month target",
      affectedEntity: null,
      financialImpact: null,
      dueInDays: null,
      resolution: null,
      deepLink: null,
    },
    {
      id: "low-1",
      title: "Uncategorised inflow",
      category: "Cash flow",
      severity: "LOW",
      confidencePercent: null,
      reason: "One transaction has no category",
      affectedEntity: null,
      financialImpact: null,
      dueInDays: null,
      resolution: null,
      deepLink: null,
    },
  ],
};

const recommendations: SmartRecommendation[] = [
  {
    id: "r-long",
    title: "Review your asset allocation annually",
    reason: null,
    impactType: "LONG_TERM",
    component: "INVESTMENT_DIVERSIFICATION",
    scoreImpact: null,
    deepLink: null,
  },
  {
    id: "r-high",
    title: "Increase your emergency fund",
    reason: "₹4,544 remains to reach a six-month target",
    impactType: "HIGH_IMPACT",
    component: "EMERGENCY_FUND",
    scoreImpact: 9,
    deepLink: null,
  },
  {
    id: "r-quick",
    title: "Set up autopay on your card",
    reason: null,
    impactType: "QUICK_WIN",
    component: "BILL_DISCIPLINE",
    scoreImpact: 2,
    deepLink: null,
  },
];

const netWorth = {
  currentNetWorth: money("842000"),
  totalAssets: money("1142000"),
  totalLiabilities: money("300000"),
  periodChangeAmount: money("42000"),
  periodChangePercent: 5.25,
  windowChangeAmount: money("120000"),
  windowChangePercent: 16.6,
  history: [
    { date: "2026-06-01", netWorth: 800000, totalAssets: 1120000, totalLiabilities: 320000 },
    { date: "2026-07-01", netWorth: 842000, totalAssets: 1142000, totalLiabilities: 300000 },
  ],
  assetBreakdown: [],
  liabilityBreakdown: [],
  asOf: "2026-07-01",
};

const cashFlow = {
  period: "2026-07",
  totalIncome: money("200000"),
  totalExpenses: money("140000"),
  netCashFlow: money("60000"),
  savingsRatePercent: 30,
  savingsRateChangePoints: -4.2,
  history: [
    { month: "2026-06", income: 190000, expenses: 120000, netCashFlow: 70000 },
    { month: "2026-07", income: 200000, expenses: 140000, netCashFlow: 60000 },
  ],
  largestExpenseCategory: null,
  largestIncomeSource: null,
};

function setDefaults() {
  hooks.useFinancialHealth.mockReturnValue(result(health));
  hooks.useRiskMatrix.mockReturnValue(result(riskMatrix));
  hooks.useNetWorthAnalytics.mockReturnValue(result(netWorth));
  hooks.useCashFlowAnalytics.mockReturnValue(result(cashFlow));
  hooks.useDebtAnalytics.mockReturnValue(result({ totalDebt: money("300000"), totalMonthlyEMI: null, debtToIncomeRatioPercent: null, debts: [] }));
  hooks.useInvestmentAnalytics.mockReturnValue(result(null));
  hooks.useRecommendations.mockReturnValue(result(recommendations));
  hooks.useForecastAnalytics.mockReturnValue(result(null));
}

const renderOverview = () => render(<OverviewPage onNavigate={vi.fn()} />);

/**
 * Scopes a query to one section. Several words legitimately appear twice on
 * this page — "Critical" is both a health status and a risk severity, "Savings
 * rate" is both a dimension and a trajectory KPI — so page-wide text queries
 * would be ambiguous by design rather than by mistake.
 */
const section = (name: string) =>
  within(screen.getByRole("heading", { name, level: 2 }).closest("section")!);

// `globals: false` means Testing Library's automatic cleanup never registers,
// so without this every render accumulates in the document and single-element
// queries fail with "found multiple elements".
afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  setDefaults();
  // Privacy mode masks amounts app-wide; reveal them so assertions can read them.
  useUIStore.setState({ moneyVisible: true });
});

describe("Overview — what it shows", () => {
  it("leads with the score, its status word and its direction", () => {
    renderOverview();

    const health = section("Financial health");
    expect(health.getByText("36")).toBeInTheDocument();
    // Status is text, never colour alone — and the dial carries the same facts
    // as an accessible label rather than leaving the arc to be interpreted.
    expect(
      health.getByRole("img", {
        name: "Financial health score 36 out of 100. Status: Critical.",
      }),
    ).toBeInTheDocument();
    expect(health.getByText(/\+2 pts vs previous period/)).toBeInTheDocument();
  });

  it("shows only the three weakest health dimensions, not all eight", () => {
    renderOverview();

    // The single biggest contributor to the old Overview's density was the full
    // eight-dimension grid. Only the worst three belong here.
    const health = section("Financial health");
    expect(health.getByText("Cash flow")).toBeInTheDocument();
    expect(health.getByText("Savings rate")).toBeInTheDocument();
    expect(health.getByText("Emergency fund")).toBeInTheDocument();

    expect(health.queryByText("Bill discipline")).not.toBeInTheDocument();
    expect(health.queryByText("Spending discipline")).not.toBeInTheDocument();
    expect(health.queryByText("Credit utilisation")).not.toBeInTheDocument();
    expect(health.queryByText("Debt health")).not.toBeInTheDocument();

    expect(health.getByRole("button", { name: /View all 8 dimensions/ })).toBeInTheDocument();
  });

  it("separates diagnosis, attention, change, action and trajectory into distinct sections", () => {
    renderOverview();

    for (const heading of [
      "Financial health",
      "Attention required",
      "What changed",
      "Recommended actions",
      "Current trajectory",
    ]) {
      expect(screen.getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
    }
  });

  it("ranks risks by severity and caps the list, pointing at Intelligence for the rest", () => {
    renderOverview();

    const attention = section("Attention required");
    const titles = attention.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

    expect(titles).toEqual([
      "Card payment overdue",
      "Emergency fund below target",
      "Subscription renewed at a higher price",
    ]);
    expect(attention.getByText(/1 more risk under Intelligence/)).toBeInTheDocument();
  });

  it("decomposes the risk count instead of stating a bare total", () => {
    renderOverview();

    expect(
      section("Attention required").getByText(/1 critical, 1 high, 1 medium, 1 low/),
    ).toBeInTheDocument();
  });

  it("shows the highest-impact recommendations first", () => {
    renderOverview();

    const titles = section("Recommended actions")
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);

    expect(titles[0]).toBe("Increase your emergency fund");
    expect(titles).toHaveLength(3);
  });

  it("never advertises a monetary saving a recommendation doesn't carry", () => {
    renderOverview();

    const actions = section("Recommended actions");
    // The previous card always rendered "Est. Monthly Impact +₹0.00" in emerald,
    // because the mapper hardcoded the figure to zero.
    expect(actions.queryByText(/Est\. Monthly Impact/i)).not.toBeInTheDocument();
    expect(actions.queryByText(/Confidence/i)).not.toBeInTheDocument();
    // What it does show is the score movement the engine actually attributes.
    expect(actions.getByText("+9 pts to health score")).toBeInTheDocument();
    expect(actions.getByText("+2 pts to health score")).toBeInTheDocument();
    // The unquantified one claims no effect at all.
    expect(actions.queryByText(/0 pts to health score/)).not.toBeInTheDocument();
  });

  it("reports what moved, with money formatted through the shared currency layer", () => {
    renderOverview();

    const changed = section("What changed");
    expect(changed.getByText("Net worth")).toBeInTheDocument();
    // Indian locale grouping via Intl, not hand-concatenated "₹" + amount.
    expect(changed.getByText("+₹42,000.00")).toBeInTheDocument();
    expect(changed.getByText("−4.2 pts")).toBeInTheDocument();
  });
});

describe("Overview — data states", () => {
  it("says the score is unavailable rather than rendering 0 / 100", () => {
    hooks.useFinancialHealth.mockReturnValue(result<FinancialHealthOverview>(null));
    renderOverview();

    const health = section("Financial health");
    expect(health.getByText("No health score yet")).toBeInTheDocument();
    expect(health.queryByText("36")).not.toBeInTheDocument();
    // The old mapper's fallback rendered exactly this.
    expect(health.queryByText("0")).not.toBeInTheDocument();
    expect(health.queryByText("/ 100")).not.toBeInTheDocument();
    expect(health.queryByText("Critical")).not.toBeInTheDocument();
  });

  it("offers a retry when a section's request fails", () => {
    const refetch = vi.fn();
    hooks.useFinancialHealth.mockReturnValue(
      result<FinancialHealthOverview>(null, { isError: true, refetch }),
    );
    renderOverview();

    const retry = section("Financial health").getByRole("button", { name: /Retry/i });
    retry.click();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("flags a section as incomplete when an enrichment source is missing", () => {
    hooks.useRiskMatrix.mockReturnValue(result(riskMatrix, { isPartial: true }));
    renderOverview();

    expect(
      section("Attention required").getByText(/Some of this section's data is unavailable/),
    ).toBeInTheDocument();
  });

  it("marks cached figures as updating while a refresh is in flight", () => {
    hooks.useRiskMatrix.mockReturnValue(result(riskMatrix, { isStale: true }));
    renderOverview();

    expect(section("Attention required").getByText("Updating…")).toBeInTheDocument();
  });

  it("reassures rather than showing an empty region when nothing is flagged", () => {
    hooks.useRiskMatrix.mockReturnValue(
      result({ criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, risks: [] }),
    );
    renderOverview();

    expect(section("Attention required").getByText("Nothing needs your attention")).toBeInTheDocument();
  });

  it("explains the absence of a comparison instead of reporting zero change", () => {
    hooks.useNetWorthAnalytics.mockReturnValue(
      result({ ...netWorth, periodChangeAmount: null, periodChangePercent: null, history: [] }),
    );
    hooks.useCashFlowAnalytics.mockReturnValue(result({ ...cashFlow, history: [], savingsRateChangePoints: null }));
    renderOverview();

    expect(section("What changed").getByText("No comparison available")).toBeInTheDocument();
  });

  it("shows a KPI as unavailable rather than as zero", () => {
    // Investments returns null in the default fixture: no portfolios exist.
    renderOverview();

    const trajectory = section("Current trajectory");
    expect(trajectory.getAllByText("Not enough data").length).toBeGreaterThan(0);
  });
});
