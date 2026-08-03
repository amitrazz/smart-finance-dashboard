import React from "react";
import { Download, RefreshCw, Landmark } from "lucide-react";

interface InsightsAnalyticsToolbarProps {
  onExportPdf?: () => void;
  onRefresh?: () => void;
}

export const InsightsAnalyticsToolbar: React.FC<InsightsAnalyticsToolbarProps> = ({
  onExportPdf,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Account & currency filtering isn't wired into any submodule query yet, so
            these are shown disabled rather than silently accepting a selection that
            changes nothing on screen. */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-600 cursor-not-allowed"
          title="Per-account filtering isn't available yet"
        >
          <Landmark className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-bold">All Accounts & Cards</span>
        </div>

        <div
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-600 cursor-not-allowed"
          title="Currency filtering isn't available yet"
        >
          <span className="font-bold">Currency: INR (₹)</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Export Action */}
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        )}

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh Analytics Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
