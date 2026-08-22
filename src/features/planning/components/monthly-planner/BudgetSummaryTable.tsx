import React from "react";
import { StatusBadge, StatusType } from "../../../../components/ui/StatusBadge";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency } from "../../../../utils/formatters";
import { MonthlyBudgetIntegration, MonthlyBudgetLine } from "../../../../types";

interface BudgetSummaryTableProps {
  budget: MonthlyBudgetIntegration;
  onSelectBudget: (budgetId: string) => void;
  onCreateBudget: () => void;
}

/**
 * `status` ("EXCEEDED"/"WITHIN_BUDGET") is the backend's own authoritative
 * classification — used directly, never re-derived from utilizationPercent.
 * "On Pace to Overrun" (forecast-based, from `projectedOverspend`, the same
 * signal behind the BUDGET_OVERRUN_RISK warning) and "Watch" (a >=80%
 * presentation threshold, not a financial calculation) are UI-tier labels
 * layered on top of already-authoritative numbers, not a second financial
 * determination competing with `status`.
 */
function statusForLine(line: MonthlyBudgetLine): { badge: StatusType; label: string } {
  if (line.periodStatus === "PROJECTED_ONLY") return { badge: "draft", label: "Projected" };
  if (line.status === "EXCEEDED") return { badge: "failed", label: "Exceeded" };
  if (line.projectedOverspend && parseFloat(line.projectedOverspend.amount) > 0) {
    return { badge: "pending", label: "On Pace to Overrun" };
  }
  if ((line.utilizationPercent ?? 0) >= 80) return { badge: "pending", label: "Watch" };
  return { badge: "completed", label: "Healthy" };
}

/**
 * Spec §10/§11 — reuses the composed plan's per-budget rows only (the
 * response has no category-level breakdown); category detail lives one
 * click away on the existing Budgets page, which already owns that UI and
 * its calculations — never duplicated here.
 */
export const BudgetSummaryTable: React.FC<BudgetSummaryTableProps> = ({ budget, onSelectBudget, onCreateBudget }) => {
  const lines = budget.budgets;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-100">Budget</h3>
        <div className="text-xs text-slate-400">
          Allocated <span className="font-semibold text-slate-200">{formatCurrency(budget.allocated)}</span>
          {budget.actual && (
            <>
              {" · "}Spent <span className="font-semibold text-slate-200">{formatCurrency(budget.actual)}</span>
            </>
          )}
          {budget.overrun && parseFloat(budget.overrun.amount) > 0 && (
            <>
              {" · "}Over by <span className="font-semibold text-rose-400">{formatCurrency(budget.overrun)}</span>
            </>
          )}
        </div>
      </div>

      {lines.length === 0 ? (
        <EmptyState
          title="No Budget Has Been Created for This Month"
          message="Create a budget to track category spending against a plan."
          actionLabel="Create Budget"
          onAction={onCreateBudget}
        />
      ) : (
        <>
          <div className="hidden sm:block rounded-2xl border border-slate-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-950/40">
                  <th scope="col" className="py-2.5 px-4">Budget</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Allocated</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Actual</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Remaining</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Overrun</th>
                  <th scope="col" className="py-2.5 px-4 text-right">Utilization</th>
                  <th scope="col" className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lines.map((line) => {
                  const status = statusForLine(line);
                  const overrunAmount = line.overrun ? parseFloat(line.overrun.amount) : 0;
                  return (
                    <tr key={line.budgetId} className="hover:bg-slate-800/30 focus-within:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectBudget(line.budgetId)}
                          className="font-semibold text-slate-100 hover:text-emerald-400 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded"
                        >
                          {line.name}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(line.allocated)}</td>
                      <td className="py-3 px-4 text-right text-slate-200">{line.actual ? formatCurrency(line.actual) : "—"}</td>
                      <td className="py-3 px-4 text-right text-slate-200">{line.remaining ? formatCurrency(line.remaining) : "—"}</td>
                      <td className={`py-3 px-4 text-right ${overrunAmount > 0 ? "text-rose-400 font-semibold" : "text-slate-500"}`}>
                        {overrunAmount > 0 ? formatCurrency(line.overrun!) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200">
                        {line.utilizationPercent !== undefined ? `${line.utilizationPercent}%` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={status.badge} label={status.label} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-2">
            {lines.map((line) => {
              const status = statusForLine(line);
              return (
                <button
                  key={line.budgetId}
                  onClick={() => onSelectBudget(line.budgetId)}
                  className="w-full text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-100 text-sm truncate">{line.name}</span>
                    <StatusBadge status={status.badge} label={status.label} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {line.actual ? formatCurrency(line.actual) : "—"} of {formatCurrency(line.allocated)}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {line.utilizationPercent !== undefined ? `${line.utilizationPercent}%` : "—"}
                    </span>
                  </div>
                  {line.overrun && parseFloat(line.overrun.amount) > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Overrun</span>
                      <span className="font-semibold text-rose-400">{formatCurrency(line.overrun)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetSummaryTable;
