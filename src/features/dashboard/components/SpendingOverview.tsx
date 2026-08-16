import React, { useState } from "react";
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { useExpenseTrendAnalytics } from "../../../hooks/useFinanceQueries";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

// The expense-trend endpoint returns monthly buckets and only accepts a
// `limit` (number of months) — there's no day-granularity window param, so
// the 7d/30d/90d/1y selector below maps to "how many trailing months to
// show" rather than an exact day count.
const TIME_RANGE_TO_MONTHS: Record<"7d" | "30d" | "90d" | "1y", number> = {
  "7d": 1,
  "30d": 1,
  "90d": 3,
  "1y": 12,
};

export const SpendingOverview: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("1y");

  const { data: trendDataRaw = [] } = useExpenseTrendAnalytics({ limit: TIME_RANGE_TO_MONTHS[timeRange] });

  const trendList = Array.isArray(trendDataRaw) ? trendDataRaw : [];

  const activeTrendData = trendList.map((item) => ({
    month: new Date(item.periodStart).toLocaleDateString("en-IN", { month: "short" }),
    Spend: parseFloat(item.amount || "0"),
  }));

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-100 font-sans tracking-tight">Spending Overview & Trends</h3>
          <p className="text-xs text-slate-400">Category breakdown and outflow velocity across timeline</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          {(["7d", "30d", "90d", "1y"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === r ? `${NAV_TAB_L2}` : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Spending Velocity Area Chart */}
      <div className="flex-1">
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Outflow Velocity ({timeRange})</span>
            </div>
          </div>

          {activeTrendData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <TrendingUp className="w-6 h-6 text-slate-500" />
              <p className="text-xs text-slate-400 font-semibold">No Monthly Spend History</p>
              <p className="text-[11px] text-slate-500">Historical spending trend will populate after logging transactions.</p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeTrendData}>
                  <defs>
                    <linearGradient id="spendTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                    formatter={(val: unknown) => [formatCurrency({ amount: String(val), currency: "INR" }), "Monthly Spend"]}
                  />
                  <Area type="monotone" dataKey="Spend" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#spendTrendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
