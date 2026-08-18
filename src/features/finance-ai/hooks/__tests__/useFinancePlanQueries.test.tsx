import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useAcceptFinancePlan, useDeclineFinancePlan, FINANCE_PLAN_QUERY_KEYS } from "../useFinancePlanQueries";
import { GOAL_QUERY_KEYS } from "../../../goals/hooks/useGoalQueries";
import type { FinancePlan } from "../../../../types";

vi.mock("../../../../services/api/endpoints", () => ({
  api: {
    acceptFinancePlan: vi.fn(),
    declineFinancePlan: vi.fn(),
  },
}));

const basePlan: FinancePlan = {
  id: "plan_1",
  parentPlanId: null,
  version: 1,
  objective: "SAVE_FOR_GOAL",
  status: "ACCEPTED",
  title: "Reach ₹5,00,000",
  narrative: null,
  baseline: {
    currency: "INR",
    monthlyIncome: "120000",
    monthlyExpenses: "40000",
    monthlySurplus: "80000",
    savingsRate: "0.6667",
    cashPosition: "80000",
    totalExistingDebt: "0",
    debtToIncomeRatio: "0",
    relevantGoals: [],
    relevantBudgets: [],
    generatedAt: "2026-08-18T09:00:00.000Z",
  },
  assumptions: null,
  constraints: [],
  projections: {
    id: "balanced",
    label: "Balanced",
    monthsRemaining: 24,
    requiredMonthlyContribution: { amount: "20833.33", currency: "INR" },
    projectedCompletionMonths: 24,
    bufferMonthsAfterImpact: "1.48",
    meetsMinimumBuffer: true,
    feasible: true,
    surplusAfterContribution: { amount: "59166.67", currency: "INR" },
    constraintViolations: [],
    score: 87.5,
  },
  alternatives: [],
  risks: null,
  basedOnDataAt: "2026-08-18T09:00:00.000Z",
  expiresAt: "2026-08-21T09:00:00.000Z",
  declineReason: null,
  createdAt: "2026-08-18T09:00:00.000Z",
  updatedAt: "2026-08-18T09:00:00.000Z",
  actions: [],
};

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useAuthStore.setState({ isAuthenticated: false });
});

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe("useAcceptFinancePlan — the accept response is authoritative, never an ack", () => {
  it("invalidates Goals/Budgets/dashboard when the plan actually executed (ACTIVE)", async () => {
    vi.mocked(api.acceptFinancePlan).mockResolvedValue({ ...basePlan, status: "ACTIVE" });
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAcceptFinancePlan(), { wrapper });
    result.current.mutate("plan_1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(invalidatedKeys).toContainEqual(JSON.stringify(GOAL_QUERY_KEYS.all));
  });

  it("does NOT invalidate Goals/Budgets when the backend reports STALE — nothing executed, so nothing downstream changed", async () => {
    vi.mocked(api.acceptFinancePlan).mockResolvedValue({ ...basePlan, status: "STALE" });
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAcceptFinancePlan(), { wrapper });
    result.current.mutate("plan_1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("STALE");

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(invalidatedKeys).not.toContainEqual(JSON.stringify(GOAL_QUERY_KEYS.all));
    // The plan itself still needs to be refetched so the UI reflects STALE.
    expect(invalidatedKeys).toContainEqual(JSON.stringify(FINANCE_PLAN_QUERY_KEYS.all));
  });

  it("re-fetches the plan (rather than retrying) when the backend returns 409 CONCURRENCY_CONFLICT", async () => {
    const { ApiError } = await import("../../../../services/api/client");
    vi.mocked(api.acceptFinancePlan).mockRejectedValue(
      new ApiError("conflict", 409, "VALIDATION", "conflict", "CONCURRENCY_CONFLICT"),
    );
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAcceptFinancePlan(), { wrapper });
    result.current.mutate("plan_1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(api.acceptFinancePlan).toHaveBeenCalledTimes(1);
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(invalidatedKeys).toContainEqual(JSON.stringify(FINANCE_PLAN_QUERY_KEYS.detail("plan_1")));
  });
});

describe("useDeclineFinancePlan", () => {
  it("never invalidates Goal/Budget caches — decline makes no domain mutation", async () => {
    vi.mocked(api.declineFinancePlan).mockResolvedValue({ ...basePlan, status: "DECLINED" });
    const { wrapper, queryClient } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeclineFinancePlan(), { wrapper });
    result.current.mutate({ id: "plan_1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(invalidatedKeys).not.toContainEqual(JSON.stringify(GOAL_QUERY_KEYS.all));
  });
});
