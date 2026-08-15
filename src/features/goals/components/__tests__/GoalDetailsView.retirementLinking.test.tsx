import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Goal } from "../../../../types";
import { GoalDetailsView } from "../GoalDetailsView";

const mockUpdateGoalMutate = vi.fn();

const baseGoal: Goal = {
  id: "goal_1",
  name: "Retire Comfortably",
  type: "RETIREMENT",
  priority: "HIGH",
  linkedAccountIds: [],
  linkedInvestmentIds: [],
  linkedRetirementAccountIds: [],
  targetAmount: { amount: "10000000", currency: "INR" },
  progressPercent: 12,
  currency: "INR",
  targetDate: "2045-01-01",
  expectedReturnRate: 8,
  inflationRate: 6,
  riskProfile: "MODERATE",
  status: "ACTIVE",
  autoContributionEnabled: false,
  version: 3,
};

let currentGoal = baseGoal;

vi.mock("../../hooks/useGoalQueries", () => ({
  useGoal: () => ({ data: currentGoal, isLoading: false, isError: false, error: undefined }),
  useGoalContributions: () => ({ data: [] }),
  useGoalMilestones: () => ({ data: [] }),
  useGoalForecast: () => ({ data: undefined }),
  useGoalAnalytics: () => ({ data: undefined, isLoading: false, isError: false }),
  useGoalDocuments: () => ({ data: [], isLoading: false, isError: false }),
  useDeleteGoalDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useRecordGoalContribution: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGoalContribution: () => ({ mutate: vi.fn(), isPending: false }),
  useAddGoalMilestone: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGoalMilestone: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateGoal: () => ({ mutate: mockUpdateGoalMutate, isPending: false }),
  useDeleteGoal: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../../hooks/useFinanceQueries", () => ({
  useAccounts: () => ({ data: [] }),
}));

const retirementAccount = {
  id: "ra_1",
  productType: "EPF" as const,
  name: "EPF - Acme Corp",
  institutionId: null,
  accountNumber: null,
  linkedAccountId: null,
  status: "ACTIVE" as const,
  openedDate: null,
  maturityDate: null,
  interestRate: null,
  employerName: "Acme Corp",
  currentBalance: { amount: "1000000", currency: "INR" },
  totalContributions: { amount: "800000", currency: "INR" },
  totalInterestEarned: { amount: "200000", currency: "INR" },
  totalWithdrawals: { amount: "0", currency: "INR" },
  lastValuedAt: "2026-08-01T00:00:00.000Z",
  notes: null,
};

vi.mock("../../../retirement/hooks/useRetirementQueries", () => ({
  useRetirementAccounts: () => ({ data: { data: [retirementAccount], hasMore: false, totalCount: 1 } }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  currentGoal = baseGoal;
});

describe("GoalDetailsView — retirement account linking", () => {
  it("shows the Retirement Assets empty state when nothing is linked yet", () => {
    render(<GoalDetailsView goalId="goal_1" onBack={vi.fn()} />);
    expect(screen.getByText(/Retirement Assets/i)).toBeInTheDocument();
    expect(screen.getByText(/No EPF, VPF, PPF, or NPS account linked/i)).toBeInTheDocument();
  });

  it("links a retirement account by PATCHing the goal's linkedRetirementAccountIds array, not a separate endpoint", async () => {
    render(<GoalDetailsView goalId="goal_1" onBack={vi.fn()} />);

    const linkButtons = screen.getAllByText("+ Link Account");
    fireEvent.click(linkButtons[0]);

    const dialog = await screen.findByText("Link Retirement Account");
    const dialogContainer = dialog.closest("div")!.parentElement!;

    const combobox = within(dialogContainer).getByRole("combobox");
    fireEvent.click(combobox);
    const option = await within(dialogContainer).findByRole("option", { name: /EPF - Acme Corp/i });
    fireEvent.click(within(option).getByRole("button"));

    const submitButton = within(dialogContainer).getByRole("button", { name: "Link Account" });
    fireEvent.click(submitButton);

    expect(mockUpdateGoalMutate).toHaveBeenCalledWith(
      {
        id: "goal_1",
        data: { linkedRetirementAccountIds: ["ra_1"] },
        version: 3,
      },
      expect.any(Object),
    );
  });

  it("renders linked retirement account balance in the corpus tab and unlinks it via the array, preserving other linked ids", () => {
    currentGoal = { ...baseGoal, linkedRetirementAccountIds: ["ra_1", "ra_2"] };
    render(<GoalDetailsView goalId="goal_1" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /corpus/i }));

    expect(screen.getByText(/EPF - Acme Corp \(EPF\)/)).toBeInTheDocument();

    const unlinkButtons = screen.getAllByLabelText("Unlink Retirement Account");
    fireEvent.click(unlinkButtons[0]);

    expect(mockUpdateGoalMutate).toHaveBeenCalledWith({
      id: "goal_1",
      data: { linkedRetirementAccountIds: ["ra_2"] },
      version: 3,
    });
  });
});
