import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { SalarySlipList } from "../SalarySlipList";
import * as financeQueries from "../../../../hooks/useFinanceQueries";
import { IncomeRecord } from "../../../../types";

vi.mock("../../../../hooks/useFinanceQueries");

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
    payDate: "2026-08-01",
    documentId: "doc-1",
    salaryPeriod: "2026-08-01",
    employerName: "Acme Corp",
    employeeName: "Jane Doe",
    designation: null,
    department: null,
    reconciliationStatus: "UNMATCHED",
    supersedesIncomeRecordId: null,
    components: [],
    deductions: [],
    contributions: [],
    ...overrides,
  };
}

function mockRecords(records: IncomeRecord[]) {
  vi.mocked(financeQueries.useIncomeRecords).mockReturnValue({
    data: records,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
}

describe("SalarySlipList", () => {
  it("shows an empty state when no salary slips exist", () => {
    mockRecords([]);
    render(<SalarySlipList onSelectRecord={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText("No salary slips imported yet.")).toBeInTheDocument();
  });

  it("only shows income records with a salaryPeriod — manual entries are excluded", () => {
    mockRecords([
      buildRecord({ id: "slip-1", salaryPeriod: "2026-08-01", employerName: "Acme Corp" }),
      buildRecord({ id: "manual-1", salaryPeriod: null, employerName: null }),
    ]);
    render(<SalarySlipList onSelectRecord={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: /Acme Corp/ })).toHaveLength(1);
  });

  it("renders gross and net pay for each row, formatted as currency", () => {
    mockRecords([buildRecord()]);
    render(<SalarySlipList onSelectRecord={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getByText("₹3,50,038.00")).toBeInTheDocument();
    expect(screen.getByText("₹2,44,975.00")).toBeInTheDocument();
  });

  it("filters by employer", () => {
    mockRecords([
      buildRecord({ id: "s1", employerName: "Acme Corp", salaryPeriod: "2026-08-01" }),
      buildRecord({ id: "s2", employerName: "Other Co", salaryPeriod: "2026-07-01" }),
    ]);
    render(<SalarySlipList onSelectRecord={vi.fn()} onImport={vi.fn()} />);
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2 rows

    fireEvent.change(screen.getByLabelText("Filter by employer"), { target: { value: "Acme Corp" } });
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 row
  });

  it("filters by reconciliation status", () => {
    mockRecords([
      buildRecord({ id: "s1", reconciliationStatus: "MATCHED" }),
      buildRecord({ id: "s2", reconciliationStatus: "UNMATCHED" }),
    ]);
    render(<SalarySlipList onSelectRecord={vi.fn()} onImport={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Filter by reconciliation status"), {
      target: { value: "MATCHED" },
    });
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("calls onSelectRecord when a row is activated", () => {
    const onSelectRecord = vi.fn();
    mockRecords([buildRecord({ id: "slip-1" })]);
    render(<SalarySlipList onSelectRecord={onSelectRecord} onImport={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Acme Corp/ }));
    expect(onSelectRecord).toHaveBeenCalledWith("slip-1");
  });

  it("calls onImport from the primary CTA", () => {
    const onImport = vi.fn();
    mockRecords([]);
    render(<SalarySlipList onSelectRecord={vi.fn()} onImport={onImport} />);
    fireEvent.click(screen.getByRole("button", { name: /Import Salary Slip/ }));
    expect(onImport).toHaveBeenCalled();
  });
});
