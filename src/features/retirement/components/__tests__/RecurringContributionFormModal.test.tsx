import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecurringContributionFormModal } from "../RecurringContributionFormModal";
import { RetirementAccount } from "../../../../types";

const mockUseCreateRecurringContributionRule = vi.fn();
const mockUseAccounts = vi.fn();

vi.mock("../../hooks/useRetirementQueries", () => ({
  useCreateRecurringContributionRule: () => mockUseCreateRecurringContributionRule(),
}));

vi.mock("../../../../hooks/useFinanceQueries", () => ({
  useAccounts: (params: unknown) => mockUseAccounts(params),
}));

afterEach(cleanup);

beforeEach(() => {
  mockUseCreateRecurringContributionRule.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  mockUseAccounts.mockReturnValue({ data: [{ id: "acc_1", name: "ICICI Salary" }], isFetching: false });
});

function baseAccount(overrides: Partial<RetirementAccount> = {}): RetirementAccount {
  return {
    id: "ra_1",
    productType: "EPF",
    name: "EPF Account",
    institutionId: null,
    accountNumber: null,
    linkedAccountId: null,
    status: "ACTIVE",
    openedDate: null,
    maturityDate: null,
    interestRate: null,
    employerName: null,
    currentBalance: { amount: "0", currency: "INR" },
    totalContributions: { amount: "0", currency: "INR" },
    totalInterestEarned: { amount: "0", currency: "INR" },
    totalWithdrawals: { amount: "0", currency: "INR" },
    lastValuedAt: "2026-08-15T00:00:00.000Z",
    notes: null,
    version: 1,
    ...overrides,
  };
}

function renderModal(account: RetirementAccount) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecurringContributionFormModal account={account} onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("RecurringContributionFormModal — product policy", () => {
  it("EPF: offers both Employee and Employer Contribution, and hides the source-account field for both", () => {
    renderModal(baseAccount({ productType: "EPF" }));

    const typeSelect = screen.getByLabelText(/contribution type/i) as HTMLSelectElement;
    const optionLabels = Array.from(typeSelect.options).map((o) => o.text);
    expect(optionLabels).toEqual(["Employee Contribution", "Employer Contribution"]);

    // Default is Employee Contribution — source account field is hidden.
    expect(screen.queryByLabelText(/source account/i)).not.toBeInTheDocument();
    expect(screen.getByText(/deducted from salary before your net salary is deposited/i)).toBeInTheDocument();

    // Switch to Employer Contribution — no source account field, explanatory copy instead.
    Object.defineProperty(typeSelect, "value", { writable: true, value: "EMPLOYER_CONTRIBUTION" });
    typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(screen.queryByLabelText(/source account/i)).not.toBeInTheDocument();
    expect(screen.getByText(/increase your EPF balance without debiting your personal bank account/i)).toBeInTheDocument();
  });

  it("VPF: never offers Employer Contribution as an option", () => {
    renderModal(baseAccount({ productType: "VPF" }));
    const typeSelect = screen.getByLabelText(/contribution type/i) as HTMLSelectElement;
    const optionLabels = Array.from(typeSelect.options).map((o) => o.text);
    expect(optionLabels).toEqual(["Employee Contribution"]);
    expect(screen.queryByText(/employer contribution/i)).not.toBeInTheDocument();
  });

  it("PPF: only offers Contribution, and requires a source account", () => {
    renderModal(baseAccount({ productType: "PPF" }));
    const typeSelect = screen.getByLabelText(/contribution type/i) as HTMLSelectElement;
    expect(Array.from(typeSelect.options).map((o) => o.text)).toEqual(["Contribution"]);
    expect(screen.getByLabelText(/source account/i)).toBeInTheDocument();
  });

  it("NPS: offers both Contribution and Employer Contribution", () => {
    renderModal(baseAccount({ productType: "NPS" }));
    const typeSelect = screen.getByLabelText(/contribution type/i) as HTMLSelectElement;
    expect(Array.from(typeSelect.options).map((o) => o.text)).toEqual(["Contribution", "Employer Contribution"]);
  });

  it("shows Monthly as a static label, not a selectable dropdown", () => {
    renderModal(baseAccount());
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /frequency/i })).not.toBeInTheDocument();
  });

  it("shows the month-end helper text only once day-of-month is above 28", () => {
    renderModal(baseAccount());
    expect(screen.queryByText(/shorter months/i)).not.toBeInTheDocument();

    const daySelect = screen.getByLabelText(/day of month/i) as HTMLSelectElement;
    Object.defineProperty(daySelect, "value", { writable: true, value: "31" });
    daySelect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(screen.getByText(/shorter months/i)).toBeInTheDocument();
  });

  it("disables submit while the mutation is pending (no double-submit)", () => {
    mockUseCreateRecurringContributionRule.mockReturnValue({ mutate: vi.fn(), isPending: true, isError: false });
    renderModal(baseAccount());
    expect(screen.getByRole("button", { name: /setting up/i })).toBeDisabled();
  });

  it("omits sourceAccountId in mutation payload for EPF Employee Contribution", () => {
    const mutate = vi.fn();
    mockUseCreateRecurringContributionRule.mockReturnValue({ mutate, isPending: false, isError: false });
    renderModal(baseAccount({ productType: "EPF" }));

    // Form should submit successfully with just amount filled
    const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: "12000.00" } });

    const form = screen.getByRole("button", { name: /add recurring contribution/i }).closest("form")!;
    fireEvent.submit(form);

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        retirementAccountId: "ra_1",
        transactionType: "EMPLOYEE_CONTRIBUTION",
        amount: "12000.00",
        sourceAccountId: undefined,
      }),
      expect.any(Object),
    );
  });
});
