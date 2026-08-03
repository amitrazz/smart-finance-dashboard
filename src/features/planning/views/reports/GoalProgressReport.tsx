import React from "react";
import { useGoalDashboard, useGoals } from "../../../../hooks/useFinanceQueries";
import { PlanningHeader } from "../../../../components/planning/PlanningHeader";
import { ReportActions } from "../../components/ReportActions";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency } from "../../../../utils/formatters";
import { toCsv } from "../../utils/reportExport";

export const GoalProgressReport: React.FC = () => {
  const { data: dashboard, isLoading: isDashboardLoading, isError: isDashboardError, refetch: refetchDashboard } = useGoalDashboard();
  const { data: goals = [], isLoading: isGoalsLoading, isError: isGoalsError, refetch: refetchGoals } = useGoals();

  if (isDashboardLoading || isGoalsLoading) return <LoadingSkeleton type="cards" rows={4} />;
  if (isDashboardError || isGoalsError) {
    return <ErrorState title="Failed to Load Goal Progress" onRetry={() => { refetchDashboard(); refetchGoals(); }} />;
  }
  if (!dashboard) return <EmptyState title="No Goal Data" message="Create a goal to generate this report." />;

  const handleExport = () =>
    toCsv(
      goals.map((g) => ({
        goal: g.name,
        progressPercent: g.progressPercent,
        currentCorpus: formatCurrency(g.currentCorpus || g.currentAmount),
        targetCorpus: formatCurrency(g.targetAmount),
        status: g.status,
      })),
      "goal-progress-report"
    );

  return (
    <div className="print-report space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PlanningHeader title="Goal Progress Report" breadcrumb={["Planning", "Reports"]} />
        <ReportActions onExportCsv={handleExport} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Active Goals</p>
          <p className="text-xl font-extrabold text-slate-100">{dashboard.activeGoalsCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Overall Progress</p>
          <p className="text-xl font-extrabold text-slate-100">{dashboard.overallProgressPercent}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Goals At Risk</p>
          <p className="text-xl font-extrabold text-slate-100">{dashboard.goalsAtRisk.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-bold">Completed Goals</p>
          <p className="text-xl font-extrabold text-slate-100">{dashboard.completedGoalsCount}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-900/60">
              <th className="py-2.5 px-4">Goal</th>
              <th className="py-2.5 px-4 text-right">Progress</th>
              <th className="py-2.5 px-4 text-right">Current</th>
              <th className="py-2.5 px-4 text-right">Target</th>
              <th className="py-2.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {goals.map((g) => (
              <tr key={g.id}>
                <td className="py-3 px-4 font-bold text-slate-100">{g.name}</td>
                <td className="py-3 px-4 text-right">{g.progressPercent}%</td>
                <td className="py-3 px-4 text-right">{formatCurrency(g.currentCorpus || g.currentAmount)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(g.targetAmount)}</td>
                <td className="py-3 px-4 text-right text-slate-400">{g.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoalProgressReport;
