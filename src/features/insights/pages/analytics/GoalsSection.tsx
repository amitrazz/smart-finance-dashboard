import React from "react";
import { useGoalAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { Money } from "../../../../components/common/Money";
import { MetricValue } from "../../components/common/MetricValue";
import { formatDate } from "../../../../utils/formatters";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Goal progress.
 *
 * `isBehindSchedule` is the backend's verdict, and a goal it hasn't graded
 * shows no badge at all — the previous version counted every ungraded goal as
 * "on track", so an account with no goal analytics reported perfect health.
 */
export const GoalsSection: React.FC = () => {
  const goals = useGoalAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Goals"
      description="Progress toward each target, and whether funding is keeping pace."
      result={goals}
      link={{ label: "Planning", onClick: () => navigateToRoute("planning", "goals") }}
      emptyTitle="No goals yet"
      emptyMessage="Create a goal under Planning and its progress will be tracked here."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow columns={3}>
            <AnalyticsKpi label="Goals" value={data.totalGoalsCount} precision={0} />
            <AnalyticsKpi
              label="On track"
              value={data.onTrackCount}
              precision={0}
              caption={data.onTrackCount === null ? "No goals graded" : null}
            />
            <AnalyticsKpi
              label="Behind"
              value={data.behindCount}
              precision={0}
              upIsGood={false}
              caption={data.behindCount === null ? "No goals graded" : null}
            />
          </AnalyticsKpiRow>

          {data.goals.length === 0 ? (
            <p className="text-xs text-slate-500">No individual goals were returned.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {data.goals.map((goal) => (
                <li
                  key={goal.goalId}
                  className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-slate-200">{goal.name}</span>
                    {goal.isBehindSchedule !== null && (
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          goal.isBehindSchedule
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {goal.isBehindSchedule ? "Behind" : "On track"}
                      </span>
                    )}
                  </div>

                  {typeof goal.progressPercent === "number" && (
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(100, Math.max(0, goal.progressPercent))}%` }}
                      />
                    </div>
                  )}

                  <p className="text-[11px] tabular-nums text-slate-400">
                    <MetricValue
                      value={goal.currentAmount}
                      money
                      fractionDigits={0}
                      emptyClassName="text-slate-500"
                    />{" "}
                    of <Money value={goal.targetAmount} fractionDigits={0} />
                    {typeof goal.progressPercent === "number" && ` · ${goal.progressPercent.toFixed(0)}%`}
                  </p>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <dt className="text-slate-500">Monthly</dt>
                    <dd className="text-right tabular-nums text-slate-300">
                      <MetricValue value={goal.monthlyContribution} money />
                    </dd>
                    <dt className="text-slate-500">Target date</dt>
                    <dd className="text-right text-slate-300">
                      {goal.projectedCompletionDate
                        ? formatDate(goal.projectedCompletionDate)
                        : "Not enough data"}
                    </dd>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AnalyticsSection>
  );
};
