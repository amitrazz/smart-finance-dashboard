import React from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { ArrowRight, Info } from "lucide-react";
import { ForecastAnalytics } from "../../types/insightsTypes";
import { Money } from "../../../../components/common/Money";
import { MetricValue } from "../common/MetricValue";
import { ProjectionBadge } from "../common/Badges";
import { ChartFrame } from "../charts/ChartFrame";
import { useCompactMoneyAxis } from "../charts/chartConfig";
import { EmptyAnalyticsState } from "../common/AnalyticsStates";

/**
 * Where you are, and where the backend says this leads.
 *
 * ## Why this is a panel and not a projection chart
 *
 * `/analytics/retirement-forecast` returns a *single* corpus figure at a
 * retirement age, the monthly saving required to reach it, and the assumed
 * return. It returns no month-by-month path and no confidence interval.
 *
 * The previous forecast chart drew four points and three series from that one
 * figure: it linearly interpolated between today's net worth and the corpus,
 * plotted the same interpolated series twice under the names "Projected Net
 * Worth" and "Projected Investments", hardcoded "Projected Debt" to a flat zero
 * line, and printed a confidence percentage computed from how many request
 * parameters happened to be defined. Four of those five elements were fiction,
 * and the chart's precision implied a model that does not exist.
 *
 * So: actuals get a chart, because they are a real series. The projection gets
 * figures with a "Projected" badge, an explicit statement of the assumptions it
 * rests on, and no interpolated path to read intermediate values off. The
 * `current → projected` arrow carries the narrative the chart used to fake.
 */
export const ForecastPanel: React.FC<{ forecast: ForecastAnalytics }> = ({ forecast }) => {
  const formatAxis = useCompactMoneyAxis(forecast.currentNetWorth?.currency ?? "INR");
  const hasProjection = Boolean(forecast.projectedCorpus);
  const hasHistory = forecast.history.length >= 2;

  if (!hasProjection && !hasHistory) {
    return (
      <EmptyAnalyticsState
        title="No trajectory yet"
        message="A trajectory needs net-worth history or a retirement projection, and neither is available."
      />
    );
  }

  const first = forecast.history[0];
  const last = forecast.history[forecast.history.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Where you are
          </p>
          <p className="text-xl font-semibold tracking-tight text-slate-100">
            <MetricValue value={forecast.currentNetWorth} money />
          </p>
          {hasHistory && (
            <>
              <ChartFrame
                height={72}
                description={`Net worth from ${first.date} to ${last.date}, moving from ${first.netWorth} to ${last.netWorth}.`}
              >
                <AreaChart data={forecast.history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="trajectoryFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin", "dataMax"]} tickFormatter={formatAxis} />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#trajectoryFill)"
                  />
                </AreaChart>
              </ChartFrame>
              <p className="text-[11px] text-slate-500">
                Actual, {forecast.history.length} snapshots
              </p>
            </>
          )}
        </div>

        <ArrowRight
          className="mx-auto hidden h-5 w-5 shrink-0 text-slate-600 lg:block"
          aria-hidden="true"
        />

        <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Where this leads
            </p>
            <ProjectionBadge />
          </div>

          <p className="text-xl font-semibold tracking-tight text-slate-100">
            <MetricValue value={forecast.projectedCorpus} money />
          </p>

          <p className="text-[11px] leading-relaxed text-slate-400">
            {forecast.retirementAge
              ? `Corpus at age ${forecast.retirementAge}`
              : "Projected corpus"}
            {forecast.currentAge ? `, assuming you are ${forecast.currentAge} today` : ""}
            {forecast.expectedReturnPercent !== null
              ? ` and returns of ${forecast.expectedReturnPercent}% a year`
              : ""}
            .
          </p>

          {forecast.monthlySavingsNeeded && (
            <p className="text-[11px] text-slate-400">
              Requires{" "}
              <span className="font-medium text-slate-200">
                <Money value={forecast.monthlySavingsNeeded} />
              </span>{" "}
              saved monthly.
            </p>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          This is a single end-point projection, not a modelled path — there are no intermediate
          figures and no confidence interval behind it. Ages are the defaults this app asks the
          forecast for, since it doesn't store your date of birth.
        </span>
      </p>
    </div>
  );
};
