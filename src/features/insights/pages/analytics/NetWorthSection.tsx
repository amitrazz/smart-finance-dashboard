import React from "react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useForecastAnalytics, useNetWorthAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { ChartFrame, ChartLegendItem, MoneyTooltip } from "../../components/charts/ChartFrame";
import { CHART_AXIS, CHART_GRID, useCompactMoneyAxis } from "../../components/charts/chartConfig";
import { BreakdownList } from "./BreakdownList";
import { ForecastPanel } from "../../components/forecast/ForecastPanel";
import { EmptyAnalyticsState } from "../../components/common/AnalyticsStates";
import { directionOf, formatPercentDelta } from "../../utils/insightsFormat";
import { useUIStore } from "../../../../store/useUIStore";
import { Layers, ShieldAlert, TrendingUp, Wallet } from "lucide-react";

/**
 * Net worth: the position, its history, what composes it, and where it leads.
 *
 * The projection sits here rather than in a separate Forecast tab, because a
 * projection read apart from the actual it extends is just a number.
 */
export const NetWorthSection: React.FC = () => {
  const netWorth = useNetWorthAnalytics();
  const forecast = useForecastAnalytics();
  const formatAxis = useCompactMoneyAxis();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <div className="space-y-10">
      <AnalyticsSection
        title="Net worth"
        description="Everything you own, less everything you owe."
        result={netWorth}
        asOf={netWorth.data?.asOf}
        link={{ label: "Accounts & Cash", onClick: () => navigateToRoute("accounts") }}
        emptyTitle="No net-worth snapshot"
        emptyMessage="Add an account or an asset and a snapshot will be recorded."
      >
        {(data) => (
          <div className="space-y-6">
            <AnalyticsKpiRow>
              <AnalyticsKpi
                label="Net worth"
                value={data.currentNetWorth}
                money
                delta={formatPercentDelta(data.periodChangePercent)}
                direction={directionOf(data.periodChangePercent)}
                caption="vs previous snapshot"
                accent="emerald"
                icon={<Wallet className="h-6 w-6 text-emerald-400" aria-hidden="true" />}
              />
              <AnalyticsKpi
                label="Total assets"
                value={data.totalAssets}
                money
                accent="sky"
                icon={<Layers className="h-6 w-6 text-sky-400" aria-hidden="true" />}
              />
              <AnalyticsKpi
                label="Total liabilities"
                value={data.totalLiabilities}
                money
                upIsGood={false}
                accent="rose"
                icon={<ShieldAlert className="h-6 w-6 text-rose-400" aria-hidden="true" />}
              />
              <AnalyticsKpi
                label="Change over window"
                value={data.windowChangeAmount}
                money
                delta={formatPercentDelta(data.windowChangePercent)}
                direction={directionOf(data.windowChangePercent)}
                accent="indigo"
                icon={<TrendingUp className="h-6 w-6 text-indigo-400" aria-hidden="true" />}
              />
            </AnalyticsKpiRow>

            {data.history.length >= 2 ? (
              <ChartFrame
                height={260}
                description={`Net worth, assets and liabilities across ${data.history.length} snapshots from ${data.history[0].date} to ${data.history[data.history.length - 1].date}.`}
                legend={
                  <>
                    <ChartLegendItem color="#34d399" label="Net worth" />
                    <ChartLegendItem color="#60a5fa" label="Assets" />
                    <ChartLegendItem color="#fb7185" label="Liabilities" />
                  </>
                }
              >
                <AreaChart data={data.history} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="netWorthArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART_GRID} />
                  <XAxis dataKey="date" {...CHART_AXIS} minTickGap={28} />
                  <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
                  <Tooltip content={<MoneyTooltip currency={data.currentNetWorth.currency} />} />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    name="Net worth"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#netWorthArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAssets"
                    name="Assets"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalLiabilities"
                    name="Liabilities"
                    stroke="#fb7185"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ChartFrame>
            ) : (
              <EmptyAnalyticsState
                title="Not enough history to chart"
                message="Net worth is charted from recorded snapshots. There's only one so far."
              />
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <BreakdownList title="Assets" items={data.assetBreakdown} accent="#60a5fa" />
              <BreakdownList
                title="Liabilities"
                items={data.liabilityBreakdown}
                accent="#fb7185"
              />
            </div>
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        title="Projection"
        description="Where the backend's retirement forecast puts this position."
        result={forecast}
        emptyTitle="No projection available"
        emptyMessage="The retirement forecast endpoint returned nothing for this account."
      >
        {(data) => <ForecastPanel forecast={data} />}
      </AnalyticsSection>
    </div>
  );
};
