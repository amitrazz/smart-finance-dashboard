import React from "react";
import { Printer, Download } from "lucide-react";

interface ReportActionsProps {
  onExportCsv?: () => void;
}

export const ReportActions: React.FC<ReportActionsProps> = ({ onExportCsv }) => (
  <div className="no-print flex items-center gap-2">
    {onExportCsv && (
      <button
        onClick={onExportCsv}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
      >
        <Download className="w-3.5 h-3.5" /> Export CSV
      </button>
    )}
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
    >
      <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
    </button>
  </div>
);

export default ReportActions;
