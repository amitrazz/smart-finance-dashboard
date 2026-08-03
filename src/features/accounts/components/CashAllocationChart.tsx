import React, { useState } from "react";

import {
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

interface CashAllocationChartProps {
  institutionData: Array<{ institutionId: string; institutionName: string; logoUrl?: string; amount: { amount: string; currency: string }; percentage: number }>;
  currencyData: Array<{ currency: string; amount: { amount: string; currency: string }; percentage: number }>;
}

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6"];

export const CashAllocationChart: React.FC<CashAllocationChartProps> = ({
  institutionData,
  currencyData,
}) => {
  const [activeTab, setActiveTab] = useState<"institution" | "currency">("institution");

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
      {/* Header with View Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Cash Distribution</h3>
          <p className="text-xs text-slate-400">How your liquid cash is spread across institutions and currencies</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("institution")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "institution" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            By Institution
          </button>
          <button
            onClick={() => setActiveTab("currency")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "currency" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            By Currency
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full pt-2">
        {activeTab === "institution" && (
          institutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={institutionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="percentage"
                  nameKey="institutionName"
                >
                  {institutionData.map((_, index) => (
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
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">No liquid cash accounts yet</div>
          )
        )}

        {activeTab === "currency" && (
          currencyData.length > 0 ? (
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
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">No liquid cash accounts yet</div>
          )
        )}
      </div>

      {/* Legend Grid */}
      {activeTab === "institution" && institutionData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60">
          {institutionData.map((item, idx) => (
            <div key={item.institutionId} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 truncate">{item.institutionName}</p>
                <p className="text-xs font-bold text-slate-100">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
