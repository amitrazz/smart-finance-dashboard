import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RetirementAccountDetailDrawer } from "../RetirementAccountDetailDrawer";
import { RetirementAccount } from "../../../../types";

// Mocking hooks
const mockUseRetirementAccount = vi.fn();
const mockUseUpdateRetirementAccount = vi.fn();
const mockUseCloseRetirementAccount = vi.fn();
const mockUseReverseRetirementTransaction = vi.fn();
const mockUseRetirementTransactions = vi.fn();

vi.mock("../../hooks/useRetirementQueries", () => ({
  useRetirementAccount: (id: string) => mockUseRetirementAccount(id),
  useUpdateRetirementAccount: () => mockUseUpdateRetirementAccount(),
  useCloseRetirementAccount: () => mockUseCloseRetirementAccount(),
  useReverseRetirementTransaction: () => mockUseReverseRetirementTransaction(),
  useRetirementTransactions: () => mockUseRetirementTransactions(),
}));

vi.mock("../../../hooks/useFinanceQueries", () => ({
  useAccounts: () => ({ data: [], isFetching: false }),
  useInstitution: () => ({ data: { id: "inst_1", name: "EPFO" } }),
}));

describe("RetirementAccountDetailDrawer", () => {
  const baseAccount: RetirementAccount = {
    id: "ra_123",
    productType: "EPF",
    name: "EPF Account",
    institutionId: "inst_1",
    accountNumber: "12345",
    linkedAccountId: null,
    status: "ACTIVE",
    openedDate: "2020-01-01",
    maturityDate: null,
    interestRate: "8.1",
    employerName: "Acme Corp",
    currentBalance: { amount: "100000", currency: "INR" },
    totalContributions: { amount: "90000", currency: "INR" },
    totalInterestEarned: { amount: "10000", currency: "INR" },
    totalWithdrawals: { amount: "0", currency: "INR" },
    lastValuedAt: "2026-08-15T00:00:00.000Z",
    notes: "My notes",
    version: 1,
  };

  it("fetches the account details, captures the version field from the GET response, and propagates it in the update mutation", async () => {
    // Mock the GET response to return version = 42
    mockUseRetirementAccount.mockReturnValue({
      data: { ...baseAccount, version: 42 },
    });

    const mutateMock = vi.fn();
    mockUseUpdateRetirementAccount.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
    mockUseCloseRetirementAccount.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseReverseRetirementTransaction.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseRetirementTransactions.mockReturnValue({
      data: { data: [], hasMore: false, totalCount: 0 },
      isLoading: false,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RetirementAccountDetailDrawer
          account={baseAccount}
          onClose={vi.fn()}
          onRecordTransaction={vi.fn()}
        />
      </QueryClientProvider>
    );

    // Verify useRetirementAccount was called with the correct id
    expect(mockUseRetirementAccount).toHaveBeenCalledWith("ra_123");

    // Click Edit Details to open the form
    const editBtn = screen.getByRole("button", { name: /edit details/i });
    fireEvent.click(editBtn);

    // Click Save Changes to submit the form
    const saveBtn = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveBtn);

    // Verify update mutation was called with the captured version (42)
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ra_123",
        version: 42,
      }),
      expect.any(Object)
    );
  });
});
