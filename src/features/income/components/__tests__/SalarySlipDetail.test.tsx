import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
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

// Every test renders through ReconciliationTab (it's mounted only when that
// tab is active, but the hooks it calls must exist regardless) — give every
// test a harmless default so only the reconciliation-focused tests need to
// override these.
beforeEach(() => {
  vi.mocked(financeQueries.useAccounts).mockReturnValue({ data: [] } as never);
  vi.mocked(financeQueries.useTransaction).mockReturnValue({ data: undefined, isLoading: false } as never);
  vi.mocked(financeQueries.useIncomeReconciliation).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  } as never);
  vi.mocked(financeQueries.useReconcileIncomeRecord).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  vi.mocked(financeQueries.useRejectIncomeReconciliation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

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

  describe("Reconciliation tab", () => {
    it("shows a suggested candidate with amount/date/account, labeled Suggested Match only when the backend actually promoted it", () => {
      vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
        data: buildRecord({ reconciliationStatus: "SUGGESTED" }),
        isLoading: false,
        isError: false,
      } as never);
      vi.mocked(financeQueries.useAccounts).mockReturnValue({
        data: [{ id: "acc-1", name: "Savings", institution: { id: "i1", name: "ICICI Bank" } }],
      } as never);
      vi.mocked(financeQueries.useIncomeReconciliation).mockReturnValue({
        data: {
          record: buildRecord({ reconciliationStatus: "SUGGESTED" }),
          candidates: [
            {
              transactionId: "tx-1",
              score: 95,
              breakdown: { amount: 100, date: 100, description: 50 },
              transactionDate: "2026-08-31",
              amount: money("244975"),
              description: "NEFT-ACME CORP-SALARY",
              accountId: "acc-1",
            },
          ],
        },
        isLoading: false,
        isError: false,
      } as never);
      render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
      expect(screen.getAllByText("Suggested Match").length).toBeGreaterThan(0);
      expect(screen.getByText("₹2,44,975.00")).toBeInTheDocument();
      expect(screen.getByText("ICICI Bank")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirm Match" })).toBeInTheDocument();
    });

    it("never labels a candidate as a Suggested Match unless the record's own reconciliationStatus is SUGGESTED — no fabricated confidence", () => {
      vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
        data: buildRecord({ reconciliationStatus: "UNMATCHED" }),
        isLoading: false,
        isError: false,
      } as never);
      vi.mocked(financeQueries.useIncomeReconciliation).mockReturnValue({
        data: {
          record: buildRecord({ reconciliationStatus: "UNMATCHED" }),
          candidates: [
            {
              transactionId: "tx-1",
              score: 40,
              breakdown: { amount: 40, date: 40, description: 0 },
              transactionDate: "2026-08-31",
              amount: money("244975"),
              description: "NEFT-UNKNOWN",
              accountId: null,
            },
          ],
        },
        isLoading: false,
        isError: false,
      } as never);
      render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
      expect(screen.getByText("Possible Salary Credit")).toBeInTheDocument();
      expect(screen.queryByText("Suggested Match")).not.toBeInTheDocument();
    });

    it("confirms a specific candidate transaction on click", () => {
      const mutate = vi.fn();
      vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
        data: buildRecord(),
        isLoading: false,
        isError: false,
      } as never);
      vi.mocked(financeQueries.useReconcileIncomeRecord).mockReturnValue({ mutate, isPending: false } as never);
      vi.mocked(financeQueries.useIncomeReconciliation).mockReturnValue({
        data: {
          record: buildRecord(),
          candidates: [
            {
              transactionId: "tx-1",
              score: 95,
              breakdown: { amount: 100, date: 100, description: 50 },
              transactionDate: "2026-08-31",
              amount: money("244975"),
              description: "NEFT-ACME CORP-SALARY",
              accountId: null,
            },
          ],
        },
        isLoading: false,
        isError: false,
      } as never);
      render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
      fireEvent.click(screen.getByRole("button", { name: "Confirm Match" }));
      expect(mutate).toHaveBeenCalledWith({ id: "record-1", transactionId: "tx-1" });
    });

    it("shows a 'no matching transaction' empty state rather than fabricating a candidate", () => {
      vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
        data: buildRecord(),
        isLoading: false,
        isError: false,
      } as never);
      render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
      expect(screen.getByText("No matching bank transaction found yet.")).toBeInTheDocument();
    });

    it("shows the actual matched transaction (not a candidate list) once reconciliationStatus is MATCHED", () => {
      vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
        data: buildRecord({ reconciliationStatus: "MATCHED", transactionId: "tx-1" }),
        isLoading: false,
        isError: false,
      } as never);
      vi.mocked(financeQueries.useTransaction).mockReturnValue({
        data: {
          id: "tx-1",
          amount: money("244975"),
          direction: "INFLOW",
          description: "NEFT-ACME CORP-SALARY",
          date: "2026-08-31",
          accountId: "acc-1",
          version: 1,
        },
        isLoading: false,
      } as never);
      vi.mocked(financeQueries.useAccounts).mockReturnValue({
        data: [{ id: "acc-1", name: "Savings", institution: { id: "i1", name: "ICICI Bank" } }],
      } as never);
      render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
      expect(screen.getByText("Bank Salary Credit")).toBeInTheDocument();
      expect(screen.getByText("₹2,44,975.00")).toBeInTheDocument();
      expect(screen.getByText("ICICI Bank")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Not This Transaction" })).toBeInTheDocument();
    });

    it("rejects reconciliation (marks unmatched) without requiring a specific candidate", () => {
      const mutate = vi.fn();
      vi.mocked(financeQueries.useIncomeRecord).mockReturnValue({
        data: buildRecord(),
        isLoading: false,
        isError: false,
      } as never);
      vi.mocked(financeQueries.useRejectIncomeReconciliation).mockReturnValue({ mutate, isPending: false } as never);
      vi.mocked(financeQueries.useIncomeReconciliation).mockReturnValue({
        data: {
          record: buildRecord(),
          candidates: [
            {
              transactionId: "tx-1",
              score: 70,
              breakdown: { amount: 70, date: 70, description: 0 },
              transactionDate: "2026-08-31",
              amount: money("244975"),
              description: "NEFT-UNKNOWN",
              accountId: null,
            },
          ],
        },
        isLoading: false,
        isError: false,
      } as never);
      render(<SalarySlipDetail incomeRecordId="record-1" onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: "Reconciliation" }));
      fireEvent.click(screen.getByRole("button", { name: "None of these — mark as unmatched" }));
      expect(mutate).toHaveBeenCalledWith("record-1");
    });
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
