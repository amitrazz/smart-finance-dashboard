import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../services/api/endpoints";
import { setAccessToken } from "../../services/api/client";
import { useCashFlow, useExpenseTrendAnalytics, useIncomeTrend } from "../useFinanceQueries";

vi.mock("../../services/api/endpoints", () => ({
  api: {
    getCashFlow: vi.fn(),
    getExpenseTrendAnalytics: vi.fn(),
    getIncomeTrend: vi.fn(),
  },
}));

beforeEach(() => {
  setAccessToken("test-access-token");
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  setAccessToken(null);
});

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCashFlow — API/FE contract", () => {
  it("maps netCashFlow onto netSavings and passes isCurrentPeriod/incomeStillExpected through untouched", async () => {
    vi.mocked(api.getCashFlow).mockResolvedValue({
      data: [
        {
          periodStart: "2026-08-01",
          periodEnd: "2026-08-31",
          totalIncome: { amount: "102778", currency: "INR" },
          totalExpense: { amount: "246737.56", currency: "INR" },
          netCashFlow: { amount: "-143959.56", currency: "INR" },
          savingsRate: "-1.4007",
          categoryBreakdown: [],
          isCurrentPeriod: true,
          incomeStillExpected: true,
        },
      ],
      totalCount: 1,
      limit: 20,
      hasMore: false,
    } as never);

    const { result } = renderHook(() => useCashFlow(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const snapshot = result.current.data?.[0];
    // The real API field is netCashFlow — this is the value that must
    // actually reach the UI, however the FE's own internal field is named.
    expect(snapshot?.netSavings).toEqual({ amount: "-143959.56", currency: "INR" });
    expect(snapshot?.isCurrentPeriod).toBe(true);
    expect(snapshot?.incomeStillExpected).toBe(true);
  });

  it("passes expectedIncome/projectedIncome/expectedIncomeItems through untouched on a current-period row", async () => {
    vi.mocked(api.getCashFlow).mockResolvedValue({
      data: [
        {
          periodStart: "2026-08-01",
          periodEnd: "2026-08-31",
          totalIncome: { amount: "1570", currency: "INR" },
          totalExpense: { amount: "246737.56", currency: "INR" },
          netCashFlow: { amount: "-245167.56", currency: "INR" },
          savingsRate: "-156.1577",
          categoryBreakdown: [],
          isCurrentPeriod: true,
          incomeStillExpected: true,
          expectedIncome: { amount: "243524.6667", currency: "INR" },
          projectedIncome: { amount: "245094.6667", currency: "INR" },
          expectedIncomeItems: [
            {
              categoryId: "cat-salary",
              categoryName: "Salary",
              amount: { amount: "243524.6667", currency: "INR" },
              expectedDateStart: "2026-08-24",
              expectedDateEnd: "2026-08-31",
              confidence: 1,
            },
          ],
        },
      ],
      totalCount: 1,
      limit: 20,
      hasMore: false,
    } as never);

    const { result } = renderHook(() => useCashFlow(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const snapshot = result.current.data?.[0];
    expect(snapshot?.expectedIncome).toEqual({ amount: "243524.6667", currency: "INR" });
    expect(snapshot?.projectedIncome).toEqual({ amount: "245094.6667", currency: "INR" });
    expect(snapshot?.expectedIncomeItems).toEqual([
      {
        categoryId: "cat-salary",
        categoryName: "Salary",
        amount: { amount: "243524.6667", currency: "INR" },
        expectedDateStart: "2026-08-24",
        expectedDateEnd: "2026-08-31",
        confidence: 1,
      },
    ]);
  });

  it("omits expectedIncome/projectedIncome/expectedIncomeItems for a completed period", async () => {
    vi.mocked(api.getCashFlow).mockResolvedValue({
      data: [
        {
          periodStart: "2026-07-01",
          periodEnd: "2026-07-31",
          totalIncome: { amount: "293217", currency: "INR" },
          totalExpense: { amount: "725041.89", currency: "INR" },
          netCashFlow: { amount: "-431824.89", currency: "INR" },
          savingsRate: "-1.4727",
          categoryBreakdown: [],
          isCurrentPeriod: false,
        },
      ],
      totalCount: 1,
      limit: 20,
      hasMore: false,
    } as never);

    const { result } = renderHook(() => useCashFlow(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const snapshot = result.current.data?.[0];
    expect(snapshot?.expectedIncome).toBeUndefined();
    expect(snapshot?.projectedIncome).toBeUndefined();
    expect(snapshot?.expectedIncomeItems).toBeUndefined();
  });

  it("omits incomeStillExpected for a completed period, rather than defaulting it to false", async () => {
    vi.mocked(api.getCashFlow).mockResolvedValue({
      data: [
        {
          periodStart: "2026-07-01",
          periodEnd: "2026-07-31",
          totalIncome: { amount: "808866.2", currency: "INR" },
          totalExpense: { amount: "725041.89", currency: "INR" },
          netCashFlow: { amount: "83824.31", currency: "INR" },
          savingsRate: "0.1036",
          categoryBreakdown: [],
          isCurrentPeriod: false,
        },
      ],
      totalCount: 1,
      limit: 20,
      hasMore: false,
    } as never);

    const { result } = renderHook(() => useCashFlow(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const snapshot = result.current.data?.[0];
    expect(snapshot?.isCurrentPeriod).toBe(false);
    expect(snapshot?.incomeStillExpected).toBeUndefined();
  });
});

describe("trend hooks — periodStart/amount contract", () => {
  it("useExpenseTrendAnalytics exposes periodStart and a plain-string amount, not month/Money", async () => {
    vi.mocked(api.getExpenseTrendAnalytics).mockResolvedValue({
      data: [{ periodStart: "2026-07-01", amount: "725041.89", isCurrentPeriod: false }],
      totalCount: 1,
      limit: 20,
      hasMore: false,
    } as never);

    const { result } = renderHook(() => useExpenseTrendAnalytics(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toEqual({
      periodStart: "2026-07-01",
      amount: "725041.89",
      isCurrentPeriod: false,
    });
  });

  it("useIncomeTrend exposes periodStart and a plain-string amount", async () => {
    vi.mocked(api.getIncomeTrend).mockResolvedValue({
      data: [{ periodStart: "2026-08-01", amount: "102778", isCurrentPeriod: true }],
      totalCount: 1,
      limit: 20,
      hasMore: false,
    } as never);

    const { result } = renderHook(() => useIncomeTrend(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toEqual({
      periodStart: "2026-08-01",
      amount: "102778",
      isCurrentPeriod: true,
    });
  });
});
