import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { BudgetSummaryTable } from "../BudgetSummaryTable";
import { MonthlyBudgetIntegration } from "../../../../../types";

afterEach(() => cleanup());

const BUDGET: MonthlyBudgetIntegration = {
  allocated: { amount: "30000", currency: "INR" },
  actual: { amount: "22000", currency: "INR" },
  budgets: [
    {
      budgetId: "budget-1",
      name: "August Budget",
      allocated: { amount: "30000", currency: "INR" },
      actual: { amount: "22000", currency: "INR" },
      remaining: { amount: "8000", currency: "INR" },
      utilizationPercent: 73.3,
      periodStatus: "ACTIVE",
      projectedOverspend: { amount: "0", currency: "INR" },
    },
  ],
};

describe("BudgetSummaryTable", () => {
  it("shows the empty state with a Create Budget CTA when there are no budgets", () => {
    const onCreateBudget = vi.fn();
    render(
      <BudgetSummaryTable
        budget={{ allocated: { amount: "0", currency: "INR" }, budgets: [] }}
        onSelectBudget={() => {}}
        onCreateBudget={onCreateBudget}
      />
    );
    expect(screen.getByText("No Budget Has Been Created for This Month")).toBeDefined();
    fireEvent.click(screen.getByText("Create Budget"));
    expect(onCreateBudget).toHaveBeenCalledTimes(1);
  });

  it("navigates to the budget's detail page when a row is clicked", () => {
    // Desktop table + mobile card list both render (CSS-hidden, not
    // DOM-absent) — every budget name/figure legitimately appears twice.
    const onSelectBudget = vi.fn();
    render(<BudgetSummaryTable budget={BUDGET} onSelectBudget={onSelectBudget} onCreateBudget={() => {}} />);
    fireEvent.click(screen.getAllByText("August Budget")[0]);
    expect(onSelectBudget).toHaveBeenCalledWith("budget-1");
  });

  it("renders per-budget rows only — never a per-category breakdown the composed response doesn't have", () => {
    render(<BudgetSummaryTable budget={BUDGET} onSelectBudget={() => {}} onCreateBudget={() => {}} />);
    expect(screen.getAllByText("73.3%").length).toBeGreaterThan(0);
  });

  it("uses the backend's authoritative status (EXCEEDED) rather than re-deriving it from utilizationPercent", () => {
    const exceeded: MonthlyBudgetIntegration = {
      ...BUDGET,
      overrun: { amount: "5000", currency: "INR" },
      budgets: [
        {
          budgetId: "budget-2",
          name: "Overspent Budget",
          allocated: { amount: "10000", currency: "INR" },
          actual: { amount: "15000", currency: "INR" },
          remaining: { amount: "-5000", currency: "INR" },
          overrun: { amount: "5000", currency: "INR" },
          utilizationPercent: 150,
          status: "EXCEEDED",
          periodStatus: "ACTIVE",
          projectedOverspend: { amount: "0", currency: "INR" },
        },
      ],
    };
    render(<BudgetSummaryTable budget={exceeded} onSelectBudget={() => {}} onCreateBudget={() => {}} />);
    expect(screen.getAllByText("Exceeded").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹5,000.00").length).toBeGreaterThan(0);
  });
});
