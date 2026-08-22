import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { DebtCommitmentsPanel } from "../DebtCommitmentsPanel";
import { MonthlyDebtCommitments } from "../../../../../types";

afterEach(() => cleanup());

const money = (amount: string) => ({ amount, currency: "INR" as const });

const DEBT: MonthlyDebtCommitments = {
  principal: money("18000"),
  interest: money("12000"),
  fees: money("0"),
  minimumPayments: money("30500"),
  total: money("30500"),
  principalAllocationKnown: true,
  loanItems: [
    {
      loanId: "loan-1",
      loanName: "Home Loan",
      dueDate: "2026-08-05",
      principal: money("18000"),
      interest: money("12000"),
      total: money("30000"),
      isOverdue: false,
    },
  ],
  cardItems: [
    {
      creditCardId: "card-1",
      cardNickname: "Travel Card",
      dueDate: "2026-08-20",
      minimumDue: money("500"),
      interestCharged: money("0"),
      fees: money("0"),
      isOverdue: false,
    },
  ],
};

describe("DebtCommitmentsPanel", () => {
  it("shows principal and interest as visually distinct figures, never merged", () => {
    render(<DebtCommitmentsPanel debtCommitments={DEBT} onNavigateLoans={() => {}} onNavigateCreditCards={() => {}} />);
    expect(screen.getByText("Debt Principal")).toBeDefined();
    expect(screen.getByText("Debt Interest")).toBeDefined();
    expect(screen.getByText("₹18,000.00")).toBeDefined();
    expect(screen.getByText("₹12,000.00")).toBeDefined();
  });

  it("navigates to Loans when a loan item is clicked", () => {
    const onNavigateLoans = vi.fn();
    render(<DebtCommitmentsPanel debtCommitments={DEBT} onNavigateLoans={onNavigateLoans} onNavigateCreditCards={() => {}} />);
    fireEvent.click(screen.getByText("Home Loan"));
    expect(onNavigateLoans).toHaveBeenCalledTimes(1);
  });

  it("navigates to Credit Cards when a card item is clicked", () => {
    const onNavigateCreditCards = vi.fn();
    render(<DebtCommitmentsPanel debtCommitments={DEBT} onNavigateLoans={() => {}} onNavigateCreditCards={onNavigateCreditCards} />);
    fireEvent.click(screen.getByText("Travel Card"));
    expect(onNavigateCreditCards).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when nothing is due", () => {
    render(
      <DebtCommitmentsPanel
        debtCommitments={{ ...DEBT, loanItems: [], cardItems: [] }}
        onNavigateLoans={() => {}}
        onNavigateCreditCards={() => {}}
      />
    );
    expect(screen.getByText("No Debt Due This Month")).toBeDefined();
  });

  it("annotates Debt Principal when principalAllocationKnown is false, since a card's minimumDue has no principal breakdown", () => {
    render(
      <DebtCommitmentsPanel
        debtCommitments={{ ...DEBT, principalAllocationKnown: false }}
        onNavigateLoans={() => {}}
        onNavigateCreditCards={() => {}}
      />
    );
    expect(screen.getByText(/card portion not broken out/)).toBeDefined();
  });

  it("does not annotate Debt Principal when principalAllocationKnown is true", () => {
    render(<DebtCommitmentsPanel debtCommitments={DEBT} onNavigateLoans={() => {}} onNavigateCreditCards={() => {}} />);
    expect(screen.queryByText(/card portion not broken out/)).toBeNull();
  });

  it("shows an Overdue badge on an overdue loan or card item", () => {
    const overdue: MonthlyDebtCommitments = {
      ...DEBT,
      loanItems: [{ ...DEBT.loanItems[0], isOverdue: true }],
      cardItems: [{ ...DEBT.cardItems[0], isOverdue: true }],
    };
    render(<DebtCommitmentsPanel debtCommitments={overdue} onNavigateLoans={() => {}} onNavigateCreditCards={() => {}} />);
    expect(screen.getAllByText("Overdue").length).toBe(2);
  });
});
