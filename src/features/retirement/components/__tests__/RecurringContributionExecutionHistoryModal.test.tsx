import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RecurringContributionExecutionHistoryModal } from "../RecurringContributionExecutionHistoryModal";
import { RecurringContributionExecution, RecurringContributionRule } from "../../../../types";

const mockUseRecurringContributionExecutions = vi.fn();
const mockUseAccounts = vi.fn();

vi.mock("../../hooks/useRetirementQueries", () => ({
  useRecurringContributionExecutions: (ruleId: string) => mockUseRecurringContributionExecutions(ruleId),
}));

vi.mock("../../../../hooks/useFinanceQueries", () => ({
  useAccounts: () => mockUseAccounts(),
}));

afterEach(cleanup);

beforeEach(() => {
  mockUseAccounts.mockReturnValue({ data: [{ id: "acc_1", name: "ICICI Salary" }], isFetching: false });
});

const rule: RecurringContributionRule = {
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
  nextExecutionDate: "2026-10-30",
  lastExecutedDate: "2026-09-30",
  consecutiveFailureCount: 0,
  description: null,
  version: 1,
};

function makeExecution(overrides: Partial<RecurringContributionExecution> = {}): RecurringContributionExecution {
  return {
    id: "exec_1",
    ruleId: "rule_1",
    occurrenceDate: "2026-09-30",
    status: "SUCCEEDED",
    retirementTransactionId: "tx_1",
    reason: null,
    reversed: false,
    reversedAt: null,
    executedAt: "2026-09-30T02:00:00.000Z",
    ...overrides,
  };
}

function renderModal(r: RecurringContributionRule | null, productType: RetirementProductType = "EPF") {
  return render(
    <RecurringContributionExecutionHistoryModal rule={r} productType={productType} onClose={vi.fn()} />,
  );
}

describe("RecurringContributionExecutionHistoryModal", () => {
  it("renders nothing when no rule is given", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    const { container } = renderModal(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the empty state when there are no executions yet", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    renderModal(rule);
    expect(screen.getByText("No executions yet")).toBeInTheDocument();
  });

  it("shows a human-readable reason for a FAILED execution, never a raw exception name", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({
      data: { data: [makeExecution({ status: "FAILED", reason: "EMPLOYEE_CONTRIBUTION requires a sourceAccountId" })] },
      isLoading: false,
      isError: false,
    });
    renderModal(rule);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("EMPLOYEE_CONTRIBUTION requires a sourceAccountId")).toBeInTheDocument();
    expect(screen.queryByText(/FinanceDomainException/)).not.toBeInTheDocument();
    expect(screen.queryByText(/P2002/)).not.toBeInTheDocument();
  });

  it("shows the skip reason for a SKIPPED execution", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({
      data: { data: [makeExecution({ status: "SKIPPED", reason: "Retirement account is CLOSED" })] },
      isLoading: false,
      isError: false,
    });
    renderModal(rule);
    expect(screen.getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText("Retirement account is CLOSED")).toBeInTheDocument();
  });

  it("marks a succeeded-but-reversed execution as Reversed", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({
      data: { data: [makeExecution({ status: "SUCCEEDED", reversed: true })] },
      isLoading: false,
      isError: false,
    });
    renderModal(rule);
    expect(screen.getByText("Succeeded")).toBeInTheDocument();
    expect(screen.getByText("Reversed")).toBeInTheDocument();
  });

  it("does not show a Reversed tag for a normal succeeded execution", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({
      data: { data: [makeExecution({ status: "SUCCEEDED", reversed: false })] },
      isLoading: false,
      isError: false,
    });
    renderModal(rule);
    expect(screen.queryByText("Reversed")).not.toBeInTheDocument();
  });

  it("renders 'Payroll Deduction' funding description for EPF employee rule execution", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({
      data: { data: [makeExecution()] },
      isLoading: false,
      isError: false,
    });
    renderModal(rule, "EPF");
    expect(screen.getByText(/payroll deduction/i)).toBeInTheDocument();
  });

  it("renders resolved bank account name for direct contribution execution", () => {
    mockUseRecurringContributionExecutions.mockReturnValue({
      data: { data: [makeExecution()] },
      isLoading: false,
      isError: false,
    });
    const ppfRule = { ...rule, transactionType: "CONTRIBUTION" as const };
    renderModal(ppfRule, "PPF");
    expect(screen.getByText(/from: icici salary/i)).toBeInTheDocument();
  });
});
