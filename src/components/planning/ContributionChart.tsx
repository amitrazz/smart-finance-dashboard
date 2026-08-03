import React, { useMemo } from "react";
import { GoalContribution } from "../../types";
import { AnalyticsChart } from "./AnalyticsChart";
import { formatCurrency } from "../../utils/formatters";

interface ContributionChartProps {
  contributions: GoalContribution[];
  groupBy?: "month" | "week";
  height?: number;
}

export const ContributionChart: React.FC<ContributionChartProps> = ({ contributions, groupBy = "month", height = 260 }) => {
  const data = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const c of contributions) {
      const date = new Date(c.date);
      if (isNaN(date.getTime())) continue;
      const key =
        groupBy === "week"
          ? `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
          : date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const amount = parseFloat(c.amount?.amount ?? "0") || 0;
      buckets.set(key, (buckets.get(key) ?? 0) + amount);
    }
    return Array.from(buckets.entries()).map(([period, amount]) => ({ period, amount }));
  }, [contributions, groupBy]);

  return (
    <AnalyticsChart
      type="area"
      data={data}
      xKey="period"
      series={[{ key: "amount", label: "Contributions", color: "#10b981" }]}
      height={height}
      formatValue={(v) => formatCurrency(v)}
      emptyMessage="No contributions recorded yet."
    />
  );
};

export default ContributionChart;
