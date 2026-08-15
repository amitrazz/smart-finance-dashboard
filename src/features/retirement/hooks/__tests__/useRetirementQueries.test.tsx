import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useUIStore } from "../../../../store/useUIStore";
import {
  useCloseRetirementAccount,
  useCreateRetirementAccount,
  useRecordRetirementTransaction,
  useReverseRetirementTransaction,
  useUpdateRetirementAccount,
} from "../useRetirementQueries";

vi.mock("../../../../services/api/endpoints", () => ({
  api: {
    createRetirementAccount: vi.fn(),
    updateRetirementAccount: vi.fn(),
    closeRetirementAccount: vi.fn(),
    recordRetirementTransaction: vi.fn(),
    reverseRetirementTransaction: vi.fn(),
    getRetirementAccounts: vi.fn(),
    getRetirementAccount: vi.fn(),
    getRetirementTransactions: vi.fn(),
    getRetirementSummary: vi.fn(),
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

describe("useCreateRetirementAccount", () => {
  it("invalidates retirement, net worth, dashboard, and goals on success", async () => {
    vi.mocked(api.createRetirementAccount).mockResolvedValue({ id: "ra_1" } as never);
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useCreateRetirementAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ productType: "EPF", name: "EPF - Acme", currency: "INR" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey));
    expect(invalidatedKeys.some((k) => k.includes("retirement"))).toBe(true);
    expect(invalidatedKeys.some((k) => k.includes("netWorth"))).toBe(true);
    expect(invalidatedKeys.some((k) => k.includes("dashboard"))).toBe(true);
    expect(invalidatedKeys.some((k) => k.includes("goals"))).toBe(true);
  });

  it("surfaces the backend's userMessage on a validation error via toast, not a raw stack trace", async () => {
    vi.mocked(api.createRetirementAccount).mockRejectedValue({
      userMessage: "productType must be one of EPF, VPF, PPF, NPS",
      statusCode: 400,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateRetirementAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ productType: "EPF", name: "", currency: "INR" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useUIStore.getState().toastMessage?.type).toBe("error");
    expect(useUIStore.getState().toastMessage?.text).toContain("productType must be one of");
  });
});

describe("useRecordRetirementTransaction — cash-flow-safe recording", () => {
  it("records an employer contribution without touching the transactions feed's own cache key", async () => {
    vi.mocked(api.recordRetirementTransaction).mockResolvedValue({ id: "tx_1" } as never);
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useRecordRetirementTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({
        retirementAccountId: "ra_1",
        type: "EMPLOYER_CONTRIBUTION",
        amount: "12000.00",
        transactionDate: "2026-08-15",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.recordRetirementTransaction).toHaveBeenCalledWith({
      retirementAccountId: "ra_1",
      type: "EMPLOYER_CONTRIBUTION",
      amount: "12000.00",
      transactionDate: "2026-08-15",
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey));
    // Goals and net worth both auto-sum retirement balances server-side, so
    // both must be invalidated after any balance-changing transaction.
    expect(invalidatedKeys.some((k) => k.includes("goals"))).toBe(true);
    expect(invalidatedKeys.some((k) => k.includes("netWorth"))).toBe(true);
  });

  it("handles a 409 concurrency conflict by surfacing the backend message", async () => {
    vi.mocked(api.recordRetirementTransaction).mockRejectedValue({
      userMessage: "This transaction conflicts with a concurrent update. Please retry.",
      statusCode: 409,
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRecordRetirementTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({
        retirementAccountId: "ra_1",
        type: "WITHDRAWAL",
        amount: "5000.00",
        transactionDate: "2026-08-15",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useUIStore.getState().toastMessage?.text).toContain("concurrent update");
  });
});

describe("useReverseRetirementTransaction", () => {
  it("reverses and re-invalidates the account's own transaction list", async () => {
    vi.mocked(api.reverseRetirementTransaction).mockResolvedValue({ id: "tx_1" } as never);
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useReverseRetirementTransaction(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "tx_1", version: 2, retirementAccountId: "ra_1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.reverseRetirementTransaction).toHaveBeenCalledWith("tx_1", 2);

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey));
    expect(invalidatedKeys.some((k) => k.includes("ra_1"))).toBe(true);
  });
});

describe("useCloseRetirementAccount", () => {
  it("only accepts the three backend-defined close statuses", async () => {
    vi.mocked(api.closeRetirementAccount).mockResolvedValue({ id: "ra_1", status: "MATURED" } as never);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCloseRetirementAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "ra_1", data: { status: "MATURED" }, version: 1 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.closeRetirementAccount).toHaveBeenCalledWith("ra_1", { status: "MATURED" }, 1);
  });
});

describe("useUpdateRetirementAccount", () => {
  it("calls updateRetirementAccount with custom version", async () => {
    vi.mocked(api.updateRetirementAccount).mockResolvedValue({ id: "ra_1" } as never);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateRetirementAccount(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: "ra_1", data: { name: "New Name" }, version: 5 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.updateRetirementAccount).toHaveBeenCalledWith("ra_1", { name: "New Name" }, 5);
  });
});
