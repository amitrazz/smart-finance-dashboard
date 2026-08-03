import React from "react";
import { useGoalDashboard, useBudgetDashboard } from "../../../../hooks/useFinanceQueries";
import { PlanningHeader } from "../../../../components/planning/PlanningHeader";
import { ReportActions } from "../../components/ReportActions";
import { MetricCard } from "../../../../components/common/MetricCard";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { formatCurrency } from "../../../../utils/formatters";
import { toCsv } from "../../utils/reportExport";
import { Target, Wallet, TrendingUp, HeartPulse } from "lucide-react";

export const PlanningSummaryReport: React.FC = () => {
  const { data: goalDashboard, isLoading: goalLoading, isError: goalError, refetch: refetchGoals } = useGoalDashboard();
  const { data: budgetDashboard, isLoading: budgetLoading, isError: budgetError, refetch: refetchBudgets } = useBudgetDashboard();

  if (goalLoading || budgetLoading) return <LoadingSkeleton type="cards" rows={4} />;
  if (goalError || budgetError) {
    return <ErrorState title="Failed to Load Planning Summary" onRetry={() => { refetchGoals(); refetchBudgets(); }} />;
  }

  const handleExport = () => {
    const rows: Array<Record<string, unknown>> = [];
    if (goalDashboard) {
      rows.push({ metric: "Active Goals", value: goalDashboard.activeGoalsCount });
      rows.push({ metric: "Overall Goal Progress %", value: goalDashboard.overallProgressPercent });
      rows.push({ metric: "Goals At Risk", value: goalDashboard.goalsAtRisk.length });
    }
    if (budgetDashboard) {
      rows.push({ metric: "Total Budget", value: formatCurrency(budgetDashboard.totalBudget) });
      rows.push({ metric: "Total Spent", value: formatCurrency(budgetDashboard.totalSpent) });
      rows.push({ metric: "Budget Utilization %", value: budgetDashboard.overallUtilization });
    }
    toCsv(rows, "planning-summary");
  };

  return (
    <div className="print-report space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PlanningHeader title="Planning Summary" breadcrumb={["Planning", "Reports"]} />
        <ReportActions onExportCsv={handleExport} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {goalDashboard && (
          <>
            <MetricCard
              title="Goal Progress"
              value={`${goalDashboard.overallProgressPercent}%`}
              icon={<Target className="w-4 h-4" />}
              subtitle={`${goalDashboard.activeGoalsCount} active goals`}
            />
            <MetricCard
              title="Goals At Risk"
              value={String(goalDashboard.goalsAtRisk.length)}
              icon={<HeartPulse className="w-4 h-4" />}
              accentColor="amber"
            />
          </>
        )}
        {budgetDashboard && (
          <>
            <MetricCard
              title="Budget Utilization"
              value={`${budgetDashboard.overallUtilization}%`}
              icon={<Wallet className="w-4 h-4" />}
              subtitle={formatCurrency(budgetDashboard.totalSpent)}
            />
            <MetricCard
              title="Budget Health"
              value={String(budgetDashboard.budgetHealthScore ?? "—")}
              icon={<TrendingUp className="w-4 h-4" />}
              accentColor="emerald"
            />
          </>
        )}
      </div>

      {!goalDashboard && !budgetDashboard && (
        <p className="text-sm text-slate-400">Create a goal or budget to populate this summary.</p>
      )}
    </div>
  );
};

export default PlanningSummaryReport;
