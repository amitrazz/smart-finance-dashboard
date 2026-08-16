import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useUIStore } from "../../../../store/useUIStore";
import {
  useCancelRecurringContributionRule,
  useCreateRecurringContributionRule,
  usePauseRecurringContributionRule,
  useRecurringContributionExecutions,
  useRecurringContributionRules,
  useResumeRecurringContributionRule,
} from "../useRetirementQueries";

vi.mock("../../../../services/api/endpoints", () => ({
  api: {
    createRecurringContributionRule: vi.fn(),
    getRecurringContributionRules: vi.fn(),
    getRecurringContributionRule: vi.fn(),
    pauseRecurringContributionRule: vi.fn(),
    resumeRecurringContributionRule: vi.fn(),
    cancelRecurringContributionRule: vi.fn(),
    getRecurringContributionExecutions: vi.fn(),
  },
}));

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true });
  useUIStore.setState({ toastMessage: null });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

const RULE = {
  id: "rule_1",
  type: "RETIREMENT_CONTRIBUTION" as const,
  retirementAccountId: "ra_1",
  transactionType: "EMPLOYEE_CONTRIBUTION" as const,
  sourceAccountId: "acc_1",
  amount: { amount: "12000.00", currency: "INR" },
  frequency: "MONTHLY" as const,
  dayOfMonth: 30,
  startDate: "2026-09-01",
  endDate: null,
  status: "ACTIVE" as const,
  nextExecutionDate: "2026-09-30",
  lastExecutedDate: null,
  consecutiveFailureCount: 0,
  description: null,
  version: 1,
};

describe("useCreateRecurringContributionRule", () => {
  it("invalidates only the recurring-rule queries, not netWorth/dashboard/goals", async () => {
    vi.mocked(api.createRecurringContributionRule).mockResolvedValue(RULE);
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useCreateRecurringContributionRule(), { wrapper });

    await act(async () => {
      result.current.mutate({
        type: "RETIREMENT_CONTRIBUTION",
        retirementAccountId: "ra_1",
        transactionType: "EMPLOYEE_CONTRIBUTION",
        sourceAccountId: "acc_1",
        amount: "12000.00",
        frequency: "MONTHLY",
        dayOfMonth: 30,
        startDate: "2026-09-01",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey));
    expect(invalidatedKeys.some((k) => k.includes("recurring"))).toBe(true);
    // Creating a rule never touches the account's balance (a future
    // instruction, not a transaction), so these must NOT be invalidated.
    expect(invalidatedKeys.some((k) => k.includes("netWorth"))).toBe(false);
    expect(invalidatedKeys.some((k) => k.includes("dashboard"))).toBe(false);
    expect(invalidatedKeys.some((k) => k.includes("goals"))).toBe(false);
  });

  it("surfaces a business-rule-violation message (e.g. missing source account) via toast", async () => {
    vi.mocked(api.createRecurringContributionRule).mockRejectedValue({
      userMessage: "EMPLOYEE_CONTRIBUTION requires a sourceAccountId",
      statusCode: 422,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateRecurringContributionRule(), { wrapper });

    await act(async () => {
      result.current.mutate({
        type: "RETIREMENT_CONTRIBUTION",
        retirementAccountId: "ra_1",
        transactionType: "EMPLOYEE_CONTRIBUTION",
        amount: "12000.00",
        frequency: "MONTHLY",
        dayOfMonth: 30,
        startDate: "2026-09-01",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useUIStore.getState().toastMessage?.type).toBe("error");
    expect(useUIStore.getState().toastMessage?.text).toBe("EMPLOYEE_CONTRIBUTION requires a sourceAccountId");
  });
});

describe("usePauseRecurringContributionRule / useResumeRecurringContributionRule / useCancelRecurringContributionRule", () => {
  it("pause calls the API with id+version and invalidates the recurring queries only", async () => {
    vi.mocked(api.pauseRecurringContributionRule).mockResolvedValue({ ...RULE, status: "PAUSED" });
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => usePauseRecurringContributionRule(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "rule_1", version: 1, retirementAccountId: "ra_1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.pauseRecurringContributionRule).toHaveBeenCalledWith("rule_1", 1);

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey));
    expect(invalidatedKeys.some((k) => k.includes("recurring"))).toBe(true);
    expect(invalidatedKeys.some((k) => k.includes("netWorth"))).toBe(false);
  });

  it("resume calls the API with id+version", async () => {
    vi.mocked(api.resumeRecurringContributionRule).mockResolvedValue({ ...RULE, status: "ACTIVE" });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useResumeRecurringContributionRule(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "rule_1", version: 2, retirementAccountId: "ra_1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.resumeRecurringContributionRule).toHaveBeenCalledWith("rule_1", 2);
  });

  it("cancel calls the API with id+version", async () => {
    vi.mocked(api.cancelRecurringContributionRule).mockResolvedValue({ ...RULE, status: "CANCELLED" });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCancelRecurringContributionRule(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "rule_1", version: 3, retirementAccountId: "ra_1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.cancelRecurringContributionRule).toHaveBeenCalledWith("rule_1", 3);
  });

  it("surfaces a status-transition error (e.g. cancel on an already-cancelled rule)", async () => {
    vi.mocked(api.cancelRecurringContributionRule).mockRejectedValue({
      userMessage: "Cannot transition a CANCELLED rule to CANCELLED",
      statusCode: 422,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCancelRecurringContributionRule(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "rule_1", version: 3, retirementAccountId: "ra_1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useUIStore.getState().toastMessage?.text).toContain("Cannot transition");
  });
});

describe("useRecurringContributionRules", () => {
  it("is disabled until a retirementAccountId is provided", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRecurringContributionRules(), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getRecurringContributionRules).not.toHaveBeenCalled();
  });

  it("fetches rules scoped to an account", async () => {
    vi.mocked(api.getRecurringContributionRules).mockResolvedValue({ data: [RULE], hasMore: false, totalCount: 1 } as never);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRecurringContributionRules({ retirementAccountId: "ra_1", limit: 20 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([RULE]);
    expect(api.getRecurringContributionRules).toHaveBeenCalledWith({ retirementAccountId: "ra_1", limit: 20 });
  });
});

describe("useRecurringContributionExecutions", () => {
  it("fetches execution history for a rule", async () => {
    const execution = {
      id: "exec_1",
      ruleId: "rule_1",
      occurrenceDate: "2026-08-30",
      status: "SUCCEEDED" as const,
      retirementTransactionId: "tx_1",
      reason: null,
      reversed: false,
      reversedAt: null,
      executedAt: "2026-08-30T02:00:00.000Z",
    };
    vi.mocked(api.getRecurringContributionExecutions).mockResolvedValue({
      data: [execution],
      hasMore: false,
      totalCount: 1,
    } as never);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRecurringContributionExecutions("rule_1", { limit: 25 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([execution]);
  });
});
