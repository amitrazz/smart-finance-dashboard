import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SalarySlipReviewPanel } from "../SalarySlipReviewPanel";
import * as financeQueries from "../../../../hooks/useFinanceQueries";
import { api } from "../../../../services/api";
import { ImportRowStaging, NormalizedSalarySlipRowData } from "../../../../types";

vi.mock("../../../../hooks/useFinanceQueries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../hooks/useFinanceQueries")>();
  return { ...actual };
});
vi.mock("../../../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../services/api")>();
  return { ...actual, api: { ...actual.api, downloadDocument: vi.fn(), getImportPreview: vi.fn() } };
});

afterEach(() => cleanup());

function buildSalaryData(overrides: Partial<NormalizedSalarySlipRowData> = {}): NormalizedSalarySlipRowData {
  return {
    documentConfidence: 0.96,
    salaryPeriod: "2026-08-01",
    payDate: null,
    employerName: "Acme Corp",
    employeeName: "Jane Doe",
    employeeIdentifier: null,
    designation: null,
    department: null,
    currency: "INR",
    grossEarnings: "350038.00",
    totalDeductions: "105063.00",
    netPay: "244975.00",
    earnings: [{ code: "BASIC_SALARY", name: "Basic Salary", amount: "175019.00", taxable: true, recurring: true }],
    deductions: [{ code: "INCOME_TAX_TDS", name: "Income Tax / TDS", amount: "85063.00", category: "Tax" }],
    employerContributions: [{ code: "EMPLOYER_PF", name: "Employer PF", amount: "20000.00", contributor: "EMPLOYER" }],
    invariantCheck: { withinTolerance: true, differenceMinorUnits: "0" },
    ...overrides,
  };
}

function buildRow(salaryData: NormalizedSalarySlipRowData, statusOverride?: string): ImportRowStaging {
  return {
    id: "row-1",
    importJobId: "job-1",
    rowNumber: 1,
    rawData: [],
    normalizedData: salaryData,
    status: (statusOverride ?? "MAPPED") as never,
    confidenceScore: "0.96",
    duplicateOfTransactionId: null,
    rejectionReason: null,
    committedEntityId: null,
    committedEntityType: null,
  };
}

describe("SalarySlipReviewPanel", () => {
  it("shows a high-confidence badge for a document confidence of 0.96", () => {
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: { documentId: null } } as never);
    vi.spyOn(financeQueries, "useUpdateImportRow").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    vi.spyOn(financeQueries, "useCommitImport").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);

    const salaryData = buildSalaryData();
    render(
      <SalarySlipReviewPanel
        jobId="job-1"
        row={buildRow(salaryData)}
        salaryData={salaryData}
        confidenceScore="0.96"
        onConfirmed={vi.fn()}
        onFailed={vi.fn()}
      />,
    );

    expect(screen.getAllByText("High confidence").length).toBeGreaterThan(0);
  });

  it("shows 'Not detected' for a field the extraction never found, never a fabricated confidence", () => {
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: { documentId: null } } as never);
    vi.spyOn(financeQueries, "useUpdateImportRow").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    vi.spyOn(financeQueries, "useCommitImport").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);

    const salaryData = buildSalaryData({ payDate: null, designation: null });
    render(
      <SalarySlipReviewPanel
        jobId="job-1"
        row={buildRow(salaryData)}
        salaryData={salaryData}
        confidenceScore="0.96"
        onConfirmed={vi.fn()}
        onFailed={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Not detected").length).toBeGreaterThanOrEqual(2); // Pay Date + Designation
  });

  it("shows the reconciliation-mismatch banner when the invariant check fails, and never silently corrects the values", () => {
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: { documentId: null } } as never);
    vi.spyOn(financeQueries, "useUpdateImportRow").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    vi.spyOn(financeQueries, "useCommitImport").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);

    const salaryData = buildSalaryData({
      totalDeductions: "50000.00",
      invariantCheck: { withinTolerance: false, differenceMinorUnits: "55063" },
    });
    render(
      <SalarySlipReviewPanel
        jobId="job-1"
        row={buildRow(salaryData, "NEEDS_REVIEW")}
        salaryData={salaryData}
        confidenceScore="0.96"
        onConfirmed={vi.fn()}
        onFailed={vi.fn()}
      />,
    );

    expect(screen.getByText("The extracted salary totals do not reconcile.")).toBeInTheDocument();
    // The raw (uncorrected) figure is still shown, not silently patched.
    expect(screen.getByDisplayValue("50000.00")).toBeInTheDocument();
  });

  it("lets the user edit an extracted field before confirming", () => {
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: { documentId: null } } as never);
    vi.spyOn(financeQueries, "useUpdateImportRow").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    vi.spyOn(financeQueries, "useCommitImport").mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);

    const salaryData = buildSalaryData();
    render(
      <SalarySlipReviewPanel
        jobId="job-1"
        row={buildRow(salaryData)}
        salaryData={salaryData}
        confidenceScore="0.96"
        onConfirmed={vi.fn()}
        onFailed={vi.fn()}
      />,
    );

    const employerInput = screen.getByLabelText("Employer");
    fireEvent.change(employerInput, { target: { value: "Acme Corporation Pvt Ltd" } });
    expect(screen.getByDisplayValue("Acme Corporation Pvt Ltd")).toBeInTheDocument();
  });

  it("on confirm: sends the edited fields, commits, reads back the committed row, and calls onConfirmed with the new IncomeRecord id", async () => {
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: { documentId: null } } as never);
    const updateRowMutateAsync = vi.fn().mockResolvedValue(undefined);
    const commitMutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(financeQueries, "useUpdateImportRow").mockReturnValue({
      mutateAsync: updateRowMutateAsync,
      isPending: false,
    } as never);
    vi.spyOn(financeQueries, "useCommitImport").mockReturnValue({
      mutateAsync: commitMutateAsync,
      isPending: false,
    } as never);
    vi.mocked(api.getImportPreview).mockResolvedValue([
      { id: "row-1", committedEntityId: "record-new", committedEntityType: "IncomeRecord" },
    ] as never);

    const onConfirmed = vi.fn();
    const salaryData = buildSalaryData();
    render(
      <SalarySlipReviewPanel
        jobId="job-1"
        row={buildRow(salaryData)}
        salaryData={salaryData}
        confidenceScore="0.96"
        onConfirmed={onConfirmed}
        onFailed={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Employer"), { target: { value: "Acme Corporation Pvt Ltd" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Salary Slip" }));

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith("record-new"));

    expect(updateRowMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-1",
        rowId: "row-1",
        data: expect.objectContaining({
          salarySlip: expect.objectContaining({ employerName: "Acme Corporation Pvt Ltd" }),
        }),
      }),
    );
    expect(commitMutateAsync).toHaveBeenCalledWith("job-1");
  });
});
