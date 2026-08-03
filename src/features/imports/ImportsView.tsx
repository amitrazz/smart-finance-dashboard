import React, { useState, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useUIStore } from "../../store/useUIStore";
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
  useImportPreviewInfinite,
} from "../../hooks/useFinanceQueries";
import {
  ImportJob,
  ImportJobStatus,
  ImportRowStaging,
  NormalizedTransactionRowData,
  NormalizedTradeRowData,
  ColumnMappingData,
  Account,
} from "../../types";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  ArrowRight,
  Undo2,
  XCircle,
} from "lucide-react";

function isTradeRow(
  data: NormalizedTransactionRowData | NormalizedTradeRowData | null | undefined
): data is NormalizedTradeRowData {
  return !!data && "tradeDate" in data;
}

// The row's `normalizedData` shape depends on whether the source routed into
// `transactions` (bank/CSV/Excel) or `investments` (CAS/broker PDF) — see the
// Institution Detection stage in packages/finance/docs/03-import-pipeline.md.
function getRowDisplay(row: ImportRowStaging) {
  const data = row.normalizedData;
  if (isTradeRow(data)) {
    return {
      date: data.tradeDate,
      description: data.schemeName,
      direction: data.tradeType,
      amount: data.amount,
      categoryName: data.isin || "—",
    };
  }
  return {
    date: data?.transactionDate,
    description: data?.description,
    direction: data?.direction,
    amount: data?.amount,
    categoryName: data?.merchantName || "General",
  };
}

// Renders the actual CSV/Excel header names (from the upload's auto-mapper
// guess) as a dropdown so the user picks a column by name instead of
// guessing a blind zero-based index. Falls back to a plain number input
// when no header row is available.
function ColumnPicker({
  headers,
  value,
  onChange,
  allowNone,
}: {
  headers?: string[];
  value: number;
  onChange: (index: number) => void;
  allowNone?: boolean;
}) {
  if (!headers || headers.length === 0) {
    return (
      <input
        type="number"
        min={allowNone ? -1 : 0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
      />
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
    >
      {allowNone && <option value={-1}>-- None --</option>}
      {headers.map((h, idx) => (
        <option key={idx} value={idx}>
          Col {idx}: {h}
        </option>
      ))}
    </select>
  );
}

const RETRYABLE_STATUSES: ImportJobStatus[] = ["FAILED", "PARTIALLY_COMPLETED"];
const ROLLBACKABLE_STATUSES: ImportJobStatus[] = ["COMPLETED", "PARTIALLY_COMPLETED"];

export const ImportsView: React.FC = () => {
  const { activeSubTab } = useUIStore();
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
        name: c.nickname,
        type: "CREDIT_CARD" as const,
        currentBalance:
          typeof c.currentOutstanding === "object" && c.currentOutstanding !== null
            ? c.currentOutstanding
            : { amount: String(c.currentOutstanding || c.creditLimit || "0"), currency: c.currency || "INR" },
        status: (c.status as import("../../types").AccountStatus) || "ACTIVE",
        isManual: true,
        currency: c.currency || "INR",
        maskedNumber: c.lastFourDigits ? `•••• ${c.lastFourDigits}` : undefined,
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
  const [rowCategoryChoice, setRowCategoryChoice] = useState<Record<string, string>>({});
  const [suggestedMapping, setSuggestedMapping] = useState<ColumnMappingData | null>(null);

  // Sync activeSubTab
  useEffect(() => {
    if (activeSubTab === "review-queue") {
      setActiveStep("QUEUE");
    } else if (activeSubTab === "wizard" || !activeSubTab) {
      setActiveStep("UPLOAD");
    }
  }, [activeSubTab]);

  const {
    data: previewData,
    isLoading: isLoadingPreview,
    fetchNextPage: fetchNextPreviewPage,
    hasNextPage: hasNextPreviewPage,
    isFetchingNextPage: isFetchingNextPreviewPage,
  } = useImportPreviewInfinite(currentJobId || "");

  const stagedRows = useMemo<ImportRowStaging[]>(() => previewData?.pages.flatMap((p) => p.data) ?? [], [previewData]);
  const totalStagedCount = previewData?.pages[0]?.totalCount ?? previewData?.pages[0]?.total;

  const stagedScrollRef = useRef<HTMLDivElement>(null);
  const stagedRowVirtualizer = useVirtualizer({
    count: stagedRows.length,
    getScrollElement: () => stagedScrollRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });
  const stagedVirtualRows = stagedRowVirtualizer.getVirtualItems();

  const [mapping, setMapping] = useState({
    transactionDate: 0,
    description: 1,
    amount: 2,
    withdrawal: 2,
    deposit: 3,
    balance: -1,
    hasSeparateAmount: false,
  });

  useEffect(() => {
    const lastRow = stagedVirtualRows[stagedVirtualRows.length - 1];
    if (!lastRow) return;
    if (lastRow.index >= stagedRows.length - 5 && hasNextPreviewPage && !isFetchingNextPreviewPage) {
      fetchNextPreviewPage();
    }
  }, [stagedVirtualRows, stagedRows.length, hasNextPreviewPage, isFetchingNextPreviewPage, fetchNextPreviewPage]);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const targetAccountId = selectedAccountId;
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (targetAccountId) {
      formData.append("accountId", targetAccountId);
    }
    if (documentType) {
      formData.append("documentType", documentType);
    }

    uploadMutation.mutate(formData, {
      onSuccess: (job: ImportJob) => {
        setCurrentJobId(job.id);
        const guess = job.columnMapping;
        setSuggestedMapping(guess);
        if (guess) {
          setMapping({
            transactionDate: guess.fields.transactionDate,
            description: guess.fields.description,
            amount: guess.fields.amount ?? 2,
            withdrawal: guess.fields.withdrawal ?? 2,
            deposit: guess.fields.deposit ?? 3,
            balance: guess.fields.balance ?? -1,
            hasSeparateAmount: guess.fields.amount === undefined && guess.fields.withdrawal !== undefined,
          });
        }
        if (selectedFile.name.endsWith(".csv") || selectedFile.name.endsWith(".txt")) {
          setActiveStep("MAPPING");
        } else {
          setActiveStep("PREVIEW");
        }
      },
    });
  };

  const handleConfirmMapping = () => {
    if (!currentJobId) return;
    // ConfirmColumnMappingDto requires transactionDate + description; amount
    // XOR withdrawal/deposit; balance is optional.
    const dtoPayload: Record<string, number> = {
      transactionDate: Number(mapping.transactionDate) || 0,
      description: Number(mapping.description) || 0,
    };
    if (mapping.hasSeparateAmount) {
      dtoPayload.withdrawal = Number(mapping.withdrawal) || 0;
      dtoPayload.deposit = Number(mapping.deposit) || 0;
    } else {
      dtoPayload.amount = Number(mapping.amount) || 0;
    }
    if (mapping.balance >= 0) {
      dtoPayload.balance = mapping.balance;
    }

    columnMappingMutation.mutate(
      { id: currentJobId, mapping: dtoPayload as unknown as Record<string, string> },
      {
        onSuccess: () => {
          setActiveStep("PREVIEW");
        },
      }
    );
  };

  const handleCommit = () => {
    if (!currentJobId) return;
    commitMutation.mutate(currentJobId, {
      onSuccess: () => {
        setActiveStep("UPLOAD");
        setSelectedFile(null);
        setCurrentJobId(null);
      },
    });
  };

  const handleResolveRow = (rowId: string, action: "accept" | "reject") => {
    if (!currentJobId) return;
    const categoryId = rowCategoryChoice[rowId];
    updateRowMutation.mutate({
      jobId: currentJobId,
      rowId,
      data:
        action === "reject"
          ? { reject: true }
          : { confirmNotDuplicate: true, ...(categoryId ? { categoryId } : {}) },
    });
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
            {activeSubTab
              ? `Sub-View: ${activeSubTab.replace("-", " ").toUpperCase()}`
              : "Import statements (CSV, Excel, PDF) with AI parsing, OCR, fuzzy duplicate detection & column mapping"}
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
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={documentType === "CAS_STATEMENT" || documentType === "MUTUAL_FUND_STATEMENT"}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Auto-detect / Portfolio Target --</option>
                {combinedAccounts.map((acc: Account) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.type === "CREDIT_CARD" ? "💳 " : "🏦 "}{acc.name} ({acc.type})
                  </option>
                ))}
              </select>
              {(documentType === "CAS_STATEMENT" || documentType === "MUTUAL_FUND_STATEMENT") && (
                <p className="mt-1 text-[10px] text-slate-500">
                  CAS/mutual-fund statements target a portfolio directly — no account needed.
                </p>
              )}
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
        </div>
      )}

      {/* Step 2: CSV Column Mapping */}
      {activeStep === "MAPPING" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Configure CSV Column Mapping</h3>
            <p className="text-xs text-slate-400">Map statement headers to standardized transaction properties.</p>
          </div>

          {suggestedMapping ? (
            <div
              className={`max-w-xl px-4 py-2.5 rounded-xl text-xs border ${
                suggestedMapping.confidence >= 0.8
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}
            >
              Auto-detected mapping at {(suggestedMapping.confidence * 100).toFixed(0)}% confidence — review
              before confirming.
            </div>
          ) : (
            <div className="max-w-xl px-4 py-2.5 rounded-xl text-xs border bg-slate-800/40 border-slate-700 text-slate-400">
              No header row detected — pick columns by zero-based index instead.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date Column</label>
              <ColumnPicker
                headers={suggestedMapping?.headers}
                value={mapping.transactionDate}
                onChange={(v) => setMapping({ ...mapping, transactionDate: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description Column</label>
              <ColumnPicker
                headers={suggestedMapping?.headers}
                value={mapping.description}
                onChange={(v) => setMapping({ ...mapping, description: v })}
              />
            </div>
          </div>

          <div className="max-w-xl">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={mapping.hasSeparateAmount}
                onChange={(e) => setMapping({ ...mapping, hasSeparateAmount: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950"
              />
              Statement has separate Withdrawal / Deposit columns
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {mapping.hasSeparateAmount ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Withdrawal (Debit) Column</label>
                  <ColumnPicker
                    headers={suggestedMapping?.headers}
                    value={mapping.withdrawal}
                    onChange={(v) => setMapping({ ...mapping, withdrawal: v })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deposit (Credit) Column</label>
                  <ColumnPicker
                    headers={suggestedMapping?.headers}
                    value={mapping.deposit}
                    onChange={(v) => setMapping({ ...mapping, deposit: v })}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Signed Amount Column</label>
                <ColumnPicker
                  headers={suggestedMapping?.headers}
                  value={mapping.amount}
                  onChange={(v) => setMapping({ ...mapping, amount: v })}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Balance Column (Optional)</label>
              <ColumnPicker
                headers={suggestedMapping?.headers}
                value={mapping.balance}
                onChange={(v) => setMapping({ ...mapping, balance: v })}
                allowNone
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleConfirmMapping}
              disabled={columnMappingMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
            >
              {columnMappingMutation.isPending ? "Confirming Mapping..." : "Confirm & Staging Preview"}
            </button>
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
                Job ID: <span className="font-mono text-slate-300">{currentJobId}</span> • {totalStagedCount ?? stagedRows.length} rows staged
              </p>
            </div>

            <div className="flex items-center gap-2">
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
          ) : (
            <div ref={stagedScrollRef} className="rounded-xl border border-slate-800 overflow-auto max-h-[560px] scrollbar-thin">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Type / Direction</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stagedRows.map((row) => {
                    const r = getRowDisplay(row);
                    const needsReview = row.status === "NEEDS_REVIEW";
                    return (
                    <tr key={row.id} className="hover:bg-slate-800/30">
                      <td className="p-3 text-xs text-slate-300 font-mono">{r.date || "—"}</td>
                      <td className="p-3 font-semibold text-slate-100">{r.description || "—"}</td>
                      <td className="p-3 text-xs font-bold text-emerald-400">{r.direction || "—"}</td>
                      <td className="p-3 font-bold text-slate-100">₹{r.amount || "0"}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {needsReview ? (
                          <select
                            value={rowCategoryChoice[row.id] || ""}
                            onChange={(e) =>
                              setRowCategoryChoice((prev) => ({ ...prev, [row.id]: e.target.value }))
                            }
                            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
                          >
                            <option value="">{r.categoryName}</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          r.categoryName
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            needsReview
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : row.status === "DUPLICATE"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.rejectionReason && (
                          <p className="mt-1 text-[10px] text-slate-500">{row.rejectionReason}</p>
                        )}
                      </td>
                      <td className="p-3">
                        {(needsReview || row.status === "DUPLICATE") && row.status !== "COMMITTED" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleResolveRow(row.id, "accept")}
                              disabled={updateRowMutation.isPending}
                              title="Accept / confirm not a duplicate"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleResolveRow(row.id, "reject")}
                              disabled={updateRowMutation.isPending}
                              title="Reject row"
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Queue: NEEDS_REVIEW rows across every import job. The
          review-queue response doesn't carry the parent import job id per
          row, so items are resolved from that job's own Staged Preview tab
          (open it via Import Job History below) rather than inline here. */}
      {activeStep === "QUEUE" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Manual Review Queue</h3>
            <p className="text-xs text-slate-400">
              Rows flagged low-confidence, ambiguous institution/account match, or ambiguous duplicate across all import jobs.
              Open the job's Staged Preview below to resolve an item.
            </p>
          </div>
          {reviewQueue.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Nothing needs review right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {reviewQueue.map((row) => {
                    const r = getRowDisplay(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono">{r.date || "—"}</td>
                        <td className="p-3 font-semibold text-slate-100">{r.description || "—"}</td>
                        <td className="p-3 font-bold text-slate-100">₹{r.amount || "0"}</td>
                        <td className="p-3">
                          {row.confidenceScore ? `${(Number(row.confidenceScore) * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Import History Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100">Import Job History</h3>
        {importJobs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No import jobs recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Rows</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-100">{job.fileName}</td>
                    <td className="p-3 text-slate-400">{job.sourceType}</td>
                    <td className="p-3 font-semibold text-slate-200">
                      {job.importedRows}/{job.totalRows}
                    </td>
                    <td className="p-3 text-slate-400">{job.createdAt}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {(job.status === "AWAITING_REVIEW" ||
                          job.status === "PARTIALLY_COMPLETED") && (
                          <button
                            onClick={() => {
                              setCurrentJobId(job.id);
                              setActiveStep("PREVIEW");
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold"
                          >
                            View
                          </button>
                        )}
                        {RETRYABLE_STATUSES.includes(job.status) && (
                          <button
                            onClick={() => retryMutation.mutate(job.id)}
                            disabled={retryMutation.isPending}
                            title="Re-attempt commit for remaining rows"
                            className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 disabled:opacity-40"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {ROLLBACKABLE_STATUSES.includes(job.status) && (
                          <button
                            onClick={() => rollbackMutation.mutate(job.id)}
                            disabled={rollbackMutation.isPending}
                            title="Undo every transaction this job created"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
