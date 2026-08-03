import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { AllocationBreakdownItem } from "../types";
import { formatCurrency } from "../../../utils/formatters";

interface AllocationPieProps {
  data: AllocationBreakdownItem[];
  title: string;
}

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#64748b"];

export const AllocationPie: React.FC<AllocationPieProps> = ({ data, title }) => {
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: AllocationBreakdownItem }>;
  }) => {
    if (active && payload && payload.length) {
      const item: AllocationBreakdownItem = payload[0].payload;
      return (
        <div className="p-3 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-xl space-y-1 text-xs">
          <p className="font-bold text-slate-100">{item.name}</p>
          <p className="text-indigo-400 font-extrabold">{formatCurrency(item.value)}</p>
          <p className="text-slate-400 font-semibold">{item.percentage.toFixed(2)}% of Portfolio</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl">
      <h3 className="text-base font-bold text-slate-100">{title}</h3>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="percentage"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  stroke="#0f172a"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => {
                const item = entry.payload as AllocationBreakdownItem | undefined;
                return (
                  <span className="text-xs text-slate-300 font-medium">{value} ({item?.percentage.toFixed(1)}%)</span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
