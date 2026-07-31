import React, { useState, useEffect } from "react";
import {
  useImports,
  useReviewQueue,
  useCommitImport,
  useUploadImport,
  useAccounts,
  useCreditCards,
  useCategories,
  useConfirmColumnMapping,
  useUpdateImportRow,
  useRetryImport,
  useRollbackImport,
} from "../../hooks/useFinanceQueries";
import { api } from "../../services/api";
import { ImportJob, ImportRowStaging, Account, Category } from "../../types";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  ArrowRight,
  AlertCircle,
  Undo2,
  Check,
  X,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Pagination } from "../../components/common/Pagination";

export const ImportsView: React.FC = () => {
  const { data: importJobs = [], isLoading, isError, error, refetch } = useImports();
  const { data: reviewQueue = [] } = useReviewQueue();
  const { data: accounts = [] } = useAccounts();
  const { data: creditCards = [] } = useCreditCards();
  const { data: categories = [] } = useCategories();

  const combinedAccounts = React.useMemo(() => {
    const accountIds = new Set(accounts.map((a) => a.id));
    const convertedCards: Account[] = creditCards
      .filter((c) => !accountIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: "CREDIT_CARD" as const,
        currentBalance:
          typeof c.currentBalance === "object" && c.currentBalance !== null
            ? c.currentBalance
            : { amount: String(c.currentBalance || c.creditLimit || "0"), currency: c.currency || "INR" },
        status: (c.status as import("../../types").AccountStatus) || "ACTIVE",
        isManual: true,
        currency: c.currency || "INR",
        maskedNumber: c.maskedNumber,
        updatedAt: c.updatedAt,
        lastSyncedAt: c.lastSyncedAt,
      }));
    return [...accounts, ...convertedCards];
  }, [accounts, creditCards]);

  const uploadMutation = useUploadImport();
  const commitMutation = useCommitImport();
  const columnMappingMutation = useConfirmColumnMapping();
  const updateRowMutation = useUpdateImportRow();
  const retryMutation = useRetryImport();
  const rollbackMutation = useRollbackImport();

  const [activeStep, setActiveStep] = useState<"UPLOAD" | "MAPPING" | "PREVIEW" | "QUEUE">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("BANK_STATEMENT");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [stagedRows, setStagedRows] = useState<ImportRowStaging[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Pagination States
  const [stagedPage, setStagedPage] = useState(1);
  const [stagedPageSize, setStagedPageSize] = useState(10);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);

  useEffect(() => {
    if (!selectedAccountId && combinedAccounts.length > 0) {
      setSelectedAccountId(combinedAccounts[0].id);
    }
  }, [combinedAccounts, selectedAccountId]);

  // CSV Column Headers from uploaded statement file
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  // Column Mapping Form State (0-indexed column indices)
  const [mapping, setMapping] = useState({
    transactionDate: 0,
    description: 1,
    amount: 2,
    withdrawal: 3,
    deposit: 4,
    hasSeparateAmount: true,
  });

  const parseCsvHeaders = async (file: File) => {
    try {
      const text = await file.text();
      const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0);
      if (firstLine) {
        const headers = firstLine
          .split(",")
          .map((h) => h.replace(/^["']|["']$/g, "").trim());
        if (headers.length > 0) {
          setCsvHeaders(headers);

          let dateIdx = 0;
          let descIdx = 1;
          let amtIdx = 2;
          let withIdx = 2;
          let depIdx = 3;
          let isSeparate = true;

          headers.forEach((h, idx) => {
            const lower = h.toLowerCase();
            if (lower.includes("date")) dateIdx = idx;
            if (
              lower.includes("desc") ||
              lower.includes("narration") ||
              lower.includes("particular") ||
              lower.includes("payee") ||
              lower.includes("remark")
            )
              descIdx = idx;
            if (lower.includes("debit") || lower.includes("withdrawal") || lower.includes("dr")) {
              withIdx = idx;
              isSeparate = false;
            }
            if (lower.includes("credit") || lower.includes("deposit") || lower.includes("cr")) {
              depIdx = idx;
              isSeparate = false;
            }
            if (lower.includes("amount") && !lower.includes("debit") && !lower.includes("credit")) {
              amtIdx = idx;
            }
          });

          setMapping({
            transactionDate: dateIdx,
            description: descIdx,
            amount: amtIdx,
            withdrawal: withIdx,
            deposit: depIdx,
            hasSeparateAmount: isSeparate,
          });
        }
      }
    } catch {
      setCsvHeaders([]);
    }
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        parseCsvHeaders(file);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    let targetAccountId = selectedAccountId;

    if (targetAccountId) {
      const existingAccount = accounts.find((a) => a.id === targetAccountId);
      if (!existingAccount) {
        const rawCard = creditCards.find((c) => c.id === targetAccountId);
        if (rawCard) {
          const matchingAccount = accounts.find(
            (a) => a.name.toLowerCase() === rawCard.name.toLowerCase() && a.type === "CREDIT_CARD"
          );
          if (matchingAccount) {
            targetAccountId = matchingAccount.id;
          } else {
            try {
              const newAcc = await api.createAccount({
                name: rawCard.name,
                type: "CREDIT_CARD",
                currency: rawCard.currency || "INR",
                openingBalance: "0",
                currentBalance: {
                  amount: typeof rawCard.currentBalance === "string" ? rawCard.currentBalance : "0",
                  currency: rawCard.currency || "INR",
                },
                status: "ACTIVE",
                isManual: true,
              });
              targetAccountId = newAcc.id;
            } catch {
              // Ignore fallback error
            }
          }
        }
      }
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (targetAccountId) {
      formData.append("accountId", targetAccountId);
    }
    if (documentType) {
      formData.append("documentType", documentType);
    }

    uploadMutation.mutate(formData, {
      onSuccess: async (job: ImportJob) => {
        setCurrentJobId(job.id);
        setIsLoadingPreview(true);
        try {
          const preview = await api.getImportPreview(job.id);
          const previewObj = preview as unknown as { stagedRows?: ImportRowStaging[]; data?: ImportRowStaging[] };
          const rows = Array.isArray(preview) ? preview : previewObj?.stagedRows || previewObj?.data || [];
          setStagedRows(rows);
          if (selectedFile.name.endsWith(".csv") || selectedFile.name.endsWith(".txt")) {
            setActiveStep("MAPPING");
          } else {
            setActiveStep("PREVIEW");
          }
        } catch {
          setStagedRows([]);
          setActiveStep("PREVIEW");
        } finally {
          setIsLoadingPreview(false);
        }
      },
    });
  };

  const handleConfirmMapping = () => {
    if (!currentJobId) return;
    const dtoPayload: Record<string, string | number> = {
      transactionDate: Number(mapping.transactionDate) || 0,
      description: Number(mapping.description) || 1,
    };
    if (mapping.hasSeparateAmount) {
      dtoPayload.amount = Number(mapping.amount) || 2;
    } else {
      dtoPayload.withdrawal = Number(mapping.withdrawal) || 2;
      dtoPayload.deposit = Number(mapping.deposit) || 3;
    }

    columnMappingMutation.mutate(
      { id: currentJobId, mapping: dtoPayload as unknown as Record<string, string> },
      {
        onSuccess: async () => {
          setIsLoadingPreview(true);
          try {
            const preview = await api.getImportPreview(currentJobId);
            const previewObj = preview as unknown as { stagedRows?: ImportRowStaging[]; data?: ImportRowStaging[] };
            const rows = Array.isArray(preview) ? preview : previewObj?.stagedRows || previewObj?.data || [];
            setStagedRows(rows);
            setActiveStep("PREVIEW");
          } finally {
            setIsLoadingPreview(false);
          }
        },
      }
    );
  };

  const handleRowAction = (
    rowId: string,
    action: { categoryId?: string; direction?: "INFLOW" | "OUTFLOW"; confirmNotDuplicate?: boolean; reject?: boolean }
  ) => {
    if (!currentJobId) return;
    updateRowMutation.mutate(
      {
        jobId: currentJobId,
        rowId,
        data: action as Partial<ImportRowStaging>,
      },
      {
        onSuccess: async () => {
          const preview = await api.getImportPreview(currentJobId);
          const previewObj = preview as unknown as { stagedRows?: ImportRowStaging[]; data?: ImportRowStaging[] };
          const rows = Array.isArray(preview) ? preview : previewObj?.stagedRows || previewObj?.data || [];
          setStagedRows(rows);
        },
      }
    );
  };

  const handleReviewQueueAction = (
    jobId: string,
    rowId: string,
    action: { confirmNotDuplicate?: boolean; reject?: boolean }
  ) => {
    updateRowMutation.mutate({
      jobId,
      rowId,
      data: action as Partial<ImportRowStaging>,
    });
  };

  const handleCommit = () => {
    if (!currentJobId) return;
    commitMutation.mutate(currentJobId, {
      onSuccess: () => {
        setActiveStep("UPLOAD");
        setSelectedFile(null);
        setCurrentJobId(null);
        setStagedRows([]);
      },
    });
  };

  const handleViewPreviewForJob = async (jobId: string) => {
    setCurrentJobId(jobId);
    setIsLoadingPreview(true);
    try {
      const preview = await api.getImportPreview(jobId);
      const previewObj = preview as unknown as { stagedRows?: ImportRowStaging[]; data?: ImportRowStaging[] };
      const rows = Array.isArray(preview) ? preview : previewObj?.stagedRows || previewObj?.data || [];
      setStagedRows(rows);
      setActiveStep("PREVIEW");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Imports</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve import pipeline status."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Ingestion & Import Pipeline</h2>
          <p className="text-xs text-slate-400">
            Import statements (CSV, Excel, PDF) with AI parsing, OCR, fuzzy duplicate detection & column mapping
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveStep("UPLOAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStep === "UPLOAD" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Upload Wizard
          </button>
          {currentJobId && (
            <button
              onClick={() => setActiveStep("PREVIEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStep === "PREVIEW" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Staged Preview
            </button>
          )}
          <button
            onClick={() => setActiveStep("QUEUE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStep === "QUEUE" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Review Queue
            {reviewQueue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-400 text-[10px]">
                {reviewQueue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Step 1: Upload Zone */}
      {activeStep === "UPLOAD" && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Drop your Financial Statement</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Supports HDFC, ICICI, SBI, Axis PDF statements, Zerodha/Groww CAS PDFs, Swiggy/Amazon CSVs, and Excel files.
            </p>
          </div>

          {/* Account & Document Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Account (Optional)</label>
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  setSelectedAccountId(targetId);
                  const selectedAcc = combinedAccounts.find((a) => a.id === targetId);
                  if (selectedAcc && selectedAcc.type === "CREDIT_CARD") {
                    setDocumentType("CREDIT_CARD_STATEMENT");
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Auto-detect / Portfolio Target --</option>
                {combinedAccounts.map((acc: Account) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.type === "CREDIT_CARD" ? "💳 " : "🏦 "}{acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="BANK_STATEMENT">Bank Statement (PDF/CSV)</option>
                <option value="CREDIT_CARD_STATEMENT">Credit Card Statement (PDF/CSV)</option>
                <option value="CAS_STATEMENT">Consolidated Account Statement (CAS PDF)</option>
                <option value="MUTUAL_FUND_STATEMENT">Mutual Fund Statement PDF</option>
              </select>
            </div>
          </div>

          {/* File Picker Box */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 hover:border-emerald-500/50 transition-all cursor-pointer relative text-center">
            <input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.txt"
              onChange={handleFileDrop}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold text-sm">
                <FileText className="w-5 h-5" />
                <span>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">
                Click to browse or drag statement file here (<span className="text-emerald-400">PDF, CSV, XLSX</span>)
              </p>
            )}
          </div>

          {selectedFile && (
            <div className="text-center">
              <button
                onClick={handleUploadSubmit}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting to Pipeline...
                  </>
                ) : (
                  <>
                    Start Parsing Pipeline <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium max-w-md mx-auto flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{(uploadMutation.error as Error)?.message || "File upload failed."}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Column Mapping Configuration (for CSV statements) */}
      {activeStep === "MAPPING" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Configure CSV Column Mapping</h3>
                <p className="text-xs text-slate-400">Map CSV headers from your statement file</p>
              </div>
            </div>
            <button
              onClick={() => setActiveStep("PREVIEW")}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Skip to Preview →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Transaction Date Header</label>
              <select
                value={mapping.transactionDate}
                onChange={(e) => setMapping({ ...mapping, transactionDate: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {(csvHeaders.length > 0
                  ? csvHeaders
                  : ["Column A", "Column B", "Column C", "Column D", "Column E", "Column F"]
                ).map((h, i) => (
                  <option key={i} value={i}>
                    Col {String.fromCharCode(65 + i)}: "{h}"
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Description / Narration Header</label>
              <select
                value={mapping.description}
                onChange={(e) => setMapping({ ...mapping, description: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {(csvHeaders.length > 0
                  ? csvHeaders
                  : ["Column A", "Column B", "Column C", "Column D", "Column E", "Column F"]
                ).map((h, i) => (
                  <option key={i} value={i}>
                    Col {String.fromCharCode(65 + i)}: "{h}"
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Amount Format</label>
              <select
                value={mapping.hasSeparateAmount ? "SINGLE" : "SPLIT"}
                onChange={(e) => setMapping({ ...mapping, hasSeparateAmount: e.target.value === "SINGLE" })}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="SINGLE">Single Signed Amount Header</option>
                <option value="SPLIT">Separate Debit / Credit Headers</option>
              </select>
            </div>

            {mapping.hasSeparateAmount ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount Header</label>
                <select
                  value={mapping.amount}
                  onChange={(e) => setMapping({ ...mapping, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  {(csvHeaders.length > 0
                    ? csvHeaders
                    : ["Column A", "Column B", "Column C", "Column D", "Column E", "Column F"]
                  ).map((h, i) => (
                    <option key={i} value={i}>
                      Col {String.fromCharCode(65 + i)}: "{h}"
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Withdrawal (Debit) Header</label>
                  <select
                    value={mapping.withdrawal}
                    onChange={(e) => setMapping({ ...mapping, withdrawal: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    {(csvHeaders.length > 0
                      ? csvHeaders
                      : ["Column A", "Column B", "Column C", "Column D", "Column E", "Column F"]
                    ).map((h, i) => (
                      <option key={i} value={i}>
                        Col {String.fromCharCode(65 + i)}: "{h}"
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Deposit (Credit) Header</label>
                  <select
                    value={mapping.deposit}
                    onChange={(e) => setMapping({ ...mapping, deposit: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    {(csvHeaders.length > 0
                      ? csvHeaders
                      : ["Column A", "Column B", "Column C", "Column D", "Column E", "Column F"]
                    ).map((h, i) => (
                      <option key={i} value={i}>
                        Col {String.fromCharCode(65 + i)}: "{h}"
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmMapping}
              disabled={columnMappingMutation.isPending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {columnMappingMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirm Column Mapping & Apply
            </button>

            {!mapping.hasSeparateAmount && (
              <button
                type="button"
                onClick={() =>
                  setMapping((prev) => ({
                    ...prev,
                    withdrawal: prev.deposit,
                    deposit: prev.withdrawal,
                  }))
                }
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Swap Debit & Credit Headers
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Staged Row Preview & Atomic Commit */}
      {activeStep === "PREVIEW" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Staged Row Mapping Preview</h3>
              <p className="text-xs text-slate-400">
                Job ID: <span className="font-mono text-slate-300">{currentJobId}</span> • {stagedRows.length} rows staged
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep("MAPPING")}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Mapping
              </button>

              <button
                onClick={handleCommit}
                disabled={commitMutation.isPending || stagedRows.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
              >
                {commitMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Commit All Staged Rows
              </button>
            </div>
          </div>

          {isLoadingPreview ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading staged row preview...</div>
          ) : stagedRows.length === 0 ? (
            <div className="p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              No staged rows available for preview.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Type / Direction</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stagedRows
                    .slice((stagedPage - 1) * stagedPageSize, stagedPage * stagedPageSize)
                    .map((row: ImportRowStaging) => {
                    const rowObj = row as unknown as Record<string, unknown>;
                    const norm = (rowObj.normalizedData as Record<string, string>) || {};
                    const raw = rowObj.rawData;
                    const dateVal = norm.date || (Array.isArray(raw) ? String(raw[0]) : "—");
                    const descVal =
                      norm.description ||
                      (Array.isArray(raw) ? String(raw[1] || raw.join(" | ")) : typeof raw === "object" ? JSON.stringify(raw) : "—");
                    const amtVal = norm.amount || (Array.isArray(raw) ? String(raw[2]) : "0");
                    const isInflow = norm.direction === "INFLOW";

                    const isDup = row.status === "DUPLICATE";
                    const isReview = row.status === "NEEDS_REVIEW";

                    return (
                      <tr key={row.id} className="hover:bg-slate-800/30">
                        <td className="p-3 text-xs text-slate-300 font-mono">{dateVal}</td>
                        <td className="p-3 font-semibold text-slate-100 max-w-xs truncate">{descVal}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleRowAction(row.id, {
                                direction: isInflow ? "OUTFLOW" : "INFLOW",
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                              isInflow
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            }`}
                            title="Click to toggle between Credit (Inflow) and Debit (Outflow)"
                          >
                            {isInflow ? "+ Credit (Inflow)" : "- Debit (Outflow)"}
                          </button>
                        </td>
                        <td className={`p-3 font-bold ${isInflow ? "text-emerald-400" : "text-slate-100"}`}>
                          {isInflow ? "+" : "-"} ₹{(parseFloat(amtVal) || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-xs">
                          <select
                            value={(rowObj.categoryId as string) || ""}
                            onChange={(e) => handleRowAction(row.id, { categoryId: e.target.value })}
                            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                          >
                            <option value="">-- Category --</option>
                            {categories.map((cat: Category) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              isDup
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : isReview
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isDup && (
                              <button
                                onClick={() => handleRowAction(row.id, { confirmNotDuplicate: true })}
                                className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20"
                                title="Confirm Not Duplicate"
                              >
                                Keep
                              </button>
                            )}
                            <button
                              onClick={() => handleRowAction(row.id, { reject: true })}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="Reject Row"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Staged Rows Pagination */}
          <Pagination
            currentPage={stagedPage}
            totalPages={Math.ceil(stagedRows.length / stagedPageSize) || 1}
            totalItems={stagedRows.length}
            pageSize={stagedPageSize}
            onPageChange={(page) => setStagedPage(page)}
            onPageSizeChange={(size) => {
              setStagedPageSize(size);
              setStagedPage(1);
            }}
          />
        </div>
      )}

      {/* Review Queue Step */}
      {activeStep === "QUEUE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Cross-Job Manual Review Queue</h3>
              <p className="text-xs text-slate-400">Low-confidence OCR or potential duplicates requiring human decision</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {reviewQueue.length} Pending
            </span>
          </div>

          {reviewQueue.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              No items currently pending review in queue. All statements clean!
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.map((stg: ImportRowStaging) => {
                const stgObj = stg as unknown as Record<string, unknown>;
                const norm = (stgObj.normalizedData as Record<string, string>) || {};
                const jobId = String(stgObj.importJobId || stgObj.jobId || "");

                return (
                  <div
                    key={stg.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{norm.description || "Unrecognized Row"}</p>
                        <p className="text-xs text-slate-400">
                          Date: {norm.date || "—"} • Amount: ₹{parseFloat(norm.amount || "0").toLocaleString("en-IN")} • Status: {stg.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleReviewQueueAction(jobId, stg.id, { confirmNotDuplicate: true })}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                      >
                        Confirm & Keep
                      </button>
                      <button
                        onClick={() => handleReviewQueueAction(jobId, stg.id, { reject: true })}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Import History Table */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="text-base font-bold text-slate-100">Recent Import Jobs History</h3>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Source File</th>
                <th className="p-4">Type</th>
                <th className="p-4">Total / Mapped Rows</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions & Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {importJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                    No import jobs found in history.
                  </td>
                </tr>
              ) : (
                importJobs
                  .slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize)
                  .map((job: ImportJob) => {
                    const isDone = job.status === "COMPLETED" || job.status === "PARTIALLY_COMPLETED";
                    const isFailed = job.status === "FAILED";

                    return (
                      <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-xs">{job.fileName}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-400">{job.sourceType || "STATEMENT"}</td>
                        <td className="p-4 text-xs font-medium text-slate-200">
                          {job.totalRows || 0} rows ({job.mappedRows || 0} mapped)
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isDone
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isFailed
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewPreviewForJob(job.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                              title="View Staged Rows"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>

                            {isDone && (
                              <button
                                onClick={() => rollbackMutation.mutate(job.id)}
                                disabled={rollbackMutation.isPending}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center gap-1 disabled:opacity-50"
                                title="Rollback transactions created by this job"
                              >
                                <Undo2 className="w-3.5 h-3.5" /> Rollback
                              </button>
                            )}

                            {isFailed && (
                              <button
                                onClick={() => retryMutation.mutate(job.id)}
                                disabled={retryMutation.isPending}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center gap-1 disabled:opacity-50"
                                title="Retry import job"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* History Jobs Pagination */}
        <Pagination
          currentPage={historyPage}
          totalPages={Math.ceil(importJobs.length / historyPageSize) || 1}
          totalItems={importJobs.length}
          pageSize={historyPageSize}
          onPageChange={(page) => setHistoryPage(page)}
          onPageSizeChange={(size) => {
            setHistoryPageSize(size);
            setHistoryPage(1);
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>
    </div>
  );
};
