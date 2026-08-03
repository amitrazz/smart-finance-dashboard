import React from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { AllocationBreakdownItem } from "../types";
import { formatCurrency } from "../../../utils/formatters";

interface AllocationTreemapProps {
  data: AllocationBreakdownItem[];
  title: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#3b82f6", "#f43f5e"];

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  percentage?: number;
  color?: string;
}

const CustomizedContent = (props: TreemapContentProps) => {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, name, percentage } = props;

  if (width < 35 || height < 25) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        style={{
          fill: props.color || COLORS[index % COLORS.length],
          stroke: "#0f172a",
          strokeWidth: 2,
        }}
      />
      {width > 60 && height > 35 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={11}
          fontWeight="bold"
        >
          {name}
        </text>
      )}
      {width > 60 && height > 45 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize={10}
          fontWeight="semibold"
        >
          {percentage?.toFixed(1)}%
        </text>
      )}
    </g>
  );
};

export const AllocationTreemap: React.FC<AllocationTreemapProps> = ({ data, title }) => {
  const treemapData = data.map((item) => ({
    name: item.name,
    size: item.percentage,
    percentage: item.percentage,
    value: item.value,
    color: item.color,
  }));

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: (typeof treemapData)[number] }>;
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-xl space-y-1 text-xs">
          <p className="font-bold text-slate-100">{item.name}</p>
          <p className="text-indigo-400 font-extrabold">{formatCurrency(item.value)}</p>
          <p className="text-slate-400 font-semibold">{item.percentage?.toFixed(2)}% Allocation</p>
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
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#0f172a"
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
