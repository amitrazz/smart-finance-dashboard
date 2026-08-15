import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../services/api/endpoints";
import { setAccessToken } from "../../services/api/client";
import { useNetWorth } from "../useFinanceQueries";

vi.mock("../../services/api/endpoints", () => ({
  api: {
    getNetWorth: vi.fn(),
  },
}));

beforeEach(() => {
  // useFinanceQueries' isAuth() gate reads getAccessToken() (client.ts), not
  // the auth store — a real in-memory token is what enables the query here.
  setAccessToken("test-access-token");
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  setAccessToken(null);
});

// The QueryClient must be constructed once, outside the wrapper component's
// render body — renderHook re-invokes `wrapper` as a real component on every
// re-render, so building `new QueryClient()` inline here would silently swap
// clients mid-test and the query would never settle.
function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useNetWorth — retirement breakdown key", () => {
  it("maps the backend's retirement breakdown line through untouched", async () => {
    vi.mocked(api.getNetWorth).mockResolvedValue({
      snapshotDate: "2026-08-15",
      totalAssets: { amount: "5000000", currency: "INR" },
      totalLiabilities: { amount: "500000", currency: "INR" },
      netWorth: { amount: "4500000", currency: "INR" },
      breakdown: {
        cash: "300000",
        investments: "2000000",
        retirement: "1200000",
        realEstate: "1000000",
        otherAssets: "500000",
        loans: "400000",
        creditCards: "100000",
      },
    } as never);

    const { result } = renderHook(() => useNetWorth(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.breakdown.retirement).toBe("1200000");
    // Never folded into investments — the two are structurally disjoint on
    // the backend (Holding market value vs RetirementAccount balance).
    expect(result.current.data?.breakdown.investments).toBe("2000000");
  });

  it("defaults retirement to '0' when the backend omits it, instead of crashing", async () => {
    vi.mocked(api.getNetWorth).mockResolvedValue({
      snapshotDate: "2026-08-15",
      totalAssets: { amount: "0", currency: "INR" },
      totalLiabilities: { amount: "0", currency: "INR" },
      netWorth: { amount: "0", currency: "INR" },
      breakdown: {
        cash: "0",
        investments: "0",
        realEstate: "0",
        otherAssets: "0",
        loans: "0",
        creditCards: "0",
      },
    } as never);

    const { result } = renderHook(() => useNetWorth(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.breakdown.retirement).toBe("0");
  });
});
