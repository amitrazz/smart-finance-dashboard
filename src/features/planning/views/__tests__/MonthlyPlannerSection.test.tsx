import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MonthlyPlannerSection } from "../MonthlyPlannerSection";
import * as monthlyPlannerQueries from "../../hooks/useMonthlyPlannerQueries";
import { MonthlyFinancialPlan } from "../../../../types";

vi.mock("../../hooks/useMonthlyPlannerQueries");

const money = (amount: string) => ({ amount, currency: "INR" as const });

function buildPlan(overrides: Partial<MonthlyFinancialPlan> = {}): MonthlyFinancialPlan {
  return {
    period: { year: 2026, month: 8, startDate: "2026-08-01", endDate: "2026-08-31", timing: "CURRENT" },
    baseCurrency: "INR",
    sourceCurrency: "INR",
    conversionApplied: false,
    income: {
      planned: money("100000"),
      actual: money("95000"),
      variance: money("-5000"),
      remaining: money("5000"),
      utilizationPercent: 95,
      sources: [],
      expectedFullPeriod: money("100000"),
      actualToDate: money("95000"),
      remainingExpected: money("5000"),
    },
    fixedCommitments: { planned: money("20000"), actual: money("18000"), items: [], outstanding: money("0") },
    debtCommitments: {
      principal: money("0"),
      interest: money("0"),
      fees: money("0"),
      minimumPayments: money("0"),
      total: money("0"),
      principalAllocationKnown: true,
      loanItems: [],
      cardItems: [],
    },
    budget: {
      allocated: money("30000"),
      actual: money("22000"),
      variance: money("-8000"),
      remaining: money("8000"),
      overrun: money("0"),
      utilizationPercent: 73.33,
      status: "WITHIN_BUDGET",
      budgets: [],
    },
    savings: { planned: money("10000"), actual: money("8000"), byGoal: [] },
    investments: { planned: money("5000"), actual: money("0"), bySipPlan: [] },
    cashFlow: {
      openingCash: money("20000"),
      openingCashBasis: "LIVE_BALANCE",
      expectedIncome: money("100000"),
      expectedOutflow: money("40500"),
      expectedClosingCash: money("79500"),
    },
    safeToSpend: {
      expectedIncome: money("100000"),
      mandatoryCommitments: money("20000"),
      debtPayments: money("0"),
      plannedSavings: money("10000"),
      plannedInvestments: money("5000"),
      minimumCashBuffer: money("0"),
      minimumCashBufferConfigured: false,
      safeToSpend: money("65000"),
      calculated: money("65000"),
      available: money("65000"),
      shortfall: money("0"),
    },
    savingsRatePercent: 8.4,
    savingsRate: { actualPercent: null, plannedPercent: 15, projectedPercent: 8.4 },
    warnings: [],
    health: { status: "GOOD", scoreDate: "2026-08-15" },
    dataQuality: { complete: true, missingSources: [], warnings: [] },
    ...overrides,
  };
}

const noopMutation = { mutate: vi.fn(), isPending: false, data: undefined } as never;

beforeEach(() => {
  vi.mocked(monthlyPlannerQueries.useCloseMonth).mockReturnValue(noopMutation);
  vi.mocked(monthlyPlannerQueries.useRolloverMonth).mockReturnValue(noopMutation);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("MonthlyPlannerSection", () => {
  it("shows a loading skeleton while the plan is loading", () => {
    vi.mocked(monthlyPlannerQueries.useMonthlyPlan).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
    } as never);

    render(
      <MonthlyPlannerSection
        monthParam="2026-08"
        onNavigateMonth={() => {}}
        onSelectBudget={() => {}}
        onSelectGoal={() => {}}
        onNavigateBudgets={() => {}}
        onOpenCreateBudget={() => {}}
      />
    );

    expect(screen.queryByText("Monthly Financial Plan")).toBeNull();
  });

  it("shows a recoverable error state (not a raw API error) and retries on click", () => {
    const refetch = vi.fn();
    vi.mocked(monthlyPlannerQueries.useMonthlyPlan).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch,
    } as never);

    render(
      <MonthlyPlannerSection
        monthParam="2026-08"
        onNavigateMonth={() => {}}
        onSelectBudget={() => {}}
        onSelectGoal={() => {}}
        onNavigateBudgets={() => {}}
        onOpenCreateBudget={() => {}}
      />
    );

    expect(screen.getByText("Failed to Load Monthly Plan")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders the full plan once loaded, using the composed response as the only data source", () => {
    vi.mocked(monthlyPlannerQueries.useMonthlyPlan).mockReturnValue({
      data: buildPlan(),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never);

    render(
      <MonthlyPlannerSection
        monthParam="2026-08"
        onNavigateMonth={() => {}}
        onSelectBudget={() => {}}
        onSelectGoal={() => {}}
        onNavigateBudgets={() => {}}
        onOpenCreateBudget={() => {}}
      />
    );

    expect(screen.getByText("Monthly Financial Plan")).toBeDefined();
    expect(screen.getAllByText("Safe to Spend").length).toBeGreaterThan(0);
    expect(monthlyPlannerQueries.useMonthlyPlan).toHaveBeenCalledTimes(1);
  });

  it("navigates the URL month when the navigator is used, preserving the selection", () => {
    vi.mocked(monthlyPlannerQueries.useMonthlyPlan).mockReturnValue({
      data: buildPlan(),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never);

    const onNavigateMonth = vi.fn();
    render(
      <MonthlyPlannerSection
        monthParam="2026-08"
        onNavigateMonth={onNavigateMonth}
        onSelectBudget={() => {}}
        onSelectGoal={() => {}}
        onNavigateBudgets={() => {}}
        onOpenCreateBudget={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText("Next month"));
    expect(onNavigateMonth).toHaveBeenCalledWith("2026-09");
  });

  it("shows the Close Month panel only for a past month", () => {
    vi.mocked(monthlyPlannerQueries.useMonthlyPlan).mockReturnValue({
      data: buildPlan({ period: { year: 2026, month: 6, startDate: "2026-06-01", endDate: "2026-06-30", timing: "PAST" } }),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never);

    render(
      <MonthlyPlannerSection
        monthParam="2026-06"
        onNavigateMonth={() => {}}
        onSelectBudget={() => {}}
        onSelectGoal={() => {}}
        onNavigateBudgets={() => {}}
        onOpenCreateBudget={() => {}}
      />
    );

    // "Close Month" labels both the panel heading and the action button —
    // the heading is the unique landmark.
    expect(screen.getByRole("heading", { name: "Close Month" })).toBeDefined();
  });

  it("does not show the Close Month panel for the current month", () => {
    vi.mocked(monthlyPlannerQueries.useMonthlyPlan).mockReturnValue({
      data: buildPlan(),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never);

    render(
      <MonthlyPlannerSection
        monthParam="2026-08"
        onNavigateMonth={() => {}}
        onSelectBudget={() => {}}
        onSelectGoal={() => {}}
        onNavigateBudgets={() => {}}
        onOpenCreateBudget={() => {}}
      />
    );

    expect(screen.queryByText("Close Month")).toBeNull();
  });
});
