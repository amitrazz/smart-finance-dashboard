import React from "react";

import { AccountStatementItem } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { StatusBadge } from "./StatusBadge";
import { FileText, Download, Clock } from "lucide-react";

interface StatementTimelineProps {
  statements: AccountStatementItem[];
}

export const StatementTimeline: React.FC<StatementTimelineProps> = ({ statements }) => {
  return (
    <div className="space-y-4">
      {statements.map((stmt) => (
        <div
          key={stmt.id}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-100 text-sm">{stmt.accountName}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  {stmt.type}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Period: {formatDate(stmt.periodStart)} – {formatDate(stmt.periodEnd)}</span>
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 gap-2">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Closing Balance</span>
              <span className="font-bold text-slate-100 text-sm">
                {formatCurrency(parseFloat(stmt.closingBalance?.amount || "0"), stmt.closingBalance?.currency || "INR")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={stmt.status} size="sm" />
              {stmt.downloadUrl && (
                <a
                  href={stmt.downloadUrl}
                  download
                  className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
