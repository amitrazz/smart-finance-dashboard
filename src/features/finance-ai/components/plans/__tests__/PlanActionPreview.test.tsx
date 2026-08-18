import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PlanActionPreview } from "../PlanActionPreview";
import { useUIStore } from "../../../../../store/useUIStore";
import type { FinancePlanAction } from "../../../../../types";

beforeEach(() => {
  // Money is masked by default (privacy mode) — reveal it so amount
  // assertions below check the real formatted figure, not the mask.
  useUIStore.setState({ moneyVisible: true });
});

afterEach(cleanup);

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
    render(
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
    render(
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
    render(<PlanActionPreview action={baseAction} />);
    expect(screen.getByText(/not yet approved/i)).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
  });

  it("renders every plan parameter it was given, never hiding one behind a tooltip", () => {
    render(<PlanActionPreview action={baseAction} />);
    expect(screen.getByText("New Car Fund")).toBeInTheDocument();
    expect(screen.getByText(/500,000|5,00,000/)).toBeInTheDocument();
  });
});
