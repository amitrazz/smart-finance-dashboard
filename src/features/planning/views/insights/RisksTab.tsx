import React from "react";
import { useBudgetAlerts, useGoalDashboard } from "../../../../hooks/useFinanceQueries";
import { RiskCard } from "../../../../components/planning/RiskCard";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorState } from "../../../../components/common/ErrorState";

const ALERT_SEVERITY_MAP: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
  INFO: "LOW",
  WARNING: "MEDIUM",
  CRITICAL: "CRITICAL",
};

interface RisksTabProps {
  onSelectGoal: (goalId: string) => void;
}

export const RisksTab: React.FC<RisksTabProps> = ({ onSelectGoal }) => {
  const { data: alerts = [], isLoading: alertsLoading, isError: alertsErrored, refetch: refetchAlerts } = useBudgetAlerts();
  // GET /finance/goals doesn't embed a forecast/risk field per goal — the
  // dashboard's own `goalsAtRisk` aggregate is the real source for this.
  const { data: goalDashboard, isLoading: dashboardLoading, isError: dashboardErrored, refetch: refetchDashboard } = useGoalDashboard();

  if (alertsLoading || dashboardLoading) return <LoadingSkeleton type="list" rows={4} />;

  if (alertsErrored || dashboardErrored) {
    return (
      <ErrorState
        title="Failed to Load Risks"
        message="We couldn't load budget alerts or goal risk data."
        onRetry={() => {
          if (alertsErrored) refetchAlerts();
          if (dashboardErrored) refetchDashboard();
        }}
      />
    );
  }

  const goalRisks = goalDashboard?.goalsAtRisk ?? [];

  if (alerts.length === 0 && goalRisks.length === 0) {
    return <EmptyState title="No Risks Detected" message="No budgets are over limit and no goals are behind schedule right now." />;
  }

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Budget Risks</h3>
          {alerts.map((alert) => (
            <RiskCard
              key={alert.id}
              title={alert.title}
              description={alert.message}
              severity={ALERT_SEVERITY_MAP[alert.severity] ?? "MEDIUM"}
              category={alert.categoryName}
            />
          ))}
        </div>
      )}
      {goalRisks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Goal Risks</h3>
          {goalRisks.map((goal) => (
            <RiskCard
              key={goal.goalId}
              title={`${goal.name} — ${goal.riskLevel.replace(/_/g, " ")}`}
              description="This goal's current contribution pace may not reach the target by its target date."
              severity="MEDIUM"
              category="Goal"
              onClick={() => onSelectGoal(goal.goalId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RisksTab;
