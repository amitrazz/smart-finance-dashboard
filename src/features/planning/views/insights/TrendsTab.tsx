import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useGoalAnalytics, useGoals, useBudgetAnalytics, useBudgets } from "../../../../hooks/useFinanceQueries";
import { AnalyticsChart } from "../../../../components/planning/AnalyticsChart";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency } from "../../../../utils/formatters";
import { AsyncSearchSelect } from "../../../../components/common/AsyncSearchSelect";

const TREND_LABELS: Record<string, string> = {
  ACCELERATING: "Accelerating",
  STEADY: "Steady",
  DECELERATING: "Decelerating",
};

// Both goal and budget analytics are per-entity only — there is no
// cross-entity aggregate trend endpoint on the backend. This tab defaults to
// the first active goal/budget and lets the user switch. Budget analytics
// has no time-series data (no utilization/health-trend history) — the
// category breakdown and current-period spend figures are the real data.
export const TrendsTab: React.FC = () => {
  const { data: goals = [] } = useGoals();
  const { data: budgets = [] } = useBudgets();
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [goalSearch, setGoalSearch] = useState("");
  const { data: goalSearchResults = [], isFetching: isGoalSearchFetching } = useGoals(
    goalSearch ? { search: goalSearch } : undefined
  );
  const [budgetSearch, setBudgetSearch] = useState("");
  const { data: budgetSearchResults = [], isFetching: isBudgetSearchFetching } = useBudgets(
    budgetSearch ? { search: budgetSearch } : undefined
  );

  useEffect(() => {
    if (!selectedGoalId && goals.length > 0) {
      setSelectedGoalId(goals.find((g) => g.status === "ACTIVE")?.id ?? goals[0].id);
    }
  }, [goals, selectedGoalId]);

  useEffect(() => {
    if (!selectedBudgetId && budgets.length > 0) {
      setSelectedBudgetId(budgets.find((b) => b.status === "ACTIVE")?.id ?? budgets[0].id);
    }
  }, [budgets, selectedBudgetId]);

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);
  const { data: goalAnalytics, isLoading: goalLoading, isError: goalErrored, refetch: refetchGoalAnalytics } = useGoalAnalytics(selectedGoalId);
  const { data: budgetAnalytics, isLoading: budgetLoading, isError: budgetErrored, refetch: refetchBudgetAnalytics } = useBudgetAnalytics(selectedBudgetId, selectedBudget?.currency);

  const corpusData = useMemo(
    () => (goalAnalytics?.corpusGrowth ?? []).map((p) => ({ date: p.date, corpus: parseFloat(p.corpusValue?.amount ?? "0") || 0 })),
    [goalAnalytics]
  );

  const categoryBreakdownData = useMemo(
    () => (budgetAnalytics?.categoryBreakdown ?? []).map((c) => ({
      categoryName: c.categoryName ?? "Category",
      allocated: parseFloat(c.allocatedAmount.amount) || 0,
      spent: parseFloat(c.spentAmount.amount) || 0,
    })),
    [budgetAnalytics]
  );

  if ((selectedGoalId && goalLoading) || (selectedBudgetId && budgetLoading)) return <LoadingSkeleton type="chart" />;

  if (goalErrored || budgetErrored) {
    return (
      <ErrorState
        title="Failed to Load Trends"
        message="We couldn't load goal or budget trend data."
        onRetry={() => {
          if (goalErrored) refetchGoalAnalytics();
          if (budgetErrored) refetchBudgetAnalytics();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-100">Goal Corpus Growth</h3>
          {goals.length > 0 && (
            <div className="w-48">
              <AsyncSearchSelect
                value={selectedGoalId}
                valueLabel={goals.find((g) => g.id === selectedGoalId)?.name}
                items={goalSearchResults}
                isFetching={isGoalSearchFetching}
                onSearch={setGoalSearch}
                onSelect={(g) => setSelectedGoalId(g.id)}
                getOptionKey={(g) => g.id}
                placeholder="Select goal"
                emptyMessage="No matching goals"
                renderOption={(g) => <span className="truncate">{g.name}</span>}
              />
            </div>
          )}
        </div>
        <AnalyticsChart
          type="area"
          data={corpusData}
          xKey="date"
          series={[{ key: "corpus", label: "Corpus", color: "#10b981" }]}
          formatValue={(v) => formatCurrency(v)}
          emptyMessage="No corpus growth history available yet."
        />
      </div>
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-100">Budget Category Breakdown</h3>
          {budgets.length > 0 && (
            <div className="w-48">
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
          )}
        </div>
        {budgetAnalytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-bold">This Week</p>
              <p className="text-sm font-extrabold text-slate-100">{formatCurrency(budgetAnalytics.weeklySpend)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Last 30 Days</p>
              <p className="text-sm font-extrabold text-slate-100">{formatCurrency(budgetAnalytics.monthlySpend)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Rolling Avg / Day</p>
              <p className="text-sm font-extrabold text-cyan-400">{formatCurrency(budgetAnalytics.rollingAverageDailySpend)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Trend</p>
              <p className="text-sm font-extrabold text-slate-100">{TREND_LABELS[budgetAnalytics.trend] ?? budgetAnalytics.trend}</p>
            </div>
          </div>
        )}
        {categoryBreakdownData.length === 0 ? (
          <EmptyState title="No Category Data" message="This budget has no category allocations yet." />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdownData}>
                <XAxis dataKey="categoryName" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: 11 }} />
                <Bar dataKey="allocated" fill="#334155" radius={[4, 4, 0, 0]} name="Allocated" />
                <Bar dataKey="spent" fill="#10b981" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsTab;
