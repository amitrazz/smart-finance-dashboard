import React from "react";
import { useGoalAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { formatCurrency } from "../../../utils/formatters";
import { Target, CheckCircle2, AlertTriangle } from "lucide-react";

export const GoalsPage: React.FC = () => {
  const { data: goals, isLoading } = useGoalAnalytics();

  if (isLoading || !goals) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Goal Velocity & Completion Forecast"
        description="Track progress velocity, required monthly contributions, and estimated completion dates"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Monitored Goals"
          value={`${goals.totalGoalsCount} Goals`}
          icon={<Target className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="On-Track Goals"
          value={`${goals.onTrackCount} Goals`}
          subtitle="Progressing on schedule"
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Behind Schedule"
          value={`${goals.behindCount} Goals`}
          subtitle="Funding gap requires boost"
          icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
          accentColor="amber"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.goals.map((g) => (
          <div key={g.goalId} className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Goal Target</span>
              <h4 className="text-base font-bold text-slate-100">{g.name}</h4>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-100">{g.progressPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${g.progressPercent}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Saved:</span>
                <strong className="text-slate-100 font-mono">{formatCurrency(g.currentAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Amount:</span>
                <strong className="text-slate-100 font-mono">{formatCurrency(g.targetAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Req. Monthly Savings:</span>
                <strong className="text-indigo-400 font-mono">{formatCurrency(g.requiredMonthlySavings)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
