import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { InsightsQueryResult } from "../hooks/useInsightsQueries";
import type { IntelligenceItem } from "../api/intelligenceModel";
import type { CashFlowAnalytics, FinancialHealthOverview, NetWorthAnalytics } from "../types/insightsTypes";
import { useUIStore } from "../../../store/useUIStore";

/**
 * Overview is tested through its hooks rather than through the network, so these
 * assertions are about *composition decisions* — what the page says, what it
 * refuses to say, and in what order — not about fetching.
 */
const hooks = vi.hoisted(() => ({
  useNetWorthAnalytics: vi.fn(),
  useCashFlowAnalytics: vi.fn(),
  useDebtAnalytics: vi.fn(),
  useFinancialHealth: vi.fn(),
  useIntelligenceFeed: vi.fn(),
  useForecastAnalytics: vi.fn(),
}));

vi.mock("../hooks/useInsightsQueries", () => hooks);

import { OverviewPage } from "../pages/OverviewPage";

function result<T>(
  data: T | null,
  over: Partial<InsightsQueryResult<T>> = {},
): InsightsQueryResult<T> {
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

const netWorth: NetWorthAnalytics = {
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

const cashFlow: CashFlowAnalytics = {
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

const health: FinancialHealthOverview = {
  overallScore: 36,
  rating: "CRITICAL",
  monthlyTrend: 2,
  history: [],
  dimensions: [
    { code: "CASH_FLOW", label: "Cash flow", score: 20, why: null, improvement: null, scoreImpact: null, deepLink: null },
    { code: "SAVINGS_RATE", label: "Savings rate", score: null, why: null, improvement: null, scoreImpact: null, deepLink: null },
  ],
  asOf: "2026-08-01",
};

const feedItem = (over: Partial<IntelligenceItem> = {}): IntelligenceItem => ({
  id: "action-1",
  nature: "risk",
  severity: "CRITICAL",
  category: "Credit",
  filters: ["all", "risk", "attention", "debt"],
  title: "Card payment overdue",
  observed: "₹18,000 was due two days ago",
  interpretation: null,
  suggestedAction: "Pay the statement balance",
  financialImpact: money("18000"),
  dueInDays: -2,
  confidencePercent: 100,
  scoreImpact: -6,
  evidence: [],
  affectedEntity: "Credit Card",
  deepLink: "credit-cards",
  component: null,
  rank: 80,
  ...over,
});

function setDefaults() {
  hooks.useNetWorthAnalytics.mockReturnValue(result(netWorth));
  hooks.useCashFlowAnalytics.mockReturnValue(result(cashFlow));
  hooks.useDebtAnalytics.mockReturnValue(
    result({
      totalDebt: money("300000"),
      totalMonthlyEMI: null,
      debtToIncomeRatioPercent: null,
      debts: [],
    }),
  );
  hooks.useFinancialHealth.mockReturnValue(result(health));
  hooks.useIntelligenceFeed.mockReturnValue(
    result([feedItem(), feedItem({ id: "action-2", title: "Second finding", rank: 10 })]),
  );
  hooks.useForecastAnalytics.mockReturnValue(
    result({
      currentNetWorth: money("842315"),
      projectedCorpus: money("42800000"),
      monthlySavingsNeeded: money("38400"),
      currentAge: 30,
      retirementAge: 60,
      expectedReturnPercent: 9,
      history: [],
    }),
  );
}

const renderOverview = () => render(<OverviewPage onNavigate={vi.fn()} />);

/** Scopes a query to one section — several labels legitimately repeat on this page. */
const section = (name: string | RegExp) =>
  within(screen.getByRole("region", { name }));

// `globals: false` means Testing Library's automatic cleanup never registers, so
// without this every render accumulates in the document.
afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  setDefaults();
  useUIStore.setState({ moneyVisible: true });
});

describe("Overview — the thirty-second answer", () => {
  it("leads with a verdict in words, not with a chart", () => {
    renderOverview();

    const story = screen.getByRole("region", { name: "Financial story" });
    // The fixture moved both ways — net worth and debt improved, spending and
    // the savings rate deteriorated — so the honest verdict is "mixed".
    expect(within(story).getByText("Mixed")).toBeInTheDocument();
    expect(
      within(story).getByText(/Your financial position moved in both directions/),
    ).toBeInTheDocument();
  });

  it("does not report a mixed period as an improvement", () => {
    // Regression, found in visual QA: the verdict read net worth and stopped, so
    // a period whose spending rose ₹53,165, whose cash flow ran a ₹1,87,322
    // shortfall and whose savings rate fell 19.8 points was headlined "Your
    // financial position improved this period" — the one line a hurried reader
    // takes away reported the good half and hid the rest.
    renderOverview();
    const story = screen.getByRole("region", { name: "Financial story" });

    expect(within(story).queryByText(/position improved/)).not.toBeInTheDocument();
  });

  it("calls a genuinely one-way period what it is", () => {
    hooks.useCashFlowAnalytics.mockReturnValue(
      result({
        ...cashFlow,
        savingsRateChangePoints: 3.1,
        history: [
          { month: "2026-06", income: 190000, expenses: 150000, netCashFlow: 40000 },
          { month: "2026-07", income: 200000, expenses: 140000, netCashFlow: 60000 },
        ],
      }),
    );
    renderOverview();

    const story = screen.getByRole("region", { name: "Financial story" });
    expect(within(story).getByText("Improved")).toBeInTheDocument();
  });

  it("reports a flat figure as unchanged rather than as a rise of zero", () => {
    hooks.useCashFlowAnalytics.mockReturnValue(
      result({
        ...cashFlow,
        history: [
          { month: "2026-06", income: 200000, expenses: 120000, netCashFlow: 80000 },
          { month: "2026-07", income: 200000, expenses: 140000, netCashFlow: 60000 },
        ],
      }),
    );
    renderOverview();

    const story = screen.getByRole("region", { name: "Financial story" });
    expect(story.textContent).toContain("Income was unchanged");
    expect(story.textContent).not.toMatch(/Income rose ₹0/);
  });

  it("keeps the sign on a negative rate", () => {
    // Regression: the rate rendered through `Math.abs`, so a −69.8% savings rate
    // read "to 69.8%" — the sentence said the opposite of the fact.
    hooks.useCashFlowAnalytics.mockReturnValue(
      result({ ...cashFlow, savingsRatePercent: -69.8, savingsRateChangePoints: -19.8 }),
    );
    renderOverview();

    const story = screen.getByRole("region", { name: "Financial story" });
    expect(story.textContent).toMatch(/to −69\.8%/);
  });

  it("states movements as comparisons and never as causes", () => {
    renderOverview();

    const story = screen.getByRole("region", { name: "Financial story" });
    expect(story.textContent).toMatch(/Income rose .* while spending rose/);
    // The data supports "while". It does not support "because", and no sentence
    // in the story may imply one movement produced another.
    expect(story.textContent).not.toMatch(/because|due to|driven by|caused/i);
  });

  it("names the baseline the comparison is against", () => {
    renderOverview();
    expect(
      screen.getByText(/Measured between two recorded periods, Jun 26 and Jul 26/),
    ).toBeInTheDocument();
  });

  it("sorts movements by whether they went the user's way, not by direction", () => {
    renderOverview();

    const changed = section("What changed");
    const improved = changed.getByText("What improved").closest("div")!;
    const attention = changed.getByText("What needs attention").closest("div")!;

    // Net worth up and debt down are both wins despite opposite arrows; spending
    // up is a loss despite sharing an arrow with income up.
    expect(within(improved).getByText("Net worth")).toBeInTheDocument();
    expect(within(improved).getByText("Debt")).toBeInTheDocument();
    expect(within(attention).getByText("Spending")).toBeInTheDocument();
    expect(within(attention).getByText("Savings rate")).toBeInTheDocument();
  });

  it("shows one next action — the highest-ranked one — rather than a list to triage", () => {
    renderOverview();

    const next = section("Do this next");
    expect(next.getByText("Card payment overdue")).toBeInTheDocument();
    expect(next.queryByText("Second finding")).not.toBeInTheDocument();
  });

  it("reports what share of income was spent, from reported figures", () => {
    renderOverview();
    expect(section("Money flow").getByText("70%")).toBeInTheDocument();
  });

  it("shows an overspend as exceeding income rather than as a tidy full bar", () => {
    hooks.useCashFlowAnalytics.mockReturnValue(
      result({
        ...cashFlow,
        totalIncome: money("268315"),
        totalExpenses: money("455637"),
        netCashFlow: money("-187322"),
        savingsRatePercent: -69.8,
      }),
    );
    renderOverview();

    const flow = section("Money flow");
    expect(flow.getByText(/Spending was/)).toBeInTheDocument();
    expect(flow.getByText("170%")).toBeInTheDocument();
    expect(flow.getByText("Beyond income")).toBeInTheDocument();
  });
});

describe("Overview — what it refuses to say", () => {
  it("declines to tell a story when there is nothing to compare against", () => {
    hooks.useNetWorthAnalytics.mockReturnValue(
      result({ ...netWorth, periodChangeAmount: null, periodChangePercent: null, history: [] }),
    );
    hooks.useCashFlowAnalytics.mockReturnValue(
      result({ ...cashFlow, savingsRateChangePoints: null, history: [] }),
    );
    renderOverview();

    expect(screen.getByText("Not enough history to tell you what changed")).toBeInTheDocument();
    expect(screen.queryByText(/Your financial position/)).not.toBeInTheDocument();
  });

  it("says a missing health score is missing rather than rendering 0 / 100", () => {
    hooks.useFinancialHealth.mockReturnValue(result(null));
    renderOverview();

    expect(section("Financial health").getByText("No health score yet")).toBeInTheDocument();
    expect(screen.queryByText("0 / 100")).not.toBeInTheDocument();
  });

  it("shows an absent net cash flow as absent, not as zero", () => {
    hooks.useCashFlowAnalytics.mockReturnValue(result({ ...cashFlow, netCashFlow: null }));
    renderOverview();

    const snapshot = screen.getByRole("region", { name: "Financial story" });
    expect(within(snapshot).getByText("Not enough data")).toBeInTheDocument();
  });

  it("announces a failure and offers a retry rather than blanking the page", () => {
    const refetch = vi.fn();
    hooks.useNetWorthAnalytics.mockReturnValue(result(null, { isError: true, refetch }));
    hooks.useCashFlowAnalytics.mockReturnValue(result(null, { isError: true, refetch }));
    renderOverview();

    // Each section fails independently, so scope to the one that leads the page.
    const story = screen.getByRole("region", { name: "Financial story" });
    expect(within(story).getByRole("alert")).toBeInTheDocument();

    fireEvent.click(within(story).getByRole("button", { name: /try again|retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("keeps the narrative inside privacy mode", () => {
    useUIStore.setState({ moneyVisible: false });
    renderOverview();

    const story = screen.getByRole("region", { name: "Financial story" });
    // The sentence structure survives; the amounts inside it do not. A story
    // built by interpolating rupees into a template string would leak every one
    // of them straight into the DOM.
    expect(within(story).getByText(/Your financial position/)).toBeInTheDocument();
    expect(story.textContent).toContain("••••");
    expect(story.textContent).not.toContain("42,000");
    expect(story.textContent).not.toContain("60,000");
  });
});
