import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUp, AlertTriangle, RefreshCw, Layers, Wallet, Zap, Activity } from "lucide-react";
import { useBudgetAnalytics, useBudgets } from "../hooks/useBudgetQueries";
import { formatCurrency } from "../../../utils/formatters";
import { EmptyState } from "../../../components/common/EmptyState";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

const TREND_LABELS: Record<string, string> = {
  ACCELERATING: "Accelerating",
  STEADY: "Steady",
  DECELERATING: "Decelerating",
};

// Analytics is per-budget only — there is no cross-budget aggregate route.
export const AnalyticsSubmenuView: React.FC = () => {
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

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);
  const { data, isLoading, isError, error, refetch } = useBudgetAnalytics(selectedBudgetId, selectedBudget?.currency);

  if (isLoadingBudgets) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
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
        message="Create a budget to see its analytics here."
      />
    );
  }

  const BudgetSelector = (
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
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-100">Failed to Load Analytics</h3>
        <p className="text-xs text-slate-400">
          {(error as Error)?.message || "Could not retrieve budget analytics."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="No Analytics Data" message="Budget analytics will appear here once spending history is available." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Budget Analytics & Variance</h2>
          <p className="text-xs text-slate-400">Spend pace, category breakdown, and forecast for the current period</p>
        </div>
        {BudgetSelector}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Spend</p>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(data.dailySpend)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">This Week</p>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(data.weeklySpend)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Last 30 Days</p>
          <p className="text-base font-extrabold text-slate-100">{formatCurrency(data.monthlySpend)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Rolling Avg / Day</p>
          <p className="text-base font-extrabold text-cyan-400">{formatCurrency(data.rollingAverageDailySpend)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Activity className="w-3 h-3" /> Trend</p>
          <p className="text-base font-extrabold text-slate-100">{TREND_LABELS[data.trend] ?? data.trend}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Variance vs Pace</p>
          <p className={`text-base font-extrabold ${parseFloat(data.variance.amount) > 0 ? "text-rose-400" : "text-emerald-400"}`}>{formatCurrency(data.variance)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Zap className="w-3 h-3" /> Forecast Month-End</p>
          <p className="text-base font-extrabold text-purple-400">{formatCurrency(data.forecastExpectedMonthEndSpend)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Forecast Confidence</p>
          <p className="text-base font-extrabold text-slate-100">{data.forecastConfidence}%</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Category Breakdown (Allocated vs Spent)
        </h3>
        {data.categoryBreakdown.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-slate-500">No category allocations on this budget.</div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryBreakdown.map((c) => ({
                categoryName: c.categoryName ?? "Category",
                allocated: parseFloat(c.allocatedAmount.amount) || 0,
                spent: parseFloat(c.spentAmount.amount) || 0,
              }))}>
                <XAxis dataKey="categoryName" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }} />
                <Bar dataKey="allocated" fill="#334155" radius={[4, 4, 0, 0]} name="Allocated" />
                <Bar dataKey="spent" fill="#10b981" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Largest Expenses Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-rose-400" /> Largest Expenses This Period
        </h3>
        {data.largestExpenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No expenses recorded this period yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {data.largestExpenses.map((exp) => (
                  <tr key={exp.transactionId}>
                    <td className="py-3 px-4 font-bold text-slate-100">{exp.description}</td>
                    <td className="py-3 px-4 text-slate-400">{exp.categoryName ?? "Uncategorized"}</td>
                    <td className="py-3 px-4 text-slate-400">{exp.date}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">{formatCurrency(exp.amount)}</td>
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
