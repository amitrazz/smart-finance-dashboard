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
import { ForecastPoint } from "../types/insightsTypes";
import { formatCurrency } from "../../../utils/formatters";

interface ForecastChartProps {
  data: ForecastPoint[];
  title?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  title = "30D - 3Y Wealth & Cash Flow Projection",
}) => {
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
          <p className="font-bold text-slate-200">{label}</p>
          <div className="space-y-1 font-semibold">
            <p className="text-emerald-400 flex items-center justify-between gap-4">
              <span>Projected Net Worth:</span>
              <span>{formatCurrency({ amount: payload[0]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
            </p>
            <p className="text-indigo-400 flex items-center justify-between gap-4">
              <span>Projected Investments:</span>
              <span>{formatCurrency({ amount: payload[1]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
            </p>
            <p className="text-rose-400 flex items-center justify-between gap-4">
              <span>Projected Debt:</span>
              <span>{formatCurrency({ amount: payload[2]?.value?.toFixed(2) || "0", currency: "INR" })}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
      <h3 className="text-base font-bold text-slate-100">{title}</h3>
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatYAxis} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="projectedNetWorth"
              name="Projected Net Worth"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#netWorthGrad)"
            />
            <Area
              type="monotone"
              dataKey="projectedInvestment"
              name="Projected Investments"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={0}
            />
            <Area
              type="monotone"
              dataKey="projectedDebt"
              name="Projected Debt"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
