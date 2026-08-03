import React from "react";
import { Target, Wallet, TrendingUp, HeartPulse, Flag, AlertTriangle } from "lucide-react";
import {
  useGoalDashboard,
  useBudgetDashboard,
  useFinancialHealth,
  useBudgetAlerts,
} from "../../../hooks/useFinanceQueries";
import { MetricCard } from "../../../components/common/MetricCard";
import { LoadingSkeleton } from "../../../components/common/LoadingSkeleton";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { SavingsWidget } from "../../../components/planning/SavingsWidget";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { PlanningSection } from "../components/PlanningNavigation";

interface OverviewSectionProps {
  onNavigate: (section: PlanningSection, subsection?: string | null) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNavigate }) => {
  const { data: goalDashboard, isLoading: goalLoading, isError: goalErrored, refetch: refetchGoalDashboard } = useGoalDashboard();
  const { data: budgetDashboard, isLoading: budgetLoading, isError: budgetErrored, refetch: refetchBudgetDashboard } = useBudgetDashboard();
  const { data: financialHealth } = useFinancialHealth();
  const { data: alerts = [] } = useBudgetAlerts();

  if (goalLoading || budgetLoading) return <LoadingSkeleton type="cards" rows={4} />;

  if (goalErrored || budgetErrored) {
    return (
      <ErrorState
        title="Failed to Load Planning Overview"
        message="We couldn't load your goals and budgets overview."
        onRetry={() => {
          if (goalErrored) refetchGoalDashboard();
          if (budgetErrored) refetchBudgetDashboard();
        }}
      />
    );
  }

  if (!goalDashboard && !budgetDashboard) {
    return (
      <EmptyState
        title="Welcome to Planning"
        message="Create a goal or budget to see your financial planning overview here."
      />
    );
  }

  const upcomingMilestones = (goalDashboard?.upcomingMilestones ?? []).slice(0, 5);
  const activeAlerts = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "WARNING").slice(0, 3);
  const overallUtilization = budgetDashboard ? parseFloat(budgetDashboard.overallUtilization) || 0 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {goalDashboard && (
          <MetricCard
            title="Goal Progress"
            value={`${goalDashboard.overallProgressPercent}%`}
            icon={<Target className="w-4 h-4" />}
            subtitle={`${goalDashboard.activeGoalsCount} active goals`}
            progressPercent={parseFloat(goalDashboard.overallProgressPercent) || 0}
            onClick={() => onNavigate("goals", "active")}
          />
        )}
        {budgetDashboard && (
          <MetricCard
            title="Budget Utilization"
            value={`${overallUtilization}%`}
            icon={<Wallet className="w-4 h-4" />}
            subtitle={formatCurrency(budgetDashboard.totalSpent)}
            progressPercent={overallUtilization}
            progressBarColor={overallUtilization >= 90 ? "bg-rose-500" : "bg-indigo-500"}
            onClick={() => onNavigate("budgets", "active")}
          />
        )}
        {goalDashboard && (
          <MetricCard
            title="Monthly Savings"
            value={formatCurrency(goalDashboard.monthlyContributionTotal)}
            icon={<TrendingUp className="w-4 h-4" />}
            subtitle="Across all goals"
            onClick={() => onNavigate("reports", "savings")}
          />
        )}
        {(financialHealth || budgetDashboard) && (
          <MetricCard
            title="Financial Health"
            value={String(financialHealth?.overallScore ?? budgetDashboard?.budgetHealthScore ?? "—")}
            icon={<HeartPulse className="w-4 h-4" />}
            subtitle={financialHealth?.rating}
            accentColor="emerald"
            onClick={() => onNavigate("insights", "risks")}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {goalDashboard && (
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Current Corpus</p>
              <p className="text-xl font-extrabold text-slate-100">{formatCurrency(goalDashboard.totalCorpus)}</p>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Target Corpus</p>
              <p className="text-xl font-extrabold text-slate-100">{formatCurrency(goalDashboard.targetCorpus)}</p>
            </div>
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Remaining</p>
              <p className="text-xl font-extrabold text-slate-100">{formatCurrency(goalDashboard.remainingCorpus)}</p>
            </div>
          </div>
        )}

        {goalDashboard && (
          <SavingsWidget
            totalCurrentCorpus={{ amount: goalDashboard.totalCorpus, currency: "INR" }}
            totalTargetCorpus={{ amount: goalDashboard.targetCorpus, currency: "INR" }}
            monthlyContribution={{ amount: goalDashboard.monthlyContributionTotal, currency: "INR" }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Flag className="w-4 h-4 text-indigo-400" /> Upcoming Milestones
            </h3>
            <button onClick={() => onNavigate("goals", "active")} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View all →
            </button>
          </div>
          {upcomingMilestones.length === 0 ? (
            <EmptyState title="No Upcoming Milestones" message="Add milestones to your goals to see them here." />
          ) : (
            <div className="space-y-2">
              {upcomingMilestones.map((m) => (
                <div key={m.milestoneId} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <div>
                    <p className="font-bold text-slate-100">{m.title}</p>
                    <p className="text-slate-400 mt-0.5">{m.goalName}</p>
                  </div>
                  <span className="text-slate-500">{formatDate(m.targetDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Overspending
            </h3>
            <button onClick={() => onNavigate("insights", "risks")} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              View all →
            </button>
          </div>
          {activeAlerts.length === 0 ? (
            <EmptyState title="No Overspending" message="No budget alerts right now." />
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                  <p className="font-bold text-slate-100">{alert.title}</p>
                  <p className="text-slate-400 mt-0.5">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(goalDashboard?.goalsAtRisk?.length ?? 0) > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Goals At Risk
          </h3>
          <div className="space-y-2">
            {goalDashboard!.goalsAtRisk.slice(0, 6).map((g) => (
              <div key={g.goalId} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/40">
                <span className="text-slate-300">{g.name}</span>
                <span className="text-rose-400 font-semibold">{g.riskLevel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
