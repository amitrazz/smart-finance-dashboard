import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useMonthlyPlan, MONTHLY_PLANNER_QUERY_KEYS } from "../useMonthlyPlannerQueries";

vi.mock("../../../../services/api/endpoints", () => ({
  api: {
    getMonthlyPlan: vi.fn(),
  },
}));

const RAW_PLAN = {
  period: { year: 2026, month: 8, startDate: "2026-08-01", endDate: "2026-08-31", timing: "CURRENT" },
  baseCurrency: "INR",
  sourceCurrency: "INR",
  conversionApplied: false,
  income: {
    planned: "100000",
    actual: "95000",
    variance: "-5000",
    remaining: "5000",
    utilizationPercent: "95",
    sources: [],
    expectedFullPeriod: "100000",
    actualToDate: "95000",
    remainingExpected: "5000",
  },
  fixedCommitments: { planned: "20000", actual: "18000", items: [], outstanding: "0" },
  debtCommitments: {
    principal: "5000",
    interest: "500",
    fees: "0",
    minimumPayments: "5500",
    total: "5500",
    principalAllocationKnown: true,
    loanItems: [],
    cardItems: [],
  },
  budget: {
    allocated: "30000",
    actual: "22000",
    variance: "-8000",
    remaining: "8000",
    overrun: "0",
    utilizationPercent: "73.33",
    status: "WITHIN_BUDGET",
    budgets: [],
  },
  savings: { planned: "10000", actual: "8000", byGoal: [] },
  investments: { planned: "5000", actual: "0", bySipPlan: [] },
  cashFlow: {
    openingCash: "20000",
    openingCashBasis: "LIVE_BALANCE",
    expectedIncome: "100000",
    expectedOutflow: "40500",
    expectedClosingCash: "79500",
  },
  safeToSpend: {
    expectedIncome: "100000",
    mandatoryCommitments: "20000",
    debtPayments: "5500",
    plannedSavings: "10000",
    plannedInvestments: "5000",
    minimumCashBuffer: "0",
    minimumCashBufferConfigured: true,
    safeToSpend: "59500",
    calculated: "59500",
    available: "59500",
    shortfall: "0",
  },
  savingsRatePercent: "8.4",
  savingsRate: { actualPercent: "12.5", plannedPercent: "15", projectedPercent: "8.4" },
  warnings: [],
  health: { status: "GOOD", scoreDate: "2026-08-15" },
  dataQuality: { complete: true, missingSources: [], warnings: [] },
};

beforeEach(() => {
  // useMonthlyPlannerQueries' isAuth() gate reads the auth store's
  // isAuthenticated flag (mirrors useBudgetQueries.ts's own gate), not the
  // in-memory access token useFinanceQueries.ts's queries key off.
  useAuthStore.setState({ isAuthenticated: true });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useAuthStore.setState({ isAuthenticated: false });
});

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useMonthlyPlan", () => {
  it("maps every raw decimal-string field into a Money object using the response's baseCurrency", async () => {
    vi.mocked(api.getMonthlyPlan).mockResolvedValue(RAW_PLAN as never);

    const { result } = renderHook(() => useMonthlyPlan(2026, 8, "0"), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.income.planned).toEqual({ amount: "100000", currency: "INR" });
    expect(result.current.data?.income.actual).toEqual({ amount: "95000", currency: "INR" });
    expect(result.current.data?.income.expectedFullPeriod).toEqual({ amount: "100000", currency: "INR" });
    expect(result.current.data?.income.remainingExpected).toEqual({ amount: "5000", currency: "INR" });
    expect(result.current.data?.safeToSpend?.safeToSpend).toEqual({ amount: "59500", currency: "INR" });
    expect(result.current.data?.safeToSpend?.available).toEqual({ amount: "59500", currency: "INR" });
    expect(result.current.data?.safeToSpend?.shortfall).toEqual({ amount: "0", currency: "INR" });
    expect(result.current.data?.safeToSpend?.minimumCashBufferConfigured).toBe(true);
    expect(result.current.data?.debtCommitments.principalAllocationKnown).toBe(true);
    expect(result.current.data?.budget.status).toBe("WITHIN_BUDGET");
    expect(result.current.data?.savingsRate).toEqual({ actualPercent: 12.5, plannedPercent: 15, projectedPercent: 8.4 });
    expect(result.current.data?.dataQuality).toEqual({ complete: true, missingSources: [], warnings: [] });
    expect(result.current.data?.cashFlow?.openingCashBasis).toBe("LIVE_BALANCE");
    expect(result.current.data?.savingsRatePercent).toBeCloseTo(8.4);
  });

  it("maps a null savingsRate.actualPercent through as null, never a fabricated 0", async () => {
    vi.mocked(api.getMonthlyPlan).mockResolvedValue({
      ...RAW_PLAN,
      savingsRate: { actualPercent: null, plannedPercent: "15", projectedPercent: "8.4" },
    } as never);

    const { result } = renderHook(() => useMonthlyPlan(2026, 8, "0"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.savingsRate.actualPercent).toBeNull();
  });

  it("uses a query key that includes year, month, and the cash buffer so changing any of them refetches", () => {
    expect(MONTHLY_PLANNER_QUERY_KEYS.plan(2026, 8, "0")).toEqual(["monthly-planner", "plan", 2026, 8, "0"]);
    expect(MONTHLY_PLANNER_QUERY_KEYS.plan(2026, 8, "5000")).not.toEqual(
      MONTHLY_PLANNER_QUERY_KEYS.plan(2026, 8, "0")
    );
  });

  it("passes includeActuals/includeWarnings/includeBreakdown and the buffer through to the API call", async () => {
    vi.mocked(api.getMonthlyPlan).mockResolvedValue(RAW_PLAN as never);

    renderHook(() => useMonthlyPlan(2026, 8, "2500"), { wrapper: makeWrapper() });

    await waitFor(() => expect(api.getMonthlyPlan).toHaveBeenCalledTimes(1));
    expect(api.getMonthlyPlan).toHaveBeenCalledWith({
      year: 2026,
      month: 8,
      includeActuals: true,
      includeWarnings: true,
      includeBreakdown: true,
      minimumCashBuffer: "2500",
    });
  });

  it("omits minimumCashBuffer entirely (never sends '0') when the caller hasn't configured one", async () => {
    vi.mocked(api.getMonthlyPlan).mockResolvedValue(RAW_PLAN as never);

    renderHook(() => useMonthlyPlan(2026, 8, ""), { wrapper: makeWrapper() });

    await waitFor(() => expect(api.getMonthlyPlan).toHaveBeenCalledTimes(1));
    expect(api.getMonthlyPlan).toHaveBeenCalledWith({
      year: 2026,
      month: 8,
      includeActuals: true,
      includeWarnings: true,
      includeBreakdown: true,
      minimumCashBuffer: undefined,
    });
  });
});
