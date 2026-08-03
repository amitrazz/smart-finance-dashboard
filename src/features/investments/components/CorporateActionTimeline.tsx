import React, { useState } from "react";
import { CorporateAction } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";
import { Calendar, DollarSign, Split, Award } from "lucide-react";

interface CorporateActionTimelineProps {
  actions: CorporateAction[];
}

export const CorporateActionTimeline: React.FC<CorporateActionTimelineProps> = ({ actions }) => {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED">("ALL");

  const filteredActions = actions.filter((a) => {
    if (statusFilter === "UPCOMING") return a.status === "UPCOMING" || a.status === "ANNOUNCED";
    if (statusFilter === "COMPLETED") return a.status === "COMPLETED";
    return true;
  });

  const getIcon = (type: CorporateAction["actionType"]) => {
    switch (type) {
      case "DIVIDEND":
      case "SGB_INTEREST":
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case "SPLIT":
      case "BONUS":
        return <Split className="w-4 h-4 text-indigo-400" />;
      case "FD_MATURITY":
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <Calendar className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Corporate Actions & Payout Timeline
          </h3>
          <p className="text-xs text-slate-400">
            Track dividends, stock splits, bonus issues, and FD maturities
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(["ALL", "UPCOMING", "COMPLETED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filteredActions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No corporate actions found.</p>
        ) : (
          filteredActions.map((action) => {
            const isCompleted = action.status === "COMPLETED";
            return (
              <div key={action.id} className="relative group">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[30px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isCompleted
                      ? "bg-slate-950 border-emerald-500 text-emerald-400"
                      : "bg-slate-950 border-indigo-500 text-indigo-400"
                  }`}
                >
                  {getIcon(action.actionType)}
                </div>

                {/* Content Card */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{action.securityName}</span>
                      <span className="text-xs font-mono text-slate-400">({action.symbol})</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}
                    >
                      {action.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{action.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <span>
                        Date: <strong className="text-slate-200">{action.executionDate}</strong>
                      </span>
                      {action.ratioOrRate && (
                        <span>
                          Rate: <strong className="text-indigo-400">{action.ratioOrRate}</strong>
                        </span>
                      )}
                    </div>

                    {(action.estimatedAmount || action.finalAmount) && (
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {formatCurrency(action.finalAmount || action.estimatedAmount!)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
