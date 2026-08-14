import React from "react";
import { useBudgetAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { Money } from "../../../../components/common/Money";
import { MetricValue } from "../../components/common/MetricValue";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * `UNKNOWN` is styled as its own state, not as a healthy one.
 *
 * A budget whose spend the backend could not report used to fall through a
 * `percentUsed ?? 0` default and render as "On track" in emerald — the reader
 * had no way to tell a well-managed budget from an unmeasured one.
 */
const STATUS_STYLE = {
  HEALTHY: { label: "On track", chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300", bar: "#34d399" },
  WARNING: { label: "Near limit", chip: "bg-amber-500/10 border-amber-500/30 text-amber-300", bar: "#fbbf24" },
  EXCEEDED: { label: "Over", chip: "bg-rose-500/10 border-rose-500/30 text-rose-300", bar: "#fb7185" },
  UNKNOWN: { label: "Not measured", chip: "bg-slate-800/60 border-slate-700 text-slate-300", bar: "#475569" },
} as const;

/**
 * Budget adherence.
 *
 * Insights reports; Planning owns the budgets themselves, so every row links
 * back there rather than growing edit affordances here.
 */
export const BudgetSection: React.FC = () => {
  const budgets = useBudgetAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Budget"
      description="Allocation against actual spend, per budget."
      result={budgets}
      link={{ label: "Planning", onClick: () => navigateToRoute("planning", "budgets") }}
      emptyTitle="No budgets set"
      emptyMessage="Create a budget under Planning and its adherence will be reported here."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow columns={4}>
            <AnalyticsKpi label="Budgeted" value={data.totalBudgeted} money />
            <AnalyticsKpi label="Spent" value={data.totalSpent} money upIsGood={false} />
            <AnalyticsKpi
              label="Utilisation"
              value={data.overallPercentUsed}
              suffix="%"
              upIsGood={false}
            />
            <AnalyticsKpi
              label="Budget health"
              value={data.budgetHealthScore}
              suffix=" / 100"
              precision={0}
            />
          </AnalyticsKpiRow>

          {data.budgets.length === 0 ? (
            <p className="text-xs text-slate-500">No individual budgets were returned.</p>
          ) : (
            <ul className="space-y-3">
              {data.budgets.map((budget) => {
                const style = STATUS_STYLE[budget.status];
                return (
                  <li
                    key={budget.budgetId}
                    className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm text-slate-200">{budget.name}</span>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.chip}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-slate-400">
                        <MetricValue
                          value={budget.spentAmount}
                          money
                          fractionDigits={0}
                          emptyClassName="text-slate-500"
                        />{" "}
                        of <Money value={budget.allocatedAmount} fractionDigits={0} />
                      </span>
                    </div>

                    {/* No bar without a measured share: a zero-width bar reads as
                        "nothing spent", which is the claim we cannot make. */}
                    {budget.percentUsed !== null && (
                      <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, budget.percentUsed))}%`,
                            backgroundColor: style.bar,
                          }}
                        />
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500">
                      {budget.percentUsed === null
                        ? "Spend for this budget wasn't reported"
                        : `${budget.percentUsed.toFixed(0)}% used`}
                      {budget.remainingAmount && (
                        <>
                          {" · "}
                          <Money value={budget.remainingAmount} fractionDigits={0} /> remaining
                        </>
                      )}
                      {budget.forecastEndOfPeriod && (
                        <>
                          {" · forecast end of period "}
                          <MetricValue value={budget.forecastEndOfPeriod} money fractionDigits={0} />
                        </>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </AnalyticsSection>
  );
};
