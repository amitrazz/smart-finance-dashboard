import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlanActionPreview } from "../PlanActionPreview";
import { useUIStore } from "../../../../../store/useUIStore";
import { setAccessToken } from "../../../../../services/api/client";
import type { FinancePlanAction } from "../../../../../types";

vi.mock("../../../../../services/api/endpoints", () => ({
  api: {
    getCategories: vi.fn().mockResolvedValue({ data: [{ id: "cat_dining", name: "Dining Out", kind: "EXPENSE" }] }),
  },
}));

beforeEach(() => {
  // Money is masked by default (privacy mode) — reveal it so amount
  // assertions below check the real formatted figure, not the mask.
  useUIStore.setState({ moneyVisible: true });
  // useCategories (used to resolve CREATE_BUDGET's initialAllocations
  // category ids to names) is gated on a real access token being set.
  setAccessToken("test-token");
});

afterEach(() => {
  cleanup();
  setAccessToken(null);
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const baseAction: FinancePlanAction = {
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
};

describe("PlanActionPreview — a failed action must never read as success (backend team's own negative test)", () => {
  it("renders a FAILED action as Failed, with its error message, never as Completed", () => {
    renderWithProviders(
      <PlanActionPreview
        action={{
          ...baseAction,
          status: "FAILED",
          errorCode: "GOAL_LIMIT_EXCEEDED",
          errorMessage: "You already have 20 active goals.",
        }}
      />,
    );
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("You already have 20 active goals.")).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  it("renders a VERIFIED action as Completed, with the entity it actually touched", () => {
    renderWithProviders(
      <PlanActionPreview
        action={{
          ...baseAction,
          status: "VERIFIED",
          executedEntityType: "GOAL",
          executedEntityId: "goal_123",
          executedAt: "2026-08-18T09:05:00.000Z",
        }}
      />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText(/Applied to your goal/i)).toBeInTheDocument();
  });

  it("renders a still-PROPOSED action as not yet approved, never implying it already ran", () => {
    renderWithProviders(<PlanActionPreview action={baseAction} />);
    expect(screen.getByText(/not yet approved/i)).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
  });

  it("renders every plan parameter it was given, never hiding one behind a tooltip", () => {
    renderWithProviders(<PlanActionPreview action={baseAction} />);
    expect(screen.getByText("New Car Fund")).toBeInTheDocument();
    expect(screen.getByText(/500,000|5,00,000/)).toBeInTheDocument();
  });

  it("renders a CREATE_BUDGET action's initialAllocations as per-category rows, resolving category names", async () => {
    renderWithProviders(
      <PlanActionPreview
        action={{
          ...baseAction,
          type: "CREATE_BUDGET",
          parameters: {
            name: "Organized Budget",
            currency: "INR",
            totalBudget: "20000",
            initialAllocations: [{ categoryId: "cat_dining", allocatedAmount: "6000" }],
          },
        }}
      />,
    );
    expect(await screen.findByText("Dining Out")).toBeInTheDocument();
    expect(screen.getByText(/6,000/)).toBeInTheDocument();
  });
});
