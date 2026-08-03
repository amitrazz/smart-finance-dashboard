import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PLANNING_CHART_COLORS, PLANNING_TOOLTIP_STYLE } from "./chartTheme";
import { EmptyState } from "../common/EmptyState";

interface Series {
  key: string;
  label: string;
  color?: string;
}

interface AnalyticsChartProps {
  type: "line" | "area" | "bar" | "pie";
  data: Array<Record<string, unknown>>;
  xKey?: string;
  series: Series[];
  height?: number;
  formatValue?: (v: number) => string;
  emptyMessage?: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  xKey = "name",
  series,
  height = 280,
  formatValue,
  emptyMessage = "No data available for this chart yet.",
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <EmptyState title="No Chart Data" message={emptyMessage} />
      </div>
    );
  }

  const tickFormatter = formatValue ?? ((v: number) => `${v}`);

  if (type === "pie") {
    const key = series[0]?.key ?? "value";
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={key} nameKey={xKey} innerRadius="55%" outerRadius="80%" paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PLANNING_CHART_COLORS[i % PLANNING_CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...PLANNING_TOOLTIP_STYLE} formatter={(v) => tickFormatter(Number(v))} />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip {...PLANNING_TOOLTIP_STYLE} formatter={(v) => tickFormatter(Number(v))} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? PLANNING_CHART_COLORS[i % PLANNING_CHART_COLORS.length]} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? PLANNING_CHART_COLORS[i % PLANNING_CHART_COLORS.length];
              return (
                <linearGradient key={s.key} id={`planningGrad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={tickFormatter} />
          <Tooltip {...PLANNING_TOOLTIP_STYLE} formatter={(v) => tickFormatter(Number(v))} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />}
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PLANNING_CHART_COLORS[i % PLANNING_CHART_COLORS.length]}
              fill={`url(#planningGrad-${s.key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey={xKey} stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={tickFormatter} />
        <Tooltip {...PLANNING_TOOLTIP_STYLE} formatter={(v) => tickFormatter(Number(v))} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? PLANNING_CHART_COLORS[i % PLANNING_CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AnalyticsChart;
