import React from "react";
import { useCashFlow, useNetWorthHistory } from "../../hooks/useFinanceQueries";
import { formatCurrency, formatPercent } from "../../utils/formatters";
import { Money } from "../../types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const AnalyticsView: React.FC = () => {
  const { data: cashFlow, isLoading: loadingCashFlow, isError: isErrorCashFlow, error: errCashFlow, refetch: refetchCashFlow } = useCashFlow();
  const { data: netWorthHistory = [] } = useNetWorthHistory();

  if (loadingCashFlow) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
        </div>
        <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isErrorCashFlow || !cashFlow) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Analytics</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(errCashFlow as Error)?.message || "Could not retrieve cash flow analytics."}
        </p>
        <button
          onClick={() => refetchCashFlow()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Derive trend series from historical snapshots if available
  const monthlyTrendData = netWorthHistory.length > 0
    ? netWorthHistory.map((h) => ({
        month: new Date(h.date).toLocaleDateString("en-IN", { month: "short" }),
        Income: parseFloat(cashFlow.totalIncome?.amount || "0"),
        Expense: parseFloat(cashFlow.totalExpense?.amount || "0"),
        Savings: parseFloat(cashFlow.netSavings?.amount || "0"),
      }))
    : [
        {
          month: cashFlow.period || "Current",
          Income: parseFloat(cashFlow.totalIncome?.amount || "0"),
          Expense: parseFloat(cashFlow.totalExpense?.amount || "0"),
          Savings: parseFloat(cashFlow.netSavings?.amount || "0"),
        },
      ];

  const categoryBreakdown = cashFlow.categoryBreakdown || [];

  const pieData = categoryBreakdown.map((c: { categoryName: string; amount?: { amount: string } }, idx: number) => ({
    name: c.categoryName,
    value: parseFloat(c.amount?.amount || "0"),
    color: ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"][idx % 6],
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Financial Analytics & Cash Flow Trends</h2>
        <p className="text-xs text-slate-400">Precomputed snapshot analytics over cash flow, income vs expenses, and category trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Income</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{formatCurrency(cashFlow.totalIncome)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Total Expenses</p>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{formatCurrency(cashFlow.totalExpense)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs font-semibold text-slate-400">Net Savings Surplus</p>
          <p className="text-2xl font-extrabold text-teal-400 mt-1">{formatCurrency(cashFlow.netSavings)}</p>
          <p className="text-xs text-teal-400 font-semibold">{formatPercent(cashFlow.savingsRate)} Savings Rate</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-100">Income vs Expense Trend</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendData}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <h3 className="font-bold text-base text-slate-100">Category Spend Distribution</h3>
          <div className="h-56 w-full my-2">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No category breakdown available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                    {pieData.map((entry: { name: string; value: number; color: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="font-bold text-base text-slate-100">Top Spend Categories</h3>
          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No categories recorded.</p>
            ) : (
              categoryBreakdown.map((cat: { categoryId: string; categoryName: string; amount: Money; percentage: number }) => (
                <div key={cat.categoryId} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-sm">{cat.categoryName}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-100 text-sm">{formatCurrency(cat.amount)}</span>
                    <p className="text-xs text-slate-400">{cat.percentage}% of total</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
