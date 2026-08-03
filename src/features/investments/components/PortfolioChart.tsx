import React from "react";
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
import { PortfolioSnapshot } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

export type PortfolioChartTimeframe = "1M" | "6M" | "1Y" | "ALL";

interface PortfolioChartProps {
  data: PortfolioSnapshot[];
  timeframe: PortfolioChartTimeframe;
  onTimeframeChange: (tf: PortfolioChartTimeframe) => void;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ data, timeframe, onTimeframeChange }) => {
  const chartData = data.map((snap) => ({
    date: snap.snapshotDate,
    marketValue: parseFloat(snap.totalMarketValue.amount) || 0,
    costBasis: parseFloat(snap.totalCostBasis.amount) || 0,
    currency: snap.totalMarketValue.currency,
  }));

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
    payload?: Array<{ value?: number; payload?: { currency?: string } }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const currency = payload[0]?.payload?.currency || "INR";
      return (
        <div className="p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-2 text-xs">
          <p className="font-bold text-slate-300">{label}</p>
          <div className="space-y-1">
            <p className="text-indigo-400 font-bold flex items-center justify-between gap-4">
              <span>Market Value:</span>
              <span>{formatCurrency({ amount: String(payload[0]?.value ?? 0), currency })}</span>
            </p>
            {payload[1] && (
              <p className="text-slate-400 font-medium flex items-center justify-between gap-4">
                <span>Cost Basis:</span>
                <span>{formatCurrency({ amount: String(payload[1]?.value ?? 0), currency })}</span>
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
          <h3 className="text-base font-bold text-slate-100">Portfolio Value & Cost Basis</h3>
          <p className="text-xs text-slate-400">Historical portfolio snapshots (market value vs. cost basis)</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(["1M", "6M", "1Y", "ALL"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
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

      {chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-500">
          No portfolio history recorded yet.
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                dataKey="marketValue"
                name="Market Value"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#portfolioGradient)"
              />
              <Area
                type="monotone"
                dataKey="costBasis"
                name="Cost Basis"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#investedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
