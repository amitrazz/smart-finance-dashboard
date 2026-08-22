import React, { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import {
  useUploadImportFile,
  useImportJob,
  useImportPreview,
  useRetryImport,
  TERMINAL_POST_UPLOAD_STATUSES,
} from "../../../hooks/useFinanceQueries";
import { ImportJob, NormalizedSalarySlipRowData } from "../../../types";
import { SalarySlipReviewPanel } from "./SalarySlipReviewPanel";
import { Button } from "../../../components/ui/Button";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ACCEPTED_TYPES = [".pdf", ".png", ".jpg", ".jpeg"];
// Give the user something to look at while OCR/AI extraction runs — never
// pretend this is instantaneous (spec §4/§6).
const PROCESSING_LABELS: Partial<Record<string, string>> = {
  UPLOADED: "Queued for processing…",
  VALIDATING: "Validating file…",
  PARSING: "Reading the document…",
  OCR_PROCESSING: "Extracting text with OCR…",
  AI_EXTRACTING: "Reading salary details with AI…",
  NORMALIZING: "Organizing extracted figures…",
};
const PROCESSING_GIVEUP_MS = 75000;

type Step = "UPLOAD" | "PROCESSING" | "REVIEW" | "FAILED" | "DUPLICATE";

interface SalarySlipUploadWizardProps {
  /** Called once the user confirms the extraction — the id of the new (or, for a corrected re-import, existing) IncomeRecord. */
  onConfirmed: (incomeRecordId: string) => void;
  onCancel?: () => void;
}

export const SalarySlipUploadWizard: React.FC<SalarySlipUploadWizardProps> = ({
  onConfirmed,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [processingGaveUp, setProcessingGaveUp] = useState(false);
  const lastFileNameRef = useRef<string | null>(null);

  const uploadMutation = useUploadImportFile();
  const retryMutation = useRetryImport();

  const { data: polledJob } = useImportJob(step === "PROCESSING" ? jobId || "" : "", {
    pollIntervalMs: step === "PROCESSING" ? (processingGaveUp ? 15000 : 2500) : undefined,
  });

  const { data: previewRows } = useImportPreview(
    step === "REVIEW" && jobId ? jobId : "",
    { limit: 1 },
  );

  function resolveJobOutcome(job: ImportJob) {
    if (job.status === "FAILED") {
      setFailureMessage(job.errorLog?.[0]?.message || "Salary slip processing failed.");
      setStep("FAILED");
      return;
    }
    if (job.status === "COMPLETED" || job.status === "PARTIALLY_COMPLETED") {
      // Identical file re-upload short-circuits straight to the already-committed
      // job — no re-parsing. The committed row already points at the existing
      // IncomeRecord (see backend docs/24-salary-slip-import.md).
      setStep("DUPLICATE");
      return;
    }
    if (job.status === "AWAITING_REVIEW") {
      setStep("REVIEW");
      return;
    }
    // Still processing (PARSING/OCR_PROCESSING/AI_EXTRACTING/NORMALIZING/...)
    setProcessingStartedAt(Date.now());
    setProcessingGaveUp(false);
    setStep("PROCESSING");
  }

  useEffect(() => {
    if (step !== "PROCESSING" || !polledJob) return;
    if (TERMINAL_POST_UPLOAD_STATUSES.includes(polledJob.status)) {
      resolveJobOutcome(polledJob);
    }
     
  }, [polledJob, step]);

  useEffect(() => {
    if (step !== "PROCESSING" || processingGaveUp || processingStartedAt === null) return;
    const timer = setInterval(() => {
      if (Date.now() - processingStartedAt > PROCESSING_GIVEUP_MS) {
        setProcessingGaveUp(true);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [step, processingGaveUp, processingStartedAt]);

  const validateFile = (candidate: File): string | null => {
    const lowerName = candidate.name.toLowerCase();
    const hasAcceptedExtension = ACCEPTED_TYPES.some((ext) => lowerName.endsWith(ext));
    if (!hasAcceptedExtension) {
      return "Only PDF or image files (PNG/JPG) are supported for salary slips.";
    }
    if (candidate.size === 0) {
      return "This file appears to be empty.";
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return "This file is too large (max 15MB).";
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const candidate = e.target.files?.[0];
    if (!candidate) return;
    const error = validateFile(candidate);
    if (error) {
      setFileError(error);
      setFile(null);
      return;
    }
    // Same file selected twice in a row — not a hard block (the backend's
    // sourceFileHash check is authoritative), just avoid a redundant upload
    // click doing nothing visibly different.
    if (lastFileNameRef.current === candidate.name && file?.name === candidate.name) {
      setFileError(null);
    }
    setFileError(null);
    setFile(candidate);
  };

  const handleUpload = () => {
    if (!file) return;
    lastFileNameRef.current = file.name;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", "SALARY_SLIP");

    uploadMutation.mutate(formData, {
      onSuccess: (job) => {
        setJobId(job.id);
        resolveJobOutcome(job);
      },
    });
  };

  const handleRetry = () => {
    if (!jobId) return;
    retryMutation.mutate(jobId, {
      onSuccess: (job) => {
        resolveJobOutcome(job);
      },
    });
  };

  const handleReupload = () => {
    setStep("UPLOAD");
    setFile(null);
    setJobId(null);
    setFailureMessage(null);
  };

  const row = previewRows?.[0];
  const salaryData =
    row?.normalizedData && "netPay" in row.normalizedData
      ? (row.normalizedData as NormalizedSalarySlipRowData)
      : null;

  if (step === "REVIEW" && jobId && row && salaryData) {
    return (
      <SalarySlipReviewPanel
        jobId={jobId}
        row={row}
        salaryData={salaryData}
        confidenceScore={row.confidenceScore}
        onConfirmed={onConfirmed}
        onFailed={(message) => {
          setFailureMessage(message);
          setStep("FAILED");
        }}
      />
    );
  }

  if (step === "PROCESSING") {
    const label = polledJob ? PROCESSING_LABELS[polledJob.status] : "Uploading…";
    return (
      <div
        className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4"
        role="status"
        aria-live="polite"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 animate-pulse">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Salary slip uploaded</h3>
        <p className="text-sm text-slate-300">{label || "Extracting salary information…"}</p>
        {processingGaveUp && (
          <p className="text-xs text-amber-400">
            This is taking longer than usual — still working, no need to re-upload.
          </p>
        )}
      </div>
    );
  }

  if (step === "FAILED") {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-100">Processing failed</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {failureMessage || "Something went wrong while processing this salary slip."}
        </p>
        <div className="flex items-center justify-center gap-3">
          {jobId && (
            <Button
              onClick={handleRetry}
              disabled={retryMutation.isPending}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          )}
          <button
            onClick={handleReupload}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Re-upload
          </button>
        </div>
      </div>
    );
  }

  if (step === "DUPLICATE") {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-amber-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-bold text-slate-100">Already imported</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          This salary slip appears to have already been imported.
        </p>
        <div className="flex items-center justify-center gap-3">
          {row?.committedEntityId && (
            <Button
              onClick={() => onConfirmed(row.committedEntityId as string)}
              className="inline-flex items-center gap-2"
            >
              Review Existing <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <button
            onClick={handleReupload}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Upload a different file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
          <UploadCloud className="w-8 h-8" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Import Salary Slip</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Upload a PDF or image of your salary slip. We'll extract the gross pay, deductions, and
          net pay for you to review and confirm — this never creates a bank transaction on its own.
        </p>
      </div>

      <div className="max-w-xl mx-auto p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 hover:border-emerald-500/50 transition-all cursor-pointer relative text-center">
        <label htmlFor="salary-slip-file-input" className="sr-only">
          Choose a salary slip file
        </label>
        <input
          id="salary-slip-file-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold text-sm">
            <FileText className="w-5 h-5" aria-hidden="true" />
            <span>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-400">
            Click to browse or drag a file here (<span className="text-emerald-400">PDF, PNG, JPG</span>)
          </p>
        )}
      </div>

      {fileError && (
        <p role="alert" className="text-xs text-rose-400 text-center">
          {fileError}
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Cancel
          </button>
        )}
        <Button
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="inline-flex items-center gap-2"
        >
          {uploadMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>Upload Salary Slip</>
          )}
        </Button>
      </div>
    </div>
  );
};
