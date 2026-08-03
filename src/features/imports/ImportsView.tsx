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
  useConfirmColumnMapping,
  useImportPreviewInfinite,
} from "../../hooks/useFinanceQueries";
import { ImportJob, ImportRowStaging, Account } from "../../types";

type StagedRowDisplay = ImportRowStaging & {
  transactionDate?: string;
  description?: string;
  direction?: string;
  amount?: string | number;
  categoryName?: string;
};
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  ArrowRight,
} from "lucide-react";

export const ImportsView: React.FC = () => {
  const { activeSubTab } = useUIStore();
  const { data: importJobs = [], isLoading, isError, error, refetch } = useImports();
  const { data: reviewQueue = [] } = useReviewQueue();
  const { data: accounts = [] } = useAccounts();
  const { data: creditCards = [] } = useCreditCards();

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

  const [activeStep, setActiveStep] = useState<"UPLOAD" | "MAPPING" | "PREVIEW" | "QUEUE">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("BANK_STATEMENT");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

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
    withdrawal: 3,
    deposit: 4,
    hasSeparateAmount: true,
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
        onSuccess: () => {
          setActiveStep("PREVIEW");
        },
      }
    );
  };

  // Row action helper

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
        </div>
      )}

      {/* Step 2: CSV Column Mapping */}
      {activeStep === "MAPPING" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-100">Configure CSV Column Mapping</h3>
            <p className="text-xs text-slate-400">Map statement headers to standardized transaction properties.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date Column Index</label>
              <input
                type="number"
                value={mapping.transactionDate}
                onChange={(e) => setMapping({ ...mapping, transactionDate: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description Column Index</label>
              <input
                type="number"
                value={mapping.description}
                onChange={(e) => setMapping({ ...mapping, description: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stagedRows.map((row) => {
                    const r = row as StagedRowDisplay;
                    return (
                    <tr key={row.id} className="hover:bg-slate-800/30">
                      <td className="p-3 text-xs text-slate-300 font-mono">{r.transactionDate || "—"}</td>
                      <td className="p-3 font-semibold text-slate-100">{r.description || "—"}</td>
                      <td className="p-3 text-xs font-bold text-emerald-400">{r.direction || "INFLOW"}</td>
                      <td className="p-3 font-bold text-slate-100">₹{r.amount || "0"}</td>
                      <td className="p-3 text-xs text-slate-400">{r.categoryName || "General"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                  <th className="p-3">Type</th>
                  <th className="p-3">Rows</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-100">{job.fileName}</td>
                    <td className="p-3 text-slate-400">{job.documentType}</td>
                    <td className="p-3 font-semibold text-slate-200">{job.parsedRowCount || job.totalRows || 0}</td>
                    <td className="p-3 text-slate-400">{job.createdAt}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {job.status}
                      </span>
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
