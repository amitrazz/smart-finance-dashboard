import React from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useIncomeAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { ChartFrame, MoneyTooltip } from "../../components/charts/ChartFrame";
import { CHART_AXIS, CHART_GRID, useCompactMoneyAxis } from "../../components/charts/chartConfig";
import { EmptyAnalyticsState } from "../../components/common/AnalyticsStates";
import { Money } from "../../../../components/common/Money";
import { directionOf, formatPercentDelta } from "../../utils/insightsFormat";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Income: what was actually received, and the sources it's expected from.
 *
 * The headline figure is the measured income from the cash-flow snapshot. The
 * source list below is explicitly *expected* amounts at their stated
 * frequencies — the previous version multiplied each by a frequency factor
 * (4.33 for weekly, 2.17 for fortnightly), summed the products, and labelled
 * the result "Monthly Income Total" beside an "Annualized Run Rate" of that
 * figure times twelve. Neither number was ever received by anyone.
 */
export const IncomeSection: React.FC = () => {
  const income = useIncomeAnalytics();
  const formatAxis = useCompactMoneyAxis();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Income"
      description="Recorded earnings and the sources they're expected from."
      result={income}
      link={{ label: "Accounts & Cash", onClick: () => navigateToRoute("accounts") }}
      emptyTitle="No income recorded"
      emptyMessage="Add an income source or import inflow transactions to populate this section."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow columns={3}>
            <AnalyticsKpi
              label="Income this period"
              value={data.totalIncomeThisPeriod}
              money
              caption="Measured, from the cash-flow snapshot"
            />
            <AnalyticsKpi
              label="Change over window"
              value={data.growthPercent}
              suffix="%"
              delta={formatPercentDelta(data.growthPercent)}
              direction={directionOf(data.growthPercent)}
              caption="First to latest recorded point"
            />
            <AnalyticsKpi label="Sources" value={data.sources.length} precision={0} />
          </AnalyticsKpiRow>

          {data.history.length >= 2 ? (
            <ChartFrame
              height={220}
              description={`Recorded income across ${data.history.length} points, from ${data.history[0].date} to ${data.history[data.history.length - 1].date}.`}
            >
              <LineChart data={data.history} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="date" {...CHART_AXIS} minTickGap={28} />
                <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
                <Tooltip content={<MoneyTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Income"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartFrame>
          ) : (
            <EmptyAnalyticsState
              title="No income trend"
              message="Charting income needs at least two recorded points."
            />
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Expected sources
            </h3>
            {data.sources.length === 0 ? (
              <p className="text-xs text-slate-500">No income sources configured.</p>
            ) : (
              <ul className="divide-y divide-slate-800/70">
                {data.sources.map((source) => (
                  <li key={source.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-300">{source.name}</p>
                      <p className="text-[11px] capitalize text-slate-500">
                        {source.frequency.toLowerCase()}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-slate-200">
                      <Money value={source.expectedAmount} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AnalyticsSection>
  );
};
