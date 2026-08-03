import React from "react";
import { useBudgetDashboard } from "../../../../hooks/useFinanceQueries";
import { PlanningHeader } from "../../../../components/planning/PlanningHeader";
import { ReportActions } from "../../components/ReportActions";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency } from "../../../../utils/formatters";
import { toCsv } from "../../utils/reportExport";

export const MonthlyBudgetReviewReport: React.FC = () => {
  const { data: dashboard, isLoading, isError, refetch } = useBudgetDashboard();

  if (isLoading) return <LoadingSkeleton type="cards" rows={4} />;
  if (isError) return <ErrorState title="Failed to Load Budget Review" onRetry={() => refetch()} />;
  if (!dashboard) return <EmptyState title="No Budget Data" message="Create a budget to generate this report." />;

  const budgetList = dashboard.activeBudgets ?? [];

  const handleExport = () =>
    toCsv(
      budgetList.map((b) => ({
        name: b.name,
        period: b.period,
        totalLimit: formatCurrency(b.totalLimit),
        totalSpent: formatCurrency(b.totalSpent),
        utilizationPercent: b.utilizationPercent ?? "",
        healthGrade: b.budgetHealthGrade ?? "",
      })),
      "monthly-budget-review"
    );

  return (
    <div className="print-report space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PlanningHeader title="Monthly Budget Review" breadcrumb={["Planning", "Reports"]} />
        <ReportActions onExportCsv={handleExport} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Total Budget</p>
          <p className="text-xl font-extrabold text-slate-100">{formatCurrency(dashboard.totalBudget)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Total Spent</p>
          <p className="text-xl font-extrabold text-slate-100">{formatCurrency(dashboard.totalSpent)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Utilization</p>
          <p className="text-xl font-extrabold text-slate-100">{dashboard.overallUtilization ?? "—"}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Health Score</p>
          <p className="text-xl font-extrabold text-slate-100">{dashboard.budgetHealthScore ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-900/60">
              <th className="py-2.5 px-4">Budget</th>
              <th className="py-2.5 px-4">Period</th>
              <th className="py-2.5 px-4 text-right">Limit</th>
              <th className="py-2.5 px-4 text-right">Spent</th>
              <th className="py-2.5 px-4 text-right">Utilization</th>
              <th className="py-2.5 px-4 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {budgetList.map((b) => (
              <tr key={b.id}>
                <td className="py-3 px-4 font-bold text-slate-100">{b.name}</td>
                <td className="py-3 px-4 text-slate-400">{b.period}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(b.totalLimit)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(b.totalSpent)}</td>
                <td className="py-3 px-4 text-right">{b.utilizationPercent ?? "—"}%</td>
                <td className="py-3 px-4 text-right">{b.budgetHealthGrade ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyBudgetReviewReport;
