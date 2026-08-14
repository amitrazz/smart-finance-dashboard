import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InsightsRoute } from "../insightsNav";
import { useFinancialHealth } from "../hooks/useInsightsQueries";
import {
  FinancialHealthOverview,
  HealthDimension,
  HealthScoreAttribution,
} from "../types/insightsTypes";
import { InsightsSection } from "../components/primitives/InsightsSection";
import { FinancialMetric, MetricRow } from "../components/primitives/FinancialMetric";
import { ChartSkeleton, InsightsEmptyState } from "../components/primitives/States";
import { HealthScoreCard } from "../components/health/HealthScoreCard";
import { HealthDimensionGrid } from "../components/health/HealthDimensionGrid";
import { HealthDimensionCard } from "../components/health/HealthDimensionCard";
import { lowestScoringDimensions } from "../utils/healthRanking";
import { CHART_AXIS, CHART_GRID, useChartAnimation } from "../components/charts/chartConfig";
import { TONE_TEXT, directionalTone } from "../components/primitives/tone";
import {
  dimensionStatus,
  formatPoints,
  healthStatus,
  shortPeriodLabel,
} from "../utils/insightsFormat";

/**
 * Health: how resilient are these finances, and what is deciding that?
 *
 * Overview answers "how am I doing". This page answers "why is the answer what
 * it is", which is a different job and needs a different shape: the score, then
 * what is carrying it and what is holding it back, then its history, then every
 * dimension with the engine's reasoning behind each.
 *
 * ## One thing this page deliberately does not claim
 *
 * The brief asked for "why your score changed". The engine publishes a current
 * score per dimension and a history of the *overall* score — but no per-dimension
 * history. So "your score fell because liquidity dropped" is not a statement this
 * data can support, and writing it would mean guessing which dimension moved.
 *
 * What the data does support is what each dimension is doing to the score *now*,
 * which is what the two columns below report — and the overall trend, which the
 * chart reports. The distinction is the difference between a diagnosis and a
 * plausible-sounding story.
 */
export const HealthPage: React.FC<{ onNavigate: (route: InsightsRoute) => void }> = ({
  onNavigate,
}) => {
  const health = useFinancialHealth();

  return (
    <div className="space-y-5">
      <InsightsSection
        title="Financial health"
        description="A weighted score across every dimension the engine measures."
        result={health}
        link={{
          label: "What to do about it",
          onClick: () => onNavigate({ section: "intelligence", view: "feed" }),
        }}
        empty={{
          reason: "processing",
          title: "No health score yet",
          message:
            "The engine hasn't scored this account. Add accounts and transactions, then recalculate from Settings.",
        }}
      >
        {(data) => (
          <div className="space-y-5">
            <HealthScoreCard health={data} />
            <div className="border-t border-slate-800/70 pt-4">
              <MetricRow columns={3}>
                <FinancialMetric
                  label="Score"
                  value={data.overallScore}
                  suffix=" / 100"
                  precision={0}
                  change={
                    data.monthlyTrend !== null
                      ? { points: data.monthlyTrend, upIsGood: true, caption: "vs previous snapshot" }
                      : null
                  }
                />
                <FinancialMetric
                  label="Rating"
                  value={healthStatus(data.rating).label}
                  caption="The engine's band for this score"
                />
                <FinancialMetric
                  label="Measured dimensions"
                  value={data.dimensions.filter((d) => d.score !== null).length}
                  precision={0}
                  caption={`of ${data.dimensions.length} the engine tracks`}
                />
              </MetricRow>
            </div>
          </div>
        )}
      </InsightsSection>

      <InsightsSection
        title="What's deciding your score"
        description="Where the engine scores you strongest and weakest."
        result={health}
        empty={{ reason: "processing" }}
      >
        {(data) =>
          data.scoreAttribution.length > 0 ? (
            <ScoreAttribution attribution={data.scoreAttribution} trend={data.monthlyTrend} />
          ) : (
            <HealthDrivers dimensions={data.dimensions} />
          )
        }
      </InsightsSection>

      <InsightsSection
        title="Score history"
        description="How the overall score has moved across recorded snapshots."
        result={health}
        skeleton={<ChartSkeleton height={200} />}
        empty={{ reason: "insufficient-history" }}
      >
        {(data) => <HealthHistory health={data} />}
      </InsightsSection>

      <InsightsSection
        title="Every dimension"
        description="Weakest first. Expand any one for the engine's reasoning and its suggested next step."
        result={health}
        empty={{ reason: "processing" }}
      >
        {(data) => <HealthDimensionGrid dimensions={data.dimensions} />}
      </InsightsSection>
    </div>
  );
};

// ---------------------------------------------------------------------------

/**
 * Why the score moved — rendered only when the engine says why.
 *
 * This is the shape the page takes the day a `scoreAttribution` field ships. It
 * is deliberately written now and left dormant, because the alternative
 * (retrofitting attribution later) is what tempts a frontend into deriving it
 * from data that cannot support it.
 */
const ScoreAttribution: React.FC<{
  attribution: HealthScoreAttribution[];
  trend: number | null;
}> = ({ attribution, trend }) => {
  const ranked = [...attribution].sort(
    (a, b) => Math.abs(b.pointsContributed) - Math.abs(a.pointsContributed),
  );

  return (
    <div className="space-y-3">
      {trend !== null && (
        <p className="text-sm text-slate-300">
          Your score {trend > 0 ? "improved" : trend < 0 ? "fell" : "held"}
          {trend !== 0 && (
            <>
              {" by "}
              <span className="font-semibold tabular-nums text-slate-100">
                {Math.abs(trend)} pts
              </span>
            </>
          )}
          . Here is what moved it.
        </p>
      )}
      <ul className="divide-y divide-slate-800/60">
        {ranked.map((entry) => {
          const tone = directionalTone(entry.pointsContributed, true);
          return (
            <li
              key={entry.code}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-slate-300">{entry.label}</span>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${TONE_TEXT[tone]}`}>
                {entry.pointsContributed > 0 ? "+" : entry.pointsContributed < 0 ? "−" : ""}
                {Math.abs(entry.pointsContributed)} pts
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Strongest and weakest, side by side — the honest fallback while the engine
 * publishes no attribution.
 *
 * Ranked by score, and unscored dimensions appear in neither column: an
 * unmeasured dimension is not a weak one, and sorting it to the bottom would
 * make it look like the biggest problem on the page.
 *
 * The reason this is a standing reading rather than an explanation of the change
 * is kept to one muted line at the foot, not stated in the section header. The
 * distinction matters to anyone auditing the number and to nobody else, and a
 * paragraph of caveat above real content makes a working product read as a
 * broken one.
 */
const HealthDrivers: React.FC<{ dimensions: HealthDimension[] }> = ({ dimensions }) => {
  const scored = dimensions.filter((d) => d.score !== null);

  if (scored.length === 0) {
    return (
      <InsightsEmptyState
        reason="processing"
        title="No dimension was scored"
        message="The engine produced an overall score but no dimension breakdown for this snapshot."
      />
    );
  }

  const weakest = lowestScoringDimensions(scored, 3);
  const strongest = [...scored]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .filter((dimension) => !weakest.some((w) => w.code === dimension.code));

  return (
    <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-slate-400">
          Holding the score back
        </h3>
        <div className="divide-y divide-slate-800/60">
          {weakest.map((dimension) => (
            <HealthDimensionCard key={dimension.code} dimension={dimension} variant="row" />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-slate-400">
          Carrying the score
        </h3>
        {strongest.length === 0 ? (
          <p className="py-2 text-xs text-slate-500">
            Every scored dimension is among the weakest — there is no stronger group to contrast
            them with yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/60 [&+p]:mt-2">
            {strongest.map((dimension) => {
              const status = dimensionStatus(dimension.score);
              return (
                <li
                  key={dimension.code}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-slate-300">{dimension.label}</span>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${status.text}`}>
                    {dimension.score}
                    <span className="text-[11px] font-normal text-slate-600"> / 100</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/*
        Progressive disclosure, not a banner. Someone auditing the number can
        find out that this is a standing reading rather than an attribution of
        the change; everyone else sees a working section.
      */}
      <details className="group sm:col-span-2">
        <summary className="cursor-pointer list-none text-[11px] text-slate-600 transition-colors hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60">
          How this is measured
        </summary>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-slate-500">
          These are current dimension scores. The engine publishes a history for the overall score
          but not for individual dimensions, so this shows what is strong and weak today rather
          than which dimension moved the score — that would require attribution the engine doesn't
          produce yet.
        </p>
      </details>
    </div>
  );
};

// ---------------------------------------------------------------------------

const HealthHistory: React.FC<{ health: FinancialHealthOverview }> = ({ health }) => {
  const animation = useChartAnimation();

  if (health.history.length < 2) {
    return (
      <InsightsEmptyState
        reason="insufficient-history"
        message="A trend needs at least two recorded snapshots. One more scoring run and this fills in."
      />
    );
  }

  const first = health.history[0];
  const last = health.history[health.history.length - 1];
  const movement = last.score - first.score;
  const stroke = healthStatus(health.rating).stroke;
  const summary = `Health score across ${health.history.length} snapshots, ${first.score} on ${first.date} to ${last.score} on ${last.date}.`;

  return (
    <figure className="space-y-3">
      {/* The chart answers a question before it draws anything, and the sentence
          is the accessible summary as well as the headline. */}
      <figcaption className="text-sm text-slate-300">
        {movement === 0
          ? "Your score is unchanged across the recorded window."
          : `Your score has ${movement > 0 ? "risen" : "fallen"} ${formatPoints(Math.abs(movement))?.replace(/^[+−]/, "")} across the recorded window.`}
      </figcaption>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={health.history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis
              dataKey="date"
              {...CHART_AXIS}
              tickFormatter={shortPeriodLabel}
              minTickGap={24}
            />
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
              dot={{ r: 2, fill: stroke }}
              {...animation}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="sr-only">{summary}</p>
    </figure>
  );
};
