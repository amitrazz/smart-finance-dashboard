import React from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useFinancialHealth } from "../hooks/useInsightsQueries";
import { AnalyticsSection } from "../components/common/AnalyticsSection";
import { HealthScoreCard } from "../components/health/HealthScoreCard";
import { HealthDimensionGrid } from "../components/health/HealthDimensionGrid";
import { lowestScoringDimensions } from "../utils/healthRanking";
import { HealthDimensionCard } from "../components/health/HealthDimensionCard";
import { ChartFrame } from "../components/charts/ChartFrame";
import { CHART_AXIS, CHART_GRID } from "../components/charts/chartConfig";
import { EmptyAnalyticsState } from "../components/common/AnalyticsStates";
import { healthStatus } from "../utils/insightsFormat";
import { FinancialHealthOverview } from "../types/insightsTypes";

/**
 * The full health diagnostic, moved off Overview.
 *
 * Overview answers "how am I doing"; this page answers "why". That split is the
 * whole reason the eight-dimension grid, the score history and the improvement
 * list live here — together they were the single biggest contributor to the old
 * Overview's vertical density.
 */
export const HealthPage: React.FC = () => {
  const health = useFinancialHealth();

  return (
    <div className="space-y-10">
      <AnalyticsSection
        title="Health score"
        description="A weighted view across every dimension the engine scores."
        result={health}
        emptyTitle="No health score yet"
        emptyMessage="The health engine hasn't scored this account. Add accounts and transactions, then recalculate from Settings."
        asOf={health.data?.asOf}
      >
        {(data) => (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <HealthScoreCard health={data} updatedAt={health.updatedAt} />
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection
        title="Score history"
        description="How the overall score has moved across recorded snapshots."
        result={health}
      >
        {(data) => <HealthHistory health={data} />}
      </AnalyticsSection>

      <AnalyticsSection
        title="Improvement areas"
        description="The lowest-scoring dimensions, with what the engine says would move them."
        result={health}
      >
        {(data) => {
          const areas = lowestScoringDimensions(data.dimensions, 3).filter((d) => d.improvement);
          if (areas.length === 0) {
            return (
              <EmptyAnalyticsState
                title="No improvement guidance"
                message="The engine scored your dimensions but didn't attach suggestions to them."
              />
            );
          }
          return (
            <ol className="space-y-3">
              {areas.map((dimension, index) => (
                <li key={dimension.code} className="flex gap-3">
                  <span
                    className="mt-3 h-6 w-6 shrink-0 rounded-full border border-slate-700 bg-slate-900 text-center text-xs font-semibold leading-6 text-slate-400"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <HealthDimensionCard dimension={dimension} />
                  </div>
                </li>
              ))}
            </ol>
          );
        }}
      </AnalyticsSection>

      <AnalyticsSection
        title="All dimensions"
        description="Every dimension the engine scores, weakest first. Expand any one for its reasoning."
        result={health}
      >
        {(data) => <HealthDimensionGrid dimensions={data.dimensions} />}
      </AnalyticsSection>
    </div>
  );
};

const HealthHistory: React.FC<{ health: FinancialHealthOverview }> = ({ health }) => {
  if (health.history.length < 2) {
    return (
      <EmptyAnalyticsState
        title="Not enough history"
        message="A trend needs at least two recorded snapshots. One more scoring run and this will fill in."
      />
    );
  }

  const first = health.history[0];
  const last = health.history[health.history.length - 1];
  const stroke = healthStatus(health.rating).stroke;

  return (
    <ChartFrame
      height={200}
      description={`Health score across ${health.history.length} snapshots, from ${first.score} on ${first.date} to ${last.score} on ${last.date}.`}
    >
      <LineChart data={health.history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid {...CHART_GRID} />
        <XAxis dataKey="date" {...CHART_AXIS} minTickGap={24} />
        <YAxis domain={[0, 100]} {...CHART_AXIS} />
        <Tooltip
          contentStyle={{
            background: "#020617",
            border: "1px solid #334155",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Line
          type="monotone"
          dataKey="score"
          name="Score"
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 2.5, fill: stroke }}
        />
      </LineChart>
    </ChartFrame>
  );
};
