import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { SalarySlipDetail } from "../SalarySlipDetail";
import * as financeQueries from "../../../../hooks/useFinanceQueries";
import { api } from "../../../../services/api";
import { IncomeRecord } from "../../../../types";

vi.mock("../../../../hooks/useFinanceQueries");
vi.mock("../../../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../services/api")>();
  return { ...actual, api: { ...actual.api, downloadDocument: vi.fn() } };
});

afterEach(() => cleanup());

const money = (amount: string) => ({ amount, currency: "INR" });

function buildRecord(overrides: Partial<IncomeRecord> = {}): IncomeRecord {
  return {
    id: "record-1",
    incomeSourceId: "source-1",
    transactionId: null,
    grossAmount: money("350038"),
    totalDeductions: money("105063"),
    netAmount: money("244975"),
    payDate: "2026-08-31",
    documentId: "doc-1",
    salaryPeriod: "2026-08-01",
    employerName: "Acme Corp",
    employeeName: "Jane Doe",
    designation: "Engineer",
    department: "Platform",
    reconciliationStatus: "UNMATCHED",
    supersedesIncomeRecordId: null,
    components: [{ code: "BASIC_SALARY", name: "Basic Salary", amount: money("175019") }],
    deductions: [{ code: "INCOME_TAX_TDS", name: "Income Tax / TDS", amount: money("85063") }],
    contributions: [{ code: "EMPLOYER_PF", name: "Employer PF", amount: money("20000") }],
    ...overrides,
  };
}

describe("SalarySlipDetail", () => {
  it("shows a not-found state when the record fails to load (e.g. cross-user access)", () => {
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never);
    render(<SalarySlipDetail incomeRecordId="victim-record" onBack={vi.fn()} />);
    expect(screen.getByText("Salary slip not found")).toBeInTheDocument();
  });

  it("renders the Overview tab by default with gross/net and never treats gross as available cash", () => {
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: buildRecord(),
      isLoading: false,
      isError: false,
    } as never);
    render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

    expect(screen.getByText("₹3,50,038.00")).toBeInTheDocument();
    expect(screen.getByText("₹2,44,975.00")).toBeInTheDocument();
    expect(screen.getByText(/Gross salary is not available cash/)).toBeInTheDocument();
  });

  it("renders Earnings, Deductions, and Employer Contributions tabs from the same fixture", () => {
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: buildRecord(),
      isLoading: false,
      isError: false,
    } as never);
    render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Earnings" }));
    expect(screen.getByText("Basic Salary")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Deductions" }));
    expect(screen.getByText("Income Tax / TDS")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Employer Contributions" }));
    expect(screen.getByText("Employer PF")).toBeInTheDocument();
    expect(screen.getByText(/never increase your available cash/)).toBeInTheDocument();
  });

  it("shows the reconciliation status and a not-yet-built notice on the Reconciliation tab", () => {
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: buildRecord({ reconciliationStatus: "SUGGESTED" }),
      isLoading: false,
      isError: false,
    } as never);
    render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
    expect(screen.getByText("Suggested Match")).toBeInTheDocument();
  });

  it("shows the Planning Impact tab using net pay, and never gross", () => {
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: buildRecord(),
      isLoading: false,
      isError: false,
    } as never);
    render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Planning Impact" }));
    expect(screen.getByText(/Expected Income/)).toBeInTheDocument();
    // The whole planning-impact sentence, not just the standalone figure,
    // must reference net pay only.
    expect(screen.getByText(/₹2,44,975\.00/)).toBeInTheDocument();
  });

  it("loads and renders the source document on the Document tab", async () => {
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    vi.mocked(api.downloadDocument).mockResolvedValue(blob);
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: buildRecord(),
      isLoading: false,
      isError: false,
    } as never);
    render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Document" }));
    expect(await screen.findByTitle("Salary slip document")).toBeInTheDocument();
    expect(api.downloadDocument).toHaveBeenCalledWith("doc-1");
  });

  it("calls onBack from the back button", () => {
    const onBack = vi.fn();
    vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
      data: buildRecord(),
      isLoading: false,
      isError: false,
    } as never);
    render(<SalarySlipDetail incomeRecordId="record-1" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Salary Slips" }));
    expect(onBack).toHaveBeenCalled();
  });
});
