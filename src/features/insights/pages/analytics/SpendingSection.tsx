import React from "react";
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";
import { useSpendingAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { ChartFrame, MoneyTooltip } from "../../components/charts/ChartFrame";
import {
  CHART_AXIS,
  useChartAnimation,
  useCompactMoneyAxis,
} from "../../components/charts/chartConfig";
import { shortDayLabel } from "../../utils/insightsFormat";
import { BreakdownList } from "./BreakdownList";
import { MetricValue } from "../../components/common/MetricValue";
import { EmptyAnalyticsState } from "../../components/common/AnalyticsStates";
import { InsightsEmptyState } from "../../components/primitives/States";
import { ChangeIndicator } from "../../components/primitives/ChangeIndicator";
import { TONE_CHIP } from "../../components/primitives/tone";
import { useUIStore } from "../../../../store/useUIStore";
import type { SpendingTrendMover } from "../../types/insightsTypes";

const PATTERN_LABEL: Record<NonNullable<SpendingTrendMover["pattern"]>, string> = {
  RECURRING: "Recurring",
  OCCASIONAL: "Occasional",
  ONE_TIME_LARGE_PURCHASE: "One-time",
};

const TrendMoverRow: React.FC<{ mover: SpendingTrendMover }> = ({ mover }) => (
  <li className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="truncate text-xs text-slate-300">{mover.name}</p>
      {mover.pattern && (
        <span
          className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CHIP.neutral}`}
        >
          {PATTERN_LABEL[mover.pattern]}
        </span>
      )}
    </div>
    <div className="shrink-0 text-right">
      <MetricValue value={mover.currentMonthlyAverage} money fractionDigits={0} />
      <div className="mt-0.5">
        {mover.changePercent !== null ? (
          <ChangeIndicator percent={mover.changePercent} upIsGood={false} />
        ) : (
          <span className="text-xs text-slate-500">New</span>
        )}
      </div>
    </div>
  </li>
);

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
  const animation = useChartAnimation();
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
                <XAxis
                  dataKey="date"
                  {...CHART_AXIS}
                  tickFormatter={shortDayLabel}
                  minTickGap={30}
                />
                <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.06)" }}
                  content={<MoneyTooltip currency={data.totalSpent.currency} />}
                />
                <Bar dataKey="amount" name="Spent" fill="#fb7185" radius={[2, 2, 0, 0]} {...animation} />
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
              accent="#fb7185"
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
                        <MetricValue
                          value={merchant.amount}
                          money
                          fractionDigits={0}
                          emptyClassName="text-slate-500"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {data.trending?.coverage === "INSUFFICIENT" ? (
            <InsightsEmptyState
              reason="insufficient-history"
              title="Not enough history to compare periods"
              message="Trending needs at least two recorded periods for a category or merchant. This fills in once another period is recorded."
            />
          ) : data.trending &&
            (data.trending.categories.length > 0 || data.trending.merchants.length > 0) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Trending vs last period
              </h3>
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="mb-1 text-[11px] text-slate-500">By category</h4>
                  {data.trending.categories.length === 0 ? (
                    <p className="text-xs text-slate-500">No notable category movement.</p>
                  ) : (
                    <ul className="divide-y divide-slate-800/70">
                      {data.trending.categories.map((mover) => (
                        <TrendMoverRow key={mover.id} mover={mover} />
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="mb-1 text-[11px] text-slate-500">By merchant</h4>
                  {data.trending.merchants.length === 0 ? (
                    <p className="text-xs text-slate-500">No notable merchant movement.</p>
                  ) : (
                    <ul className="divide-y divide-slate-800/70">
                      {data.trending.merchants.map((mover) => (
                        <TrendMoverRow key={mover.id} mover={mover} />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AnalyticsSection>
  );
};
