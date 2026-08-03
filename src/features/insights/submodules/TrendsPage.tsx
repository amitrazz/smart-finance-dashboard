import React from "react";
import { useTrendAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

export const TrendsPage: React.FC = () => {
  const { data: trends, isLoading } = useTrendAnalytics();

  if (isLoading || !trends) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Multi-Period Financial Trends & Seasonality"
        description="Weekly, monthly, quarterly moving averages, net worth momentum, and spend acceleration"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          title="Accelerating Stream"
          value={trends.accelerationCategory}
          subtitle="Positive wealth momentum"
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Decelerating Stream"
          value={trends.decelerationCategory}
          subtitle="Expense control improvement"
          icon={<TrendingDown className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" /> Moving Average & Momentum Trends
        </h3>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="incomeTrend" name="Income Stream" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="expenseTrend" name="Expense Outflow" stroke="#f43f5e" strokeWidth={2} />
              <Line type="monotone" dataKey="movingAverage3M" name="3M Moving Average Surplus" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
