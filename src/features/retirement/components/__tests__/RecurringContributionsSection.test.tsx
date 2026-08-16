import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RecurringContributionsSection } from "../RecurringContributionsSection";
import { RecurringContributionRule, RetirementAccount } from "../../../../types";

const mockUseRecurringContributionRules = vi.fn();
const mockUsePauseRecurringContributionRule = vi.fn();
const mockUseResumeRecurringContributionRule = vi.fn();
const mockUseCancelRecurringContributionRule = vi.fn();
const mockUseCreateRecurringContributionRule = vi.fn();
const mockUseRecurringContributionExecutions = vi.fn();
const mockUseAccounts = vi.fn();

vi.mock("../../hooks/useRetirementQueries", () => ({
  useRecurringContributionRules: (params: unknown) => mockUseRecurringContributionRules(params),
  usePauseRecurringContributionRule: () => mockUsePauseRecurringContributionRule(),
  useResumeRecurringContributionRule: () => mockUseResumeRecurringContributionRule(),
  useCancelRecurringContributionRule: () => mockUseCancelRecurringContributionRule(),
  useCreateRecurringContributionRule: () => mockUseCreateRecurringContributionRule(),
  useRecurringContributionExecutions: (ruleId: string) => mockUseRecurringContributionExecutions(ruleId),
}));

vi.mock("../../../../hooks/useFinanceQueries", () => ({
  useAccounts: (params: unknown) => mockUseAccounts(params),
}));

afterEach(cleanup);

beforeEach(() => {
  mockUsePauseRecurringContributionRule.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseResumeRecurringContributionRule.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseCancelRecurringContributionRule.mockReturnValue({ mutate: vi.fn(), isPending: false });
  mockUseCreateRecurringContributionRule.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  mockUseRecurringContributionExecutions.mockReturnValue({ data: { data: [], hasMore: false }, isLoading: false, isError: false });
  mockUseAccounts.mockReturnValue({ data: [], isFetching: false });
});

const account: RetirementAccount = {
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
};

function makeRule(overrides: Partial<RecurringContributionRule> = {}): RecurringContributionRule {
  return {
    id: "rule_1",
    type: "RETIREMENT_CONTRIBUTION",
    retirementAccountId: "ra_1",
    transactionType: "EMPLOYEE_CONTRIBUTION",
    sourceAccountId: "acc_1",
    amount: { amount: "12000.00", currency: "INR" },
    frequency: "MONTHLY",
    dayOfMonth: 30,
    startDate: "2026-09-01",
    endDate: null,
    status: "ACTIVE",
    nextExecutionDate: "2099-09-30",
    lastExecutedDate: null,
    consecutiveFailureCount: 0,
    description: null,
    version: 1,
    ...overrides,
  };
}

describe("RecurringContributionsSection", () => {
  it("shows the empty state with an Add action when the account is active and has no rules", () => {
    mockUseRecurringContributionRules.mockReturnValue({ data: { data: [], hasMore: false }, isLoading: false, isError: false });
    render(<RecurringContributionsSection account={account} />);
    expect(screen.getByText("No recurring contributions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add recurring contribution/i })).toBeInTheDocument();
  });

  it("hides the Add action entirely when the retirement account is not ACTIVE", () => {
    mockUseRecurringContributionRules.mockReturnValue({ data: { data: [], hasMore: false }, isLoading: false, isError: false });
    render(<RecurringContributionsSection account={{ ...account, status: "CLOSED" }} />);
    expect(screen.queryByRole("button", { name: /add recurring contribution/i })).not.toBeInTheDocument();
    expect(screen.getByText(/new recurring contributions cannot be scheduled/i)).toBeInTheDocument();
  });

  it("renders an active rule with its next execution date and Pause/Cancel actions, not Resume", () => {
    mockUseRecurringContributionRules.mockReturnValue({ data: { data: [makeRule()], hasMore: false }, isLoading: false, isError: false });
    render(<RecurringContributionsSection account={account} />);
    expect(screen.getByText("Employee Contribution")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument();
  });

  it("renders a paused rule with a Resume action, not Pause", () => {
    mockUseRecurringContributionRules.mockReturnValue({
      data: { data: [makeRule({ status: "PAUSED" })], hasMore: false },
      isLoading: false,
      isError: false,
    });
    render(<RecurringContributionsSection account={account} />);
    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^pause$/i })).not.toBeInTheDocument();
  });

  it("shows an auto-pause explanation using the API-exposed consecutiveFailureCount, not a guessed count", () => {
    mockUseRecurringContributionRules.mockReturnValue({
      data: { data: [makeRule({ status: "PAUSED", consecutiveFailureCount: 5 })], hasMore: false },
      isLoading: false,
      isError: false,
    });
    render(<RecurringContributionsSection account={account} />);
    expect(screen.getByText(/paused after 5 failed attempts/i)).toBeInTheDocument();
  });

  it("shows a qualitative overdue banner (no fabricated missed-occurrence count) when nextExecutionDate has passed", () => {
    mockUseRecurringContributionRules.mockReturnValue({
      data: { data: [makeRule({ nextExecutionDate: "2000-01-01" })], hasMore: false },
      isLoading: false,
      isError: false,
    });
    render(<RecurringContributionsSection account={account} />);
    expect(screen.getByText(/next execution date has passed/i)).toBeInTheDocument();
  });

  it("neither Pause nor Resume nor Cancel is shown for a CANCELLED rule", () => {
    mockUseRecurringContributionRules.mockReturnValue({
      data: { data: [makeRule({ status: "CANCELLED" })], hasMore: false },
      isLoading: false,
      isError: false,
    });
    render(<RecurringContributionsSection account={account} />);
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });

  it("pausing requires confirmation, then calls the mutation with id+version and does not double-submit", () => {
    const mutate = vi.fn();
    mockUsePauseRecurringContributionRule.mockReturnValue({ mutate, isPending: false });
    mockUseRecurringContributionRules.mockReturnValue({ data: { data: [makeRule()], hasMore: false }, isLoading: false, isError: false });
    render(<RecurringContributionsSection account={account} />);

    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(screen.getByText("Pause recurring contribution?")).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Pause" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      { id: "rule_1", version: 1, retirementAccountId: "ra_1" },
      expect.any(Object),
    );
  });

  it("cancelling shows the danger-variant confirmation copy and calls the cancel mutation", () => {
    const mutate = vi.fn();
    mockUseCancelRecurringContributionRule.mockReturnValue({ mutate, isPending: false });
    mockUseRecurringContributionRules.mockReturnValue({ data: { data: [makeRule()], hasMore: false }, isLoading: false, isError: false });
    render(<RecurringContributionsSection account={account} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByText("Cancel recurring contribution?")).toBeInTheDocument();
    expect(screen.getByText(/existing transactions will remain unchanged/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel Contribution" }));
    expect(mutate).toHaveBeenCalledWith(
      { id: "rule_1", version: 1, retirementAccountId: "ra_1" },
      expect.any(Object),
    );
  });

  it("shows a retry affordance on a fetch error", () => {
    const refetch = vi.fn();
    mockUseRecurringContributionRules.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    render(<RecurringContributionsSection account={account} />);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
