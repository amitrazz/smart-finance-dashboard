import React, { useState, useEffect } from "react";
import { Wallet, AlertTriangle, RefreshCw } from "lucide-react";
import { useBudgets, useBudget } from "../hooks/useBudgetQueries";
import { formatCurrency } from "../../../utils/formatters";
import { EmptyState } from "../../../components/common/EmptyState";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

// There is no backend forecast endpoint for budgets (no time-series
// projection exists) — the closest real data is the per-budget summary
// (GET /finance/budgets/:id/summary), merged into useBudget(id). This view
// lets the user pick a budget and shows its real forecast-adjacent figures.
export const ForecastSubmenuView: React.FC = () => {
  const { data: budgets = [], isLoading: isLoadingBudgets, isError: isBudgetsError, refetch: refetchBudgets } = useBudgets();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("");
  const [budgetSearch, setBudgetSearch] = useState("");
  const { data: budgetSearchResults = [], isFetching: isBudgetSearchFetching } = useBudgets(
    budgetSearch ? { search: budgetSearch } : undefined
  );

  useEffect(() => {
    if (!selectedBudgetId && budgets.length > 0) {
      setSelectedBudgetId(budgets.find((b) => b.status === "ACTIVE")?.id ?? budgets[0].id);
    }
  }, [budgets, selectedBudgetId]);

  const { data: budget, isLoading, isError, error, refetch } = useBudget(selectedBudgetId);

  if (isLoadingBudgets) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isBudgetsError) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-100">Failed to Load Budgets</h3>
        <button
          onClick={() => refetchBudgets()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="No Budgets Yet"
        message="Create a budget to see its spending forecast here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Budget Selector */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Budget Forecast</h2>
          <p className="text-xs text-slate-400">Spend pace, safe daily spend, and projected month-end total for a single budget</p>
        </div>
        <div className="w-52">
          <AsyncSearchSelect
            value={selectedBudgetId}
            valueLabel={budgets.find((b) => b.id === selectedBudgetId)?.name}
            items={budgetSearchResults}
            isFetching={isBudgetSearchFetching}
            onSearch={setBudgetSearch}
            onSelect={(b) => setSelectedBudgetId(b.id)}
            getOptionKey={(b) => b.id}
            placeholder="Select budget"
            emptyMessage="No matching budgets"
            renderOption={(b) => <span className="truncate">{b.name}</span>}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-xl font-extrabold text-slate-100">Failed to Load Forecast</h3>
          <p className="text-xs text-slate-400">{(error as Error)?.message || "Could not retrieve this budget's summary."}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : !budget ? (
        <EmptyState title="No Forecast Data" message="Summary data isn't available for this budget yet." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Spent</p>
            <p className="text-base font-extrabold text-amber-400">{budget.totalSpent ? formatCurrency(budget.totalSpent) : "—"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Remaining</p>
            <p className="text-base font-extrabold text-emerald-400">{budget.remainingAmount ? formatCurrency(budget.remainingAmount) : "—"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Utilization</p>
            <p className="text-base font-extrabold text-indigo-400">{budget.utilizationPercent != null ? `${budget.utilizationPercent}%` : "—"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Safe Daily Spend</p>
            <p className="text-base font-extrabold text-cyan-400">{budget.safeDailySpend ? `${formatCurrency(budget.safeDailySpend)}/d` : "—"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Forecast Month-End</p>
            <p className="text-base font-extrabold text-purple-400">{budget.forecastMonthEndSpend ? formatCurrency(budget.forecastMonthEndSpend) : "—"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Health</p>
            <p className="text-base font-extrabold text-slate-100">
              {budget.budgetHealthScore != null ? `${budget.budgetHealthScore}/100` : "—"}
              {budget.budgetHealthGrade ? ` · ${budget.budgetHealthGrade}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastSubmenuView;
