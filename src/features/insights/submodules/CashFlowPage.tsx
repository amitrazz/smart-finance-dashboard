import React from "react";
import { useCashFlowAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { formatCurrency } from "../../../utils/formatters";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { DollarSign, ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";

export const CashFlowPage: React.FC = () => {
  const { data: cashFlow, isLoading } = useCashFlowAnalytics();

  if (isLoading || !cashFlow) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Cash Flow & Savings Run Rate"
        description="Monitor monthly net cash surplus, savings rates, income vs expenditure trends"
      />

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Income Outflow"
          value={cashFlow.totalIncomeThisMonth}
          icon={<ArrowDownLeft className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Monthly Expenditures"
          value={cashFlow.totalExpensesThisMonth}
          icon={<ArrowUpRight className="w-6 h-6 text-rose-400" />}
          accentColor="rose"
        />

        <MetricCard
          title="Net Cash Surplus"
          value={cashFlow.netCashFlowThisMonth}
          subtitle={`Forecast Next Month: ${formatCurrency(cashFlow.forecastNextMonth)}`}
          icon={<DollarSign className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Monthly Savings Rate"
          value={`${cashFlow.savingsRatePercent.toFixed(1)}%`}
          subtitle="Target: ≥ 30% of Income"
          icon={<PiggyBank className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />
      </div>

      {/* Bar Chart Visualizer */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Income vs Expense Stream</h3>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow.history} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              <Bar dataKey="income" name="Monthly Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Monthly Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
