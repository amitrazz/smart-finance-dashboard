import React from "react";
import { PiggyBank, LineChart } from "lucide-react";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency } from "../../../../utils/formatters";
import { MonthlyInvestments, MonthlySavings } from "../../../../types";

interface SavingsInvestmentsPanelProps {
  savings: MonthlySavings;
  investments: MonthlyInvestments;
  onSelectGoal: (goalId: string) => void;
}

/** Spec §12 — cash savings and investment contributions are shown as two clearly separate plans (each Planned/Actual/Remaining), never folded into "expenses" or into each other. Debt principal reduction is its own section (DebtCommitmentsPanel), not repeated here. */
export const SavingsInvestmentsPanel: React.FC<SavingsInvestmentsPanelProps> = ({
  savings,
  investments,
  onSelectGoal,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-400" aria-hidden="true" /> Savings Plan
          </h3>
          <span className="text-xs text-slate-400">
            {formatCurrency(savings.actual)} / {formatCurrency(savings.planned)}
          </span>
        </div>
        {savings.byGoal.length === 0 ? (
          <EmptyState title="No Goal Contributions Planned" message="Add a goal with a target date or minimum contribution to plan savings here." />
        ) : (
          <div className="space-y-2">
            {savings.byGoal.map((g) => {
              const remainingAmount = parseFloat(g.remaining.amount);
              return (
                <button
                  key={g.goalId}
                  onClick={() => onSelectGoal(g.goalId)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-left hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                >
                  <span className="text-sm font-semibold text-slate-100 truncate">{g.name}</span>
                  <span className="text-right shrink-0">
                    <span className="block text-xs text-slate-400">
                      {formatCurrency(g.actual)} / {formatCurrency(g.planned)}
                    </span>
                    {remainingAmount > 0 && (
                      <span className="block text-[11px] text-amber-400/80">{formatCurrency(g.remaining)} remaining</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-purple-400" aria-hidden="true" /> Investment Plan
          </h3>
          <span className="text-xs text-slate-400">
            {investments.actual ? formatCurrency(investments.actual) : "—"} / {formatCurrency(investments.planned)}
          </span>
        </div>
        {investments.bySipPlan.length === 0 ? (
          <EmptyState title="No SIPs Planned" message="Active SIP plans due this month will show up here." />
        ) : (
          <div className="space-y-2">
            {investments.bySipPlan.map((p) => (
              <div
                key={p.sipPlanId}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60"
              >
                <span className="text-sm font-semibold text-slate-100 truncate">Investment Plan</span>
                <span className="text-xs text-slate-400 shrink-0">{formatCurrency(p.planned)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-500">
          Actual investment execution against plan isn't tracked by the backend yet.
        </p>
      </div>
    </div>
  );
};

export default SavingsInvestmentsPanel;
