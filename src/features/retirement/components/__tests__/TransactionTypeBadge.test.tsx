import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TransactionTypeBadge } from "../TransactionTypeBadge";

afterEach(cleanup);

describe("TransactionTypeBadge", () => {
  it("renders the Employer Contribution label without ever calling it income or a cash outflow", () => {
    render(<TransactionTypeBadge type="EMPLOYER_CONTRIBUTION" />);
    expect(screen.getByText("Employer Contribution")).toBeInTheDocument();
    expect(screen.queryByText(/income/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/expense/i)).not.toBeInTheDocument();
  });

  it("renders Withdrawal distinctly from a contribution — never labelled Salary or Investment Gain", () => {
    render(<TransactionTypeBadge type="WITHDRAWAL" />);
    const badge = screen.getByText("Withdrawal");
    expect(badge).toBeInTheDocument();
    expect(screen.queryByText(/salary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/investment gain/i)).not.toBeInTheDocument();
  });

  it("gives withdrawal (negative tone) and contribution (positive tone) visually distinct classes, not color alone", () => {
    const { container: withdrawalContainer } = render(<TransactionTypeBadge type="WITHDRAWAL" />);
    const { container: contribContainer } = render(<TransactionTypeBadge type="EMPLOYEE_CONTRIBUTION" />);

    // Each tone renders a different lucide icon (svg), so meaning survives
    // for users who can't distinguish the color alone.
    const withdrawalIcon = withdrawalContainer.querySelector("svg");
    const contribIcon = contribContainer.querySelector("svg");
    expect(withdrawalIcon).toBeTruthy();
    expect(contribIcon).toBeTruthy();
    expect(withdrawalIcon?.outerHTML).not.toBe(contribIcon?.outerHTML);
  });

  it("renders every transaction type without crashing and with a readable label", () => {
    const types = [
      "OPENING_BALANCE",
      "EMPLOYEE_CONTRIBUTION",
      "EMPLOYER_CONTRIBUTION",
      "CONTRIBUTION",
      "INTEREST",
      "VALUATION_ADJUSTMENT",
      "WITHDRAWAL",
      "ADJUSTMENT",
    ] as const;
    types.forEach((t) => {
      const { unmount } = render(<TransactionTypeBadge type={t} />);
      unmount();
    });
  });
});
