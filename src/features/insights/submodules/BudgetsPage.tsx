import React from "react";
import { useBudgetAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { formatCurrency } from "../../../utils/formatters";
import { PiggyBank, CheckCircle2 } from "lucide-react";

export const BudgetsPage: React.FC = () => {
  const { data: budgets, isLoading } = useBudgetAnalytics();

  if (isLoading || !budgets) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Budget Discipline & Category Health"
        description="Monitor category allocations, remaining budgets, end-of-month forecasts, and historical discipline"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Budget Allocated"
          value={budgets.totalBudgeted}
          subtitle={`Spent: ${formatCurrency(budgets.totalSpent)}`}
          icon={<PiggyBank className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Overall Budget Utilization"
          value={`${budgets.overallPercentUsed.toFixed(1)}%`}
          subtitle="96.2% of monthly limit"
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Historical Budget Discipline"
          value={`${budgets.successHistoryPercent}%`}
          subtitle="Months staying under budget"
          icon={<AwardIcon />}
          accentColor="purple"
        />
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Active Budget Category Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgets.budgets.map((b) => (
            <div key={b.budgetId} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-xs">{b.categoryName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.status === "EXCEEDED" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {b.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400">Spent: <strong className="text-slate-100 font-mono">{formatCurrency(b.spentAmount)}</strong></span>
                <span className="text-slate-400">Limit: <strong className="text-slate-100 font-mono">{formatCurrency(b.allocatedAmount)}</strong></span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${b.percentUsed > 100 ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(100, b.percentUsed)}%` }} />
              </div>

              <p className="text-[11px] text-slate-400">{b.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AwardIcon = () => (
  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
