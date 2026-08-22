import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { IncomeRecord } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

interface SalaryHistoryChartProps {
  records: IncomeRecord[];
}

/**
 * A client-side grouping of already-fetched records for chart layout only
 * (sorting by period, picking three already-authoritative figures per
 * record) — never a recomputation of gross/net/deductions themselves. No
 * dedicated backend trend endpoint exists for salary history, so this is
 * intentionally simple rather than a second analytics engine (spec §15).
 */
export const SalaryHistoryChart: React.FC<SalaryHistoryChartProps> = ({ records }) => {
  const data = useMemo(() => {
    return [...records]
      .filter((r) => r.salaryPeriod)
      .sort((a, b) => (a.salaryPeriod as string).localeCompare(b.salaryPeriod as string))
      .map((r) => ({
        period: r.salaryPeriod as string,
        label: new Date(r.salaryPeriod as string).toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        gross: parseFloat(r.grossAmount.amount) || 0,
        net: parseFloat(r.netAmount.amount) || 0,
        deductions: r.totalDeductions ? parseFloat(r.totalDeductions.amount) || 0 : 0,
        currency: r.netAmount.currency,
      }));
  }, [records]);

  if (data.length < 2) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <p className="text-xs text-slate-500">
          Import at least two salary slips to see a trend over time.
        </p>
      </div>
    );
  }

  const currency = data[0]?.currency || "INR";

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-3">
        Salary History
      </h4>
      <div className="h-64" role="img" aria-label="Gross salary, net pay, and total deductions over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "12px",
                fontSize: 11,
              }}
              formatter={(value, name) => [
                formatCurrency({ amount: String(value ?? 0), currency }, "en-IN", 0),
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="gross" name="Gross Salary" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="net" name="Net Pay" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            <Line
              type="monotone"
              dataKey="deductions"
              name="Total Deductions"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
