import React from "react";
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";
import { useSpendingAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { ChartFrame, MoneyTooltip } from "../../components/charts/ChartFrame";
import { CHART_AXIS, useCompactMoneyAxis } from "../../components/charts/chartConfig";
import { BreakdownList } from "./BreakdownList";
import { MetricValue } from "../../components/common/MetricValue";
import { EmptyAnalyticsState } from "../../components/common/AnalyticsStates";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Where the money went.
 *
 * Two things the previous version showed are gone. The "needs vs wants" split
 * was decided by matching category names against a hardcoded keyword list
 * ("rent", "grocer", "fuel", …), which silently misfiled anything not written
 * in those words and presented the guess as a measured ratio. And every
 * category row carried a "+0.0% MoM" comparison, because the mapper copied the
 * current amount into `previousMonthAmount` — a comparison of a figure against
 * itself, rendered as if it were a trend.
 */
export const SpendingSection: React.FC = () => {
  const spending = useSpendingAnalytics();
  const formatAxis = useCompactMoneyAxis();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Spending"
      description="Outflow by category and merchant for the current period."
      result={spending}
      link={{ label: "Transactions", onClick: () => navigateToRoute("transactions") }}
      emptyTitle="No spending recorded"
      emptyMessage="Categorised expenses drive this section. Import transactions or add them manually."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow columns={3}>
            <AnalyticsKpi label="Total spent" value={data.totalSpent} money upIsGood={false} />
            <AnalyticsKpi label="Categories" value={data.categories.length} precision={0} />
            <AnalyticsKpi
              label="Anomalies flagged"
              value={data.anomalies.length}
              precision={0}
              caption={data.anomalies.length === 0 ? "Nothing unusual detected" : "See Intelligence"}
              upIsGood={false}
            />
          </AnalyticsKpiRow>

          {data.dailyVelocity.length >= 3 ? (
            <ChartFrame
              height={180}
              description={`Daily outflow across ${data.dailyVelocity.length} days, from ${data.dailyVelocity[0].date} to ${data.dailyVelocity[data.dailyVelocity.length - 1].date}.`}
            >
              <BarChart
                data={data.dailyVelocity}
                margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
              >
                <XAxis dataKey="date" {...CHART_AXIS} minTickGap={30} />
                <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.06)" }}
                  content={<MoneyTooltip currency={data.totalSpent.currency} />}
                />
                <Bar dataKey="amount" name="Spent" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartFrame>
          ) : (
            <EmptyAnalyticsState
              title="No daily breakdown"
              message="Daily spend needs recent dated transactions, and there aren't enough yet."
            />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownList
              title="By category"
              items={data.categories.map((c) => ({
                category: c.categoryName,
                value: c.amount,
                percentage: c.percentage,
              }))}
              accent="#f59e0b"
            />

            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Top merchants
              </h3>
              {data.topMerchants.length === 0 ? (
                <p className="text-xs text-slate-500">No merchant breakdown available.</p>
              ) : (
                <ul className="divide-y divide-slate-800/70">
                  {data.topMerchants.map((merchant) => (
                    <li
                      key={merchant.merchantName}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-300">{merchant.merchantName}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {[
                            merchant.transactionCount !== null
                              ? `${merchant.transactionCount} transactions`
                              : null,
                            merchant.category,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "No further detail"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-slate-200">
                        <MetricValue value={merchant.amount} money emptyClassName="text-slate-500" />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AnalyticsSection>
  );
};
