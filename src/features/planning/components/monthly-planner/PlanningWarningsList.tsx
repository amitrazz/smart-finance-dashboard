import React from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";
import { MonthlyPlanningWarning, PlanningWarningCode } from "../../../../types";
import { SeverityBadge } from "./SeverityBadge";

interface PlanningWarningsListProps {
  warnings: MonthlyPlanningWarning[];
  onSelectBudget: (budgetId: string) => void;
  onSelectGoal: (goalId: string) => void;
}

const BUDGET_CODES: PlanningWarningCode[] = ["BUDGET_OVERALLOCATION", "BUDGET_OVERRUN_RISK"];

/** Spec §13 — deterministic, backend-computed warnings only; never styled as system errors unless they are one. Clicking a warning with a relatedEntityId navigates to the relevant area. */
export const PlanningWarningsList: React.FC<PlanningWarningsListProps> = ({
  warnings,
  onSelectBudget,
  onSelectGoal,
}) => {
  if (warnings.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-emerald-500/20 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
        <p className="text-sm text-slate-300">No planning warnings this month.</p>
      </div>
    );
  }

  const handleClick = (warning: MonthlyPlanningWarning) => {
    if (!warning.relatedEntityId) return;
    if (BUDGET_CODES.includes(warning.code)) {
      onSelectBudget(warning.relatedEntityId);
    } else if (warning.code === "GOAL_UNDERFUNDED") {
      onSelectGoal(warning.relatedEntityId);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
      <h3 className="text-sm font-bold text-slate-100">Planning Warnings</h3>
      <ul className="space-y-2">
        {warnings.map((warning, i) => {
          const isNavigable = Boolean(warning.relatedEntityId) && (BUDGET_CODES.includes(warning.code) || warning.code === "GOAL_UNDERFUNDED");
          const content = (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <SeverityBadge severity={warning.severity} size="sm" />
                <span className="text-sm font-semibold text-slate-100 truncate">{warning.title}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{warning.message}</p>
              {warning.amount && (
                <p className="text-xs text-slate-500 mt-1">Amount: {formatCurrency(warning.amount)}</p>
              )}
            </>
          );

          return (
            <li key={`${warning.code}-${i}`}>
              {isNavigable ? (
                <button
                  onClick={() => handleClick(warning)}
                  className="w-full flex items-start justify-between gap-2 text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  <div className="min-w-0 flex-1">{content}</div>
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" aria-hidden="true" />
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlanningWarningsList;
