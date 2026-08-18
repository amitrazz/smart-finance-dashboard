import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../../../../services/api/endpoints";
import { useAuthStore } from "../../../../../store/useAuthStore";
import { useUIStore } from "../../../../../store/useUIStore";
import { PlanDetailView } from "../PlanDetailView";
import type { FinancePlan } from "../../../../../types";

vi.mock("../../../../../services/api/endpoints", () => ({
  api: {
    getFinancePlan: vi.fn(),
    getFinancePlanProgress: vi.fn(),
    acceptFinancePlan: vi.fn(),
    declineFinancePlan: vi.fn(),
    cancelFinancePlan: vi.fn(),
    reviseFinancePlan: vi.fn(),
  },
}));

const candidate = (id: string, label: string) => ({
  id,
  label,
  monthsRemaining: 24,
  requiredMonthlyContribution: { amount: "20833.33", currency: "INR" },
  projectedCompletionMonths: 24,
  bufferMonthsAfterImpact: "1.48",
  meetsMinimumBuffer: true,
  feasible: true,
  surplusAfterContribution: { amount: "59166.67", currency: "INR" },
  constraintViolations: [],
  score: 87.5,
});

function makePlan(overrides: Partial<FinancePlan> = {}): FinancePlan {
  return {
    id: "plan_1",
    parentPlanId: null,
    version: 1,
    objective: "SAVE_FOR_GOAL",
    status: "READY_FOR_REVIEW",
    title: "Reach ₹5,00,000 for New Car Fund",
    narrative: {
      objectiveFraming: "Based on your surplus, this is achievable.",
      riskNarrative: "Leaves a comfortable buffer.",
      tradeoffSummaries: [],
    },
    baseline: {
      currency: "INR",
      monthlyIncome: "120000",
      monthlyExpenses: "40000",
      monthlySurplus: "80000",
      savingsRate: "0.6667",
      cashPosition: "80000",
      totalExistingDebt: "0",
      debtToIncomeRatio: "0",
      relevantGoals: [],
      relevantBudgets: [],
      generatedAt: "2026-08-18T09:00:00.000Z",
    },
    assumptions: null,
    constraints: [],
    projections: candidate("balanced", "Balanced"),
    alternatives: [candidate("aggressive", "Aggressive"), candidate("balanced", "Balanced"), candidate("conservative", "Conservative")],
    risks: null,
    basedOnDataAt: "2026-08-18T09:00:00.000Z",
    expiresAt: "2026-08-21T09:00:00.000Z",
    declineReason: null,
    createdAt: "2026-08-18T09:00:00.000Z",
    updatedAt: "2026-08-18T09:00:00.000Z",
    actions: [
      {
        id: "act_1",
        sequence: 0,
        type: "CREATE_GOAL",
        riskLevel: "MUTATING_LOW",
        parameters: { name: "New Car Fund", targetAmount: "500000", currency: "INR" },
        status: "PROPOSED",
        executedEntityType: null,
        executedEntityId: null,
        errorCode: null,
        errorMessage: null,
        executedAt: null,
      },
    ],
    ...overrides,
  };
}

function renderDetail(plan: FinancePlan) {
  vi.mocked(api.getFinancePlan).mockResolvedValue(plan);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PlanDetailView planId={plan.id} onBack={vi.fn()} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true });
  useUIStore.setState({ moneyVisible: true });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  useAuthStore.setState({ isAuthenticated: false });
});

describe("PlanDetailView — the suggestion/pending/confirmed/executed/failed distinction must be visible", () => {
  it("shows Accept/Decline for a plan still awaiting review, and opens a preview before doing anything", async () => {
    renderDetail(makePlan());
    await screen.findByText("Reach ₹5,00,000 for New Car Fund");

    expect(screen.getByRole("button", { name: "Accept plan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    expect(api.acceptFinancePlan).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Accept plan" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Accept this plan/i)).toBeInTheDocument();
    // No mutation before explicit confirmation inside the dialog.
    expect(api.acceptFinancePlan).not.toHaveBeenCalled();
  });

  it("never offers Accept/Decline once a decision has already been made (DECLINED)", async () => {
    renderDetail(makePlan({ status: "DECLINED" }));
    await screen.findByText("Reach ₹5,00,000 for New Car Fund");
    expect(screen.queryByRole("button", { name: "Accept plan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
  });

  it("double-clicking Confirm cannot cause two accept requests — the button disables itself after the first click", async () => {
    let resolveAccept: (plan: FinancePlan) => void = () => {};
    vi.mocked(api.acceptFinancePlan).mockReturnValue(
      new Promise((resolve) => {
        resolveAccept = resolve;
      }),
    );
    renderDetail(makePlan());
    await screen.findByText("Reach ₹5,00,000 for New Car Fund");

    fireEvent.click(screen.getByRole("button", { name: "Accept plan" }));
    const dialog = await screen.findByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", { name: "Accept and apply" });

    fireEvent.click(confirmButton);
    await waitFor(() => expect(confirmButton).toBeDisabled());
    // A disabled native button does not dispatch click handlers — this second
    // click is a no-op, exactly like a real double-tap on a slow network.
    fireEvent.click(confirmButton);

    resolveAccept({ ...makePlan(), status: "ACTIVE" });
    await waitFor(() => expect(api.acceptFinancePlan).toHaveBeenCalledTimes(1));
  });

  it("STALE never offers Accept/Decline/Cancel/Revise — none of the four legal transitions apply, and it says so honestly rather than pointing at a broken action", async () => {
    renderDetail(makePlan({ status: "STALE" }));
    await screen.findByText("Reach ₹5,00,000 for New Car Fund");

    expect(screen.queryByRole("button", { name: "Accept plan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Decline" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel plan" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ask for changes" })).not.toBeInTheDocument();
  });

  it("a FAILED action inside the plan renders as Failed, never as if it succeeded", async () => {
    vi.mocked(api.getFinancePlanProgress).mockResolvedValue({
      status: "EXECUTION_PARTIAL",
      targetAmount: null,
      currentAmount: null,
      progressPercent: null,
      expectedProgressPercent: null,
      variancePercent: null,
      onTrack: null,
    });
    renderDetail(
      makePlan({
        status: "EXECUTION_PARTIAL",
        actions: [
          {
            id: "act_1",
            sequence: 0,
            type: "CREATE_GOAL",
            riskLevel: "MUTATING_LOW",
            parameters: { name: "New Car Fund", targetAmount: "500000", currency: "INR" },
            status: "FAILED",
            executedEntityType: null,
            executedEntityId: null,
            errorCode: "GOAL_LIMIT_EXCEEDED",
            errorMessage: "You already have 20 active goals.",
            executedAt: null,
          },
        ],
      }),
    );
    await screen.findByText("Reach ₹5,00,000 for New Car Fund");
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("You already have 20 active goals.")).toBeInTheDocument();
  });
});
