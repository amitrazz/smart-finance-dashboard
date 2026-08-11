import React, { useState } from "react";
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  useRecommendations,
  useRiskMatrix,
  useSpendingAnalytics,
  useTrendAnalytics,
} from "../hooks/useInsightsQueries";
import { AnalyticsSection } from "../components/common/AnalyticsSection";
import { RecommendationCard } from "../components/intelligence/RecommendationCard";
import { RiskCard } from "../components/intelligence/RiskCard";
import { RiskFilter, RiskSummary } from "../components/intelligence/RiskSummary";
import { ChartFrame, ChartLegendItem, MoneyTooltip } from "../components/charts/ChartFrame";
import { CHART_AXIS, CHART_GRID, useCompactMoneyAxis } from "../components/charts/chartConfig";
import { EmptyAnalyticsState } from "../components/common/AnalyticsStates";
import { Money } from "../../../components/common/Money";
import { IMPACT, shortPeriodLabel, sortRecommendations, sortRisks } from "../utils/insightsFormat";
import { RecommendationImpact } from "../types/insightsTypes";
import { AskSection } from "./intelligence/AskSection";
import { formatDate } from "../../../utils/formatters";

/**
 * Intelligence: what to know, what to worry about, what to do.
 *
 * Kept separate from Analytics because the questions are different in kind.
 * Analytics answers "what are my numbers"; this answers "so what". The four
 * item types here are deliberately distinguishable at a glance:
 *
 * - **Recommendation** — action-oriented, filled button, impact bucket.
 * - **Risk** — needs attention, severity rule down the left edge.
 * - **Anomaly** — unusual behaviour, dated, stated as an observation.
 * - **Trend** — direction over time, charted rather than listed.
 *
 * Previously all four shared one card shape, so a warning and a suggestion were
 * indistinguishable until read.
 */
export const IntelligencePage: React.FC<{ view: string | null }> = ({ view }) => {
  switch (view) {
    case "risks":
      return <RisksView />;
    case "anomalies":
      return <AnomaliesView />;
    case "trends":
      return <TrendsView />;
    case "ask":
      return <AskSection />;
    case "actions":
    default:
      return <ActionsView />;
  }
};

// ---------------------------------------------------------------------------

const IMPACT_ORDER: RecommendationImpact[] = ["HIGH_IMPACT", "QUICK_WIN", "LONG_TERM"];

/**
 * Recommendations as a priority inbox, grouped by impact bucket and ordered
 * within each by the score movement the engine attributes.
 */
const ActionsView: React.FC = () => {
  const recommendations = useRecommendations();

  return (
    <AnalyticsSection
      title="Recommended actions"
      description="Grouped by impact. Within each group, largest attributed effect first."
      result={recommendations}
      emptyTitle="No recommendations right now"
      emptyMessage="The health engine hasn't produced any suggestions for this account."
    >
      {(items) => {
        const sorted = sortRecommendations(items);
        return (
          <div className="space-y-8">
            {IMPACT_ORDER.map((bucket) => {
              const group = sorted.filter((r) => r.impactType === bucket);
              if (group.length === 0) return null;
              return (
                <div key={bucket} className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {IMPACT[bucket].label}
                    <span className="ml-2 tabular-nums text-slate-600">{group.length}</span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.map((recommendation) => (
                      <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }}
    </AnalyticsSection>
  );
};

// ---------------------------------------------------------------------------

const RisksView: React.FC = () => {
  const risks = useRiskMatrix();
  const [filter, setFilter] = useState<RiskFilter>("ALL");

  return (
    <AnalyticsSection
      title="Risks"
      description="Everything the action rules flagged, with the evidence behind each."
      result={risks}
      emptyTitle="No active risks"
      emptyMessage="Nothing was flagged against your accounts, cards, loans or goals."
    >
      {(matrix) => {
        const visible = sortRisks(matrix.risks).filter(
          (risk) => filter === "ALL" || risk.severity === filter,
        );
        return (
          <div className="space-y-5">
            <RiskSummary matrix={matrix} active={filter} onFilterChange={setFilter} />
            {visible.length === 0 ? (
              <EmptyAnalyticsState
                title="No risks at this severity"
                message="Clear the filter to see the rest."
              />
            ) : (
              <div className="space-y-3">
                {visible.map((risk) => (
                  <RiskCard key={risk.id} risk={risk} />
                ))}
              </div>
            )}
          </div>
        );
      }}
    </AnalyticsSection>
  );
};

// ---------------------------------------------------------------------------

/**
 * Anomalies come from the Smart Action feed's own detections.
 *
 * The previous implementation invented them client-side: any day whose outflow
 * exceeded twice the trailing 14-day average was declared an "Unusual Daily
 * Spend", so a single rent payment reliably produced a monthly "anomaly".
 */
const AnomaliesView: React.FC = () => {
  const spending = useSpendingAnalytics();

  return (
    <AnalyticsSection
      title="Anomalies"
      description="Behaviour the detection rules flagged as breaking your usual pattern."
      result={spending}
      emptyTitle="Nothing unusual detected"
      emptyMessage="Anomalies are raised by backend rules. None are active."
    >
      {(data) =>
        data.anomalies.length === 0 ? (
          <EmptyAnalyticsState
            title="Nothing unusual detected"
            message="No rule has flagged anomalous activity on your accounts."
          />
        ) : (
          <ul className="space-y-3">
            {data.anomalies.map((anomaly) => (
              <li
                key={anomaly.id}
                className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-medium text-slate-100">{anomaly.title}</h3>
                  <span className="text-[11px] text-slate-500">{formatDate(anomaly.date)}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{anomaly.description}</p>
                <p className="text-sm font-medium tabular-nums text-slate-200">
                  <Money value={anomaly.amount} />
                </p>
              </li>
            ))}
          </ul>
        )
      }
    </AnalyticsSection>
  );
};

// ---------------------------------------------------------------------------

const TrendsView: React.FC = () => {
  const trends = useTrendAnalytics();
  const formatAxis = useCompactMoneyAxis();

  return (
    <AnalyticsSection
      title="Trends"
      description="Income against expenses over the selected window."
      result={trends}
      emptyTitle="No trend data"
      emptyMessage="Trends need recorded income or expense history over multiple months."
    >
      {(data) =>
        data.trends.length < 2 ? (
          <EmptyAnalyticsState
            title="Not enough history"
            message="A trend needs at least two months of recorded data."
          />
        ) : (
          <ChartFrame
            height={260}
            description={`Income and expenses across ${data.trends.length} months, from ${data.trends[0].period} to ${data.trends[data.trends.length - 1].period}.`}
            legend={
              <>
                <ChartLegendItem color="#34d399" label="Income" />
                <ChartLegendItem color="#fb7185" label="Expenses" />
              </>
            }
          >
            <LineChart data={data.trends} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis
                dataKey="period"
                {...CHART_AXIS}
                tickFormatter={shortPeriodLabel}
                minTickGap={16}
              />
              <YAxis {...CHART_AXIS} tickFormatter={formatAxis} width={56} />
              <Tooltip content={<MoneyTooltip labelFormatter={shortPeriodLabel} />} />
              {/* `connectNulls` is off: a month the backend didn't report leaves a
                  visible gap rather than a straight line implying measurement. */}
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Expenses"
                stroke="#fb7185"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ChartFrame>
        )
      }
    </AnalyticsSection>
  );
};
