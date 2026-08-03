import React, { useMemo } from "react";
import { useImports } from "../../../hooks/useFinanceQueries";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { useUIStore } from "../../../store/useUIStore";
import { UploadCloud, ArrowRight } from "lucide-react";

const INVESTMENT_DOCUMENT_TYPES = new Set(["CAS_STATEMENT", "MUTUAL_FUND_STATEMENT"]);

// This module does not reimplement the upload → column-mapping → preview →
// commit pipeline — that already exists, real and working, at the app-level
// Imports feature (#/imports), which already supports CAS_STATEMENT and
// MUTUAL_FUND_STATEMENT document types. This view just surfaces the user's
// investment-related import jobs and hands off to that pipeline.
export const ImportView: React.FC = () => {
  const { data: jobs = [], isLoading, isError, refetch } = useImports();
  const { navigateToRoute } = useUIStore();

  const investmentJobs = useMemo(
    () => jobs.filter((j) => INVESTMENT_DOCUMENT_TYPES.has(j.documentType || "")),
    [jobs]
  );

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 text-center space-y-4 backdrop-blur-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">CAS / Mutual Fund Statement Import</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Upload a Consolidated Account Statement or mutual-fund statement PDF to automatically extract and
            record trades. No accountId needed — this creates trades directly on your portfolio.
          </p>
        </div>
        <button
          onClick={() => navigateToRoute("imports")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <UploadCloud className="w-4 h-4" /> Go to Import Pipeline <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Investment-related job history */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100">Investment Import History</h3>
        {isLoading ? (
          <div className="h-24 bg-slate-950 rounded-2xl animate-pulse" />
        ) : isError ? (
          <ErrorState title="Failed to load import jobs" onRetry={refetch} />
        ) : investmentJobs.length === 0 ? (
          <EmptyState
            title="No Investment Imports Yet"
            message="CAS and mutual-fund statement uploads will be listed here once you run one."
          />
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
                {investmentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-100">{job.fileName}</td>
                    <td className="p-3 text-slate-400">{job.documentType}</td>
                    <td className="p-3 font-semibold text-slate-200">{job.importedRows}/{job.totalRows}</td>
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
