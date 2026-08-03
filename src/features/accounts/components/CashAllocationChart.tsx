import React, { useState } from "react";

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency } from "../../../utils/formatters";

interface CashAllocationChartProps {
  trendData: Array<{ date: string; balance: number }>;
  allocationData: Array<{ category: string; amount: { amount: string; currency: string }; percentage: number }>;
  currencyData: Array<{ currency: string; amount: { amount: string; currency: string }; percentage: number }>;
}

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6"];

export const CashAllocationChart: React.FC<CashAllocationChartProps> = ({
  trendData,
  allocationData,
  currencyData,
}) => {
  const [activeTab, setActiveTab] = useState<"trend" | "donut" | "bar">("trend");

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
      {/* Header with View Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Cash Flow & Liquidity Intelligence</h3>
          <p className="text-xs text-slate-400">Real-time allocation dynamics and 30-day position trajectory</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("trend")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "trend" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            30-Day Trend
          </button>
          <button
            onClick={() => setActiveTab("donut")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "donut" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Allocation Donut
          </button>
          <button
            onClick={() => setActiveTab("bar")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "bar" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Currency Split
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full pt-2">
        {activeTab === "trend" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(str) => str.slice(8)}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                formatter={(val: unknown) => [formatCurrency(Number(val ?? 0), "INR"), "Cash Position"]}
              />
              <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCash)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "donut" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="percentage"
                nameKey="category"
              >
                {allocationData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                formatter={(val: unknown, name: unknown) => [`${val}%`, String(name)]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeTab === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currencyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="currency" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "1rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                formatter={(val: unknown) => [`${val}%`, "Share"]}
              />
              <Bar dataKey="percentage" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60">
        {allocationData.map((item, idx) => (
          <div key={item.category} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 truncate">{item.category}</p>
              <p className="text-xs font-bold text-slate-100">{item.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
