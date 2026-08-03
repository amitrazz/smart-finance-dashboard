import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { IncomeDashboardData } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";
import { DollarSign } from "lucide-react";

interface IncomeCalendarViewProps {
  data: IncomeDashboardData;
}

export const IncomeCalendarView: React.FC<IncomeCalendarViewProps> = ({ data }) => {
  const chartData = data.monthlyBreakdown.map((m) => ({
    month: m.month,
    Dividends: parseFloat(m.receivedDividends.amount || "0"),
    Interest: parseFloat(m.receivedInterest.amount || "0"),
    Upcoming: parseFloat(m.upcomingEstimatedIncome.amount || "0"),
  }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ color?: string; name?: string; value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl space-y-2 text-xs">
          <p className="font-bold text-slate-200">{label}</p>
          <div className="space-y-1">
            {payload.map((p, idx) => (
              <p key={idx} className="flex items-center justify-between gap-4 font-semibold" style={{ color: p.color }}>
                <span>{p.name}:</span>
                <span>{formatCurrency({ amount: p.value.toFixed(2), currency: "INR" })}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-1 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Received This Year</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(data.totalReceivedThisYear)}
          </p>
          <p className="text-xs text-slate-500">Realized passive income</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-1 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Upcoming Dividends</span>
          <p className="text-2xl font-extrabold text-indigo-400 font-mono">
            {formatCurrency(data.totalUpcomingThisYear)}
          </p>
          <p className="text-xs text-slate-500">Announced & expected</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-1 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Avg Monthly Income</span>
          <p className="text-2xl font-extrabold text-sky-400 font-mono">
            {formatCurrency(data.averageMonthlyIncome)}
          </p>
          <p className="text-xs text-slate-500">Monthly yield run-rate</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-1 backdrop-blur-xl">
          <span className="text-xs text-slate-400 font-semibold uppercase">Annual Dividend Yield</span>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">
            {data.projectedAnnualYieldPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-500">On total invested capital</p>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Monthly Passive Income Stream
          </h3>
          <span className="text-xs font-semibold text-slate-400">Dividends & Interest</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
              <Bar dataKey="Dividends" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="Interest" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="Upcoming" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
