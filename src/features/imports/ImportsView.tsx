import React, { useState } from "react";
import { useImports, useReviewQueue, useCommitImport, useUploadImport } from "../../hooks/useFinanceQueries";
import { api } from "../../services/api";
import { ImportJob, ImportRowStaging } from "../../types";
import { UploadCloud, CheckCircle2, AlertTriangle, RefreshCw, FileText, ArrowRight, AlertCircle } from "lucide-react";

export const ImportsView: React.FC = () => {
  const { data: importJobs = [], isLoading, isError, error, refetch } = useImports();
  const { data: reviewQueue = [] } = useReviewQueue();
  const uploadMutation = useUploadImport();
  const commitMutation = useCommitImport();

  const [activeStep, setActiveStep] = useState<"UPLOAD" | "PREVIEW" | "QUEUE">("UPLOAD");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [stagedRows, setStagedRows] = useState<ImportRowStaging[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    uploadMutation.mutate(formData, {
      onSuccess: async (job: ImportJob) => {
        setCurrentJobId(job.id);
        setIsLoadingPreview(true);
        try {
          const preview = await api.getImportPreview(job.id);
          setStagedRows(preview.stagedRows || []);
          setActiveStep("PREVIEW");
        } catch {
          setStagedRows([]);
          setActiveStep("PREVIEW");
        } finally {
          setIsLoadingPreview(false);
        }
      },
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Ingestion & Import Pipeline</h2>
          <p className="text-xs text-slate-400">
            Import statements (CSV, Excel, PDF) with AI parsing, OCR, fuzzy duplicate detection & column mapping
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveStep("UPLOAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeStep === "UPLOAD" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Upload Wizard
          </button>
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
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">Drop your Bank or Credit Card Statement</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Supports HDFC, ICICI, SBI, Axis PDF statements, Zerodha/Groww CAS PDFs, Swiggy/Amazon CSVs, and Excel files.
            </p>
          </div>

          {/* File Picker Box */}
          <div className="max-w-xl mx-auto p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/40 hover:border-emerald-500/50 transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={handleFileDrop}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold text-sm">
                <FileText className="w-5 h-5" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">
                Click to browse or drag file here (<span className="text-emerald-400">PDF, CSV, XLSX</span>)
              </p>
            )}
          </div>

          {selectedFile && (
            <button
              onClick={handleUploadSubmit}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm mx-auto shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to Backend Pipeline...
                </>
              ) : (
                <>
                  Start Parsing Pipeline <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {uploadMutation.isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium max-w-md mx-auto flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{(uploadMutation.error as Error)?.message || "File upload failed."}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Staged Row Preview */}
      {activeStep === "PREVIEW" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Staged Row Mapping Preview</h3>
              <p className="text-xs text-slate-400">
                Job ID: {currentJobId} • {stagedRows.length} rows ready for atomic commit
              </p>
            </div>
            <button
              onClick={handleCommit}
              disabled={commitMutation.isPending || stagedRows.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              {commitMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Commit All Staged Rows
            </button>
          </div>

          {isLoadingPreview ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading staged row preview...</div>
          ) : stagedRows.length === 0 ? (
            <div className="p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              No staged rows available for preview.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stagedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/30">
                      <td className="p-3 text-xs">{row.normalizedData?.date || "—"}</td>
                      <td className="p-3 font-semibold text-slate-100">{row.normalizedData?.description || "—"}</td>
                      <td className="p-3 font-bold text-slate-100">₹{row.normalizedData?.amount || "0.00"}</td>
                      <td className="p-3 text-xs text-emerald-400 font-bold">
                        {Math.round((row.confidenceScore || 1) * 100)}%
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Queue Step */}
      {activeStep === "QUEUE" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Cross-Job Manual Review Queue</h3>
          <p className="text-xs text-slate-400">Low-confidence OCR or potential duplicates requiring human decision</p>

          {reviewQueue.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              No items currently pending review in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.map((stg: ImportRowStaging) => (
                <div key={stg.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{stg.normalizedData?.description}</p>
                      <p className="text-xs text-slate-400">
                        Date: {stg.normalizedData?.date} • Amount: ₹{stg.normalizedData?.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold">Confirm</button>
                    <button className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">Reject</button>
                  </div>
                </div>
              ))}
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
                <th className="p-4">Rows</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Imported At</th>
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
                importJobs.map((job: ImportJob) => (
                  <tr key={job.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      {job.fileName}
                    </td>
                    <td className="p-4 text-xs text-slate-400">{job.sourceType}</td>
                    <td className="p-4 text-xs font-medium text-slate-200">{job.totalRows} rows</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-xs text-slate-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
