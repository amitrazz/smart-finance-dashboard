import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../services/api/endpoints";
import { useSpendingAnalytics } from "../useInsightsQueries";
import { useInsightsFilters } from "../useInsightsFilters";

vi.mock("../../../../services/api/endpoints", () => ({
  api: {
    getExpensesByCategory: vi.fn(),
    getExpensesByMerchant: vi.fn(),
    getTransactions: vi.fn(),
    getSmartActions: vi.fn(),
    getCategoryTrends: vi.fn(),
    getMerchantTrends: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useInsightsFilters.getState().reset();
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
}

describe("useSpendingAnalytics — trend endpoints are optional enrichment", () => {
  it("still resolves the category/merchant breakdown when both trend endpoints reject", async () => {
    vi.mocked(api.getExpensesByCategory).mockResolvedValue([
      { categoryId: "c1", categoryName: "Rent", amount: { amount: "40000", currency: "INR" }, percentage: 40 },
    ] as never);
    vi.mocked(api.getExpensesByMerchant).mockResolvedValue([] as never);
    vi.mocked(api.getTransactions).mockResolvedValue([] as never);
    vi.mocked(api.getSmartActions).mockResolvedValue([] as never);
    vi.mocked(api.getCategoryTrends).mockRejectedValue(new Error("backend down"));
    vi.mocked(api.getMerchantTrends).mockRejectedValue(new Error("backend down"));

    const { result } = renderHook(() => useSpendingAnalytics(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // A failed enrichment source degrades to a partial section, never an error.
    expect(result.current.isError).toBe(false);
    expect(result.current.isPartial).toBe(true);
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.categories[0].categoryName).toBe("Rent");
    expect(result.current.data!.trending).toBeNull();
  });

  it("requests the trend endpoints with the window the global period selector maps to", async () => {
    vi.mocked(api.getExpensesByCategory).mockResolvedValue([] as never);
    vi.mocked(api.getExpensesByMerchant).mockResolvedValue([] as never);
    vi.mocked(api.getTransactions).mockResolvedValue([] as never);
    vi.mocked(api.getSmartActions).mockResolvedValue([] as never);
    vi.mocked(api.getCategoryTrends).mockResolvedValue([] as never);
    vi.mocked(api.getMerchantTrends).mockResolvedValue([] as never);

    useInsightsFilters.getState().setPeriod("6M");

    renderHook(() => useSpendingAnalytics(), { wrapper: makeWrapper() });

    await waitFor(() => expect(api.getCategoryTrends).toHaveBeenCalledWith({ window: "6m" }));
    expect(api.getMerchantTrends).toHaveBeenCalledWith({ window: "6m" });
  });
});
