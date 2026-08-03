import React from "react";
import { useNetWorthAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { TimeHorizon } from "../types/insightsTypes";
import { formatCurrency } from "../../../utils/formatters";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Wallet, TrendingUp, Award, Layers } from "lucide-react";

interface NetWorthPageProps {
  horizon: TimeHorizon;
  onHorizonChange: (horizon: TimeHorizon) => void;
}

export const NetWorthPage: React.FC<NetWorthPageProps> = ({ horizon, onHorizonChange }) => {
  const { data: netWorth, isLoading } = useNetWorthAnalytics(horizon);

  if (isLoading || !netWorth) return null;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value?: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-2 text-xs">
          <p className="font-bold text-slate-200">{label}</p>
          <div className="space-y-1 font-semibold">
            <p className="text-emerald-400 flex items-center justify-between gap-4">
              <span>Net Worth:</span>
              <span>{formatCurrency({ amount: payload[0]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Net Worth & Wealth Growth"
        description="Historical wealth trajectory, growth drivers, asset allocations, and debt liabilities"
        horizon={horizon}
        onHorizonChange={onHorizonChange}
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Current Total Net Worth"
          value={netWorth.currentNetWorth}
          deltaPercent={netWorth.monthlyChangePercent}
          deltaLabel="vs last month"
          icon={<Wallet className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Monthly Surplus Net Addition"
          value={netWorth.monthlyChangeAmount}
          subtitle="Net savings & asset appreciation"
          icon={<TrendingUp className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Annual Wealth Expansion"
          value={netWorth.annualChangeAmount}
          deltaPercent={netWorth.annualChangePercent}
          deltaLabel="YoY Growth"
          icon={<Award className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />
      </div>

      {/* Historical Growth Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Net Worth Trajectory ({horizon})</h3>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorth.history} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netWorth"
                name="Net Worth"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#nwGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Drivers & Asset Allocation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth Drivers */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Primary Net Worth Growth Drivers
          </h3>
          <div className="space-y-3">
            {netWorth.topGrowthDrivers.map((driver, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h5 className="font-bold text-slate-100 text-sm">{driver.name}</h5>
                  <span className="text-xs text-slate-400">{driver.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400 font-mono text-sm block">
                    {formatCurrency(driver.growthAmount)}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    +{driver.growthPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Asset Portfolio Allocation
          </h3>
          <div className="space-y-3">
            {netWorth.assetBreakdown.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-slate-100 text-xs">{asset.category}</span>
                <div className="text-right">
                  <span className="font-bold text-indigo-400 font-mono text-xs block">
                    {formatCurrency(asset.value)}
                  </span>
                  <span className="text-[10px] text-slate-400">{asset.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
