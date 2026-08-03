import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { PerformancePoint } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";

interface PortfolioChartProps {
  data: PerformancePoint[];
  benchmarkName?: string;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  data,
  benchmarkName = "NIFTY 50 TRI",
}) => {
  const [timeframe, setTimeframe] = useState<"1M" | "6M" | "1Y" | "ALL">("1Y");

  const formatYAxis = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

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
          <p className="font-bold text-slate-300">{label}</p>
          <div className="space-y-1">
            <p className="text-indigo-400 font-bold flex items-center justify-between gap-4">
              <span>Portfolio Value:</span>
              <span>{formatCurrency({ amount: payload[0]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
            </p>
            {payload[1] && (
              <p className="text-slate-400 font-medium flex items-center justify-between gap-4">
                <span>Invested Capital:</span>
                <span>{formatCurrency({ amount: payload[1]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
              </p>
            )}
            {payload[2] && (
              <p className="text-emerald-400 font-medium flex items-center justify-between gap-4">
                <span>{benchmarkName}:</span>
                <span>{formatCurrency({ amount: payload[2]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100">Portfolio Value & Growth Trajectory</h3>
          <p className="text-xs text-slate-400">
            Historical portfolio valuation vs invested capital and {benchmarkName}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(["1M", "6M", "1Y", "ALL"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                timeframe === tf
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatYAxis} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              name="Portfolio Value"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#portfolioGradient)"
            />
            <Area
              type="monotone"
              dataKey="investedCapital"
              name="Invested Capital"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#investedGradient)"
            />
            <Area
              type="monotone"
              dataKey="benchmarkValue"
              name={benchmarkName}
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
