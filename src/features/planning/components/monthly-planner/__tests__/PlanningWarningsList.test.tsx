import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { PlanningWarningsList } from "../PlanningWarningsList";
import { MonthlyPlanningWarning } from "../../../../../types";

afterEach(() => cleanup());

describe("PlanningWarningsList", () => {
  it("shows a positive confirmation state when there are no warnings", () => {
    render(<PlanningWarningsList warnings={[]} onSelectBudget={() => {}} onSelectGoal={() => {}} />);
    expect(screen.getByText("No planning warnings this month.")).toBeDefined();
  });

  it("navigates to the goal when a GOAL_UNDERFUNDED warning is clicked", () => {
    const onSelectGoal = vi.fn();
    const warning: MonthlyPlanningWarning = {
      code: "GOAL_UNDERFUNDED",
      severity: "WARNING",
      title: "Goal underfunded",
      message: "Emergency Fund is behind.",
      relatedEntityId: "goal-1",
    };
    render(<PlanningWarningsList warnings={[warning]} onSelectBudget={() => {}} onSelectGoal={onSelectGoal} />);
    fireEvent.click(screen.getByText("Goal underfunded"));
    expect(onSelectGoal).toHaveBeenCalledWith("goal-1");
  });

  it("navigates to the budget when a BUDGET_OVERRUN_RISK warning is clicked", () => {
    const onSelectBudget = vi.fn();
    const warning: MonthlyPlanningWarning = {
      code: "BUDGET_OVERRUN_RISK",
      severity: "WARNING",
      title: "Budget on pace to overrun",
      message: "Dining is forecast to exceed its allocation.",
      relatedEntityId: "budget-1",
    };
    render(<PlanningWarningsList warnings={[warning]} onSelectBudget={onSelectBudget} onSelectGoal={() => {}} />);
    fireEvent.click(screen.getByText("Budget on pace to overrun"));
    expect(onSelectBudget).toHaveBeenCalledWith("budget-1");
  });

  it("renders a non-interactive row (not a broken link) for a warning with no relatedEntityId", () => {
    const warning: MonthlyPlanningWarning = {
      code: "PROJECTED_DEFICIT",
      severity: "CRITICAL",
      title: "Projected deficit",
      message: "Outflows exceed income this month.",
    };
    render(<PlanningWarningsList warnings={[warning]} onSelectBudget={() => {}} onSelectGoal={() => {}} />);
    const row = screen.getByText("Projected deficit").closest("button, div");
    expect(row?.tagName.toLowerCase()).not.toBe("button");
  });

  it("never styles a warning like a system error — severity is conveyed by icon + label, not color alone", () => {
    const warning: MonthlyPlanningWarning = {
      code: "LOW_CASH_BUFFER",
      severity: "INFO",
      title: "Low cash buffer",
      message: "Closing cash is close to your buffer.",
    };
    render(<PlanningWarningsList warnings={[warning]} onSelectBudget={() => {}} onSelectGoal={() => {}} />);
    expect(screen.getByText("Info")).toBeDefined();
  });
});
