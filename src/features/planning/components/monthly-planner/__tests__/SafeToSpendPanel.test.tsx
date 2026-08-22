import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { SafeToSpendPanel } from "../SafeToSpendPanel";
import { MonthlySafeToSpend } from "../../../../../types";

afterEach(() => cleanup());

const SAFE_TO_SPEND: MonthlySafeToSpend = {
  expectedIncome: { amount: "100000", currency: "INR" },
  mandatoryCommitments: { amount: "20000", currency: "INR" },
  debtPayments: { amount: "5500", currency: "INR" },
  plannedSavings: { amount: "10000", currency: "INR" },
  plannedInvestments: { amount: "5000", currency: "INR" },
  minimumCashBuffer: { amount: "0", currency: "INR" },
  safeToSpend: { amount: "59500", currency: "INR" },
};

describe("SafeToSpendPanel", () => {
  it("renders the headline safe-to-spend figure directly from the backend value", () => {
    render(<SafeToSpendPanel safeToSpend={SAFE_TO_SPEND} minimumCashBuffer="0" onBufferChange={() => {}} />);
    expect(screen.getByText("₹59,500.00")).toBeDefined();
  });

  it("shows the full breakdown only after expanding, and never before", () => {
    render(<SafeToSpendPanel safeToSpend={SAFE_TO_SPEND} minimumCashBuffer="0" onBufferChange={() => {}} />);
    expect(screen.queryByText("Mandatory Commitments")).toBeNull();

    fireEvent.click(screen.getByText("Show calculation"));
    expect(screen.getByText("Mandatory Commitments")).toBeDefined();
    expect(screen.getByText("Debt Payments")).toBeDefined();
    expect(screen.getByText("Planned Savings")).toBeDefined();
    expect(screen.getByText("Planned Investments")).toBeDefined();
    // "Minimum Cash Buffer" legitimately labels both the input control and
    // the breakdown row — assert there are two, not that there's exactly one.
    expect(screen.getAllByText("Minimum Cash Buffer").length).toBe(2);
  });

  it("renders the headline in rose/negative styling when safe-to-spend is negative", () => {
    const negative: MonthlySafeToSpend = { ...SAFE_TO_SPEND, safeToSpend: { amount: "-500", currency: "INR" } };
    render(<SafeToSpendPanel safeToSpend={negative} minimumCashBuffer="0" onBufferChange={() => {}} />);
    const headline = screen.getByText("-₹500.00");
    expect(headline.className).toContain("text-rose-400");
  });

  it("calls onBufferChange as the user edits the cash buffer input", () => {
    const onBufferChange = vi.fn();
    render(<SafeToSpendPanel safeToSpend={SAFE_TO_SPEND} minimumCashBuffer="0" onBufferChange={onBufferChange} />);
    fireEvent.change(screen.getByLabelText("Minimum cash buffer"), { target: { value: "5000" } });
    expect(onBufferChange).toHaveBeenCalledWith("5000");
  });
});
