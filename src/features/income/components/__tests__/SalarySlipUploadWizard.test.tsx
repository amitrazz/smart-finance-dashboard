import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, fireEvent, act } from "@testing-library/react";
import { SalarySlipUploadWizard } from "../SalarySlipUploadWizard";
import * as financeQueries from "../../../../hooks/useFinanceQueries";
import { ImportJob } from "../../../../types";

vi.mock("../../../../hooks/useFinanceQueries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../hooks/useFinanceQueries")>();
  return { ...actual };
});

afterEach(() => cleanup());

function baseJob(overrides: Partial<ImportJob> = {}): ImportJob {
  return {
    id: "job-1",
    fileName: "salary-aug.pdf",
    sourceType: "PDF",
    status: "AWAITING_REVIEW",
    targetAccountId: null,
    totalRows: 1,
    mappedRows: 1,
    duplicateRows: 0,
    importedRows: 0,
    failedRows: 0,
    columnMapping: null,
    errorLog: null,
    createdAt: "2026-08-22T00:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

function file(name: string, sizeBytes: number, type = "application/pdf") {
  const f = new File([new Uint8Array(Math.max(sizeBytes, 1))], name, { type });
  Object.defineProperty(f, "size", { value: sizeBytes });
  return f;
}

function mockHooks() {
  const uploadMutate = vi.fn();
  vi.spyOn(financeQueries, "useUploadImportFile").mockReturnValue({
    mutate: uploadMutate,
    isPending: false,
  } as never);
  vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: undefined } as never);
  vi.spyOn(financeQueries, "useImportPreview").mockReturnValue({ data: undefined } as never);
  vi.spyOn(financeQueries, "useRetryImport").mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
  return { uploadMutate };
}

describe("SalarySlipUploadWizard — upload validation", () => {
  it("rejects a non-PDF/image file client-side", () => {
    mockHooks();
    render(<SalarySlipUploadWizard onConfirmed={vi.fn()} />);
    const input = screen.getByLabelText("Choose a salary slip file");
    fireEvent.change(input, { target: { files: [file("payslip.docx", 1000, "application/msword")] } });
    expect(
      screen.getByText("Only PDF or image files (PNG/JPG) are supported for salary slips."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload Salary Slip" })).toBeDisabled();
  });

  it("rejects a file over the size limit client-side", () => {
    mockHooks();
    render(<SalarySlipUploadWizard onConfirmed={vi.fn()} />);
    const input = screen.getByLabelText("Choose a salary slip file");
    fireEvent.change(input, { target: { files: [file("huge.pdf", 6 * 1024 * 1024)] } });
    expect(screen.getByText("This file is too large (max 5MB).")).toBeInTheDocument();
  });

  it("rejects an empty file client-side", () => {
    mockHooks();
    render(<SalarySlipUploadWizard onConfirmed={vi.fn()} />);
    const input = screen.getByLabelText("Choose a salary slip file");
    fireEvent.change(input, { target: { files: [file("empty.pdf", 0)] } });
    expect(screen.getByText("This file appears to be empty.")).toBeInTheDocument();
  });

  it("enables Upload once a valid file is selected, and submits with documentType=SALARY_SLIP", () => {
    const { uploadMutate } = mockHooks();
    render(<SalarySlipUploadWizard onConfirmed={vi.fn()} />);
    const input = screen.getByLabelText("Choose a salary slip file");
    fireEvent.change(input, { target: { files: [file("payslip.pdf", 1000)] } });

    const uploadButton = screen.getByRole("button", { name: "Upload Salary Slip" });
    expect(uploadButton).not.toBeDisabled();
    fireEvent.click(uploadButton);

    expect(uploadMutate).toHaveBeenCalled();
    const [formData] = uploadMutate.mock.calls[0];
    expect(formData.get("documentType")).toBe("SALARY_SLIP");
    // Never a target account/card — a salary slip never targets either.
    expect(formData.get("accountId")).toBeNull();
    expect(formData.get("creditCardId")).toBeNull();
  });

  it("shows the duplicate ('already imported') screen when upload short-circuits to a COMPLETED job", () => {
    let capturedOnSuccess: ((job: ImportJob) => void) | undefined;
    vi.spyOn(financeQueries, "useUploadImportFile").mockReturnValue({
      mutate: vi.fn((_fd, opts) => {
        capturedOnSuccess = opts?.onSuccess;
      }),
      isPending: false,
    } as never);
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: undefined } as never);
    vi.spyOn(financeQueries, "useImportPreview").mockReturnValue({
      data: [{ id: "row-1", committedEntityId: "record-existing", committedEntityType: "IncomeRecord" }],
    } as never);
    vi.spyOn(financeQueries, "useRetryImport").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);

    render(<SalarySlipUploadWizard onConfirmed={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Choose a salary slip file"), {
      target: { files: [file("payslip.pdf", 1000)] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Salary Slip" }));

    act(() => {
      capturedOnSuccess?.(baseJob({ status: "COMPLETED" }));
    });

    expect(screen.getByText("Already imported")).toBeInTheDocument();
    expect(
      screen.getByText("This salary slip appears to have already been imported."),
    ).toBeInTheDocument();
  });

  it("shows a Retry action when the job fails", () => {
    let capturedOnSuccess: ((job: ImportJob) => void) | undefined;
    vi.spyOn(financeQueries, "useUploadImportFile").mockReturnValue({
      mutate: vi.fn((_fd, opts) => {
        capturedOnSuccess = opts?.onSuccess;
      }),
      isPending: false,
    } as never);
    vi.spyOn(financeQueries, "useImportJob").mockReturnValue({ data: undefined } as never);
    vi.spyOn(financeQueries, "useImportPreview").mockReturnValue({ data: undefined } as never);
    vi.spyOn(financeQueries, "useRetryImport").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);

    render(<SalarySlipUploadWizard onConfirmed={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Choose a salary slip file"), {
      target: { files: [file("payslip.pdf", 1000)] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload Salary Slip" }));

    act(() => {
      capturedOnSuccess?.(
        baseJob({ status: "FAILED", errorLog: [{ rowNumber: 0, message: "OCR failed" }] }),
      );
    });

    expect(screen.getByText("Processing failed")).toBeInTheDocument();
    expect(screen.getByText("OCR failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });
});
