import React, { useMemo, useState } from "react";
import { InsightsRoute } from "../insightsNav";
import {
  useCashFlowAnalytics,
  useDebtAnalytics,
  useFinancialHealth,
  useForecastAnalytics,
  useIntelligenceFeed,
  useNetWorthAnalytics,
} from "../hooks/useInsightsQueries";
import { FinancialChange, mapChanges } from "../api/insightsMappers";
import { IntelligenceItem, attentionCount } from "../api/intelligenceModel";
import { buildFinancialStory } from "../utils/financialStory";
import { FinancialMetric, MetricRow } from "../components/primitives/FinancialMetric";
import { InsightsSection } from "../components/primitives/InsightsSection";
import { SectionHeader } from "../components/primitives/SectionHeader";
import { Surface } from "../components/primitives/Surface";
import {
  FeedSkeleton,
  InsightsEmptyState,
  InsightsErrorState,
  MetricRowSkeleton,
  StorySkeleton,
} from "../components/primitives/States";
import { FinancialStory } from "../components/overview/FinancialStory";
import { WhatChanged } from "../components/overview/WhatChanged";
import { MoneyFlow } from "../components/overview/MoneyFlow";
import { TrajectoryStrip } from "../components/overview/TrajectoryStrip";
import { InsightCard } from "../components/intelligence/InsightCard";
import { InsightDetail } from "../components/intelligence/InsightDetail";
import { healthStatus } from "../utils/insightsFormat";
import { useUIStore } from "../../../store/useUIStore";
import { Money } from "../../../types";

interface OverviewPageProps {
  onNavigate: (route: InsightsRoute) => void;
}

/**
 * The thirty-second answer.
 *
 * The page is ordered by the questions people arrive with, and each one is
 * answered before the next is asked:
 *
 * 1. *How am I doing?*        → the story, in sentences, first and largest,
 *                               with the four figures that locate it.
 * 2. *What should I do?*      → one action, the highest-ranked one.
 * 3. *What changed?*          → improved on the left, attention on the right.
 * 4. *Where did it go?*       → the flow from income to what stayed.
 * 5. *Where is this heading?* → today against the projection, in one strip.
 * 6. *How resilient am I?*    → the score, with the diagnosis one click away.
 *
 * The previous Overview opened with a health score and three weakest dimensions,
 * then risks, then a change grid, then recommendations, then a retirement
 * forecast — a diagnostic ordering, which is the right order for someone who has
 * already decided something is wrong and the wrong order for everyone else. The
 * health score now lives on Health, one click away, where the diagnosis belongs.
 *
 * Each block loads on its own. A slow investments query cannot hold up the
 * sentence that answers the question the user actually came with.
 */
export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const netWorth = useNetWorthAnalytics();
  const cashFlow = useCashFlowAnalytics();
  const debt = useDebtAnalytics();
  const health = useFinancialHealth();
  const feed = useIntelligenceFeed();
  const forecast = useForecastAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  const [openItem, setOpenItem] = useState<IntelligenceItem | null>(null);

  const changes = useMemo(
    () => mapChanges(netWorth.data, cashFlow.data),
    [netWorth.data, cashFlow.data],
  );

  const story = useMemo(
    () => buildFinancialStory({ netWorth: netWorth.data, cashFlow: cashFlow.data, changes }),
    [netWorth.data, cashFlow.data, changes],
  );

  const positionLoading = netWorth.isLoading || cashFlow.isLoading;
  const positionFailed = netWorth.isError && cashFlow.isError;
  const nextAction = feed.data?.[0] ?? null;
  const needsAttention = feed.data ? attentionCount(feed.data) : 0;

  return (
    <div className="space-y-6">
      {/* ---- 1. How am I doing? ---------------------------------------- */}
      <Surface level="raised">
        <section className="space-y-4 p-4 sm:p-6" aria-label="Financial story">
          {positionLoading ? (
            <StorySkeleton />
          ) : positionFailed ? (
            <InsightsErrorState
              onRetry={() => {
                netWorth.refetch();
                cashFlow.refetch();
              }}
            />
          ) : story ? (
            <FinancialStory story={story} />
          ) : (
            <InsightsEmptyState
              reason="insufficient-history"
              title="Not enough history to tell you what changed"
              message="Two recorded periods are needed before movement can be measured. Import a statement to backfill history."
              action={{ label: "Import statement", onClick: () => navigateToRoute("imports") }}
            />
          )}

          <div className="border-t border-slate-800/70 pt-4">
            {positionLoading ? (
              <MetricRowSkeleton />
            ) : (
              <FinancialSnapshot
                changes={changes}
                netWorth={netWorth.data?.currentNetWorth ?? null}
                netCashFlow={cashFlow.data?.netCashFlow ?? null}
                savingsRate={cashFlow.data?.savingsRatePercent ?? null}
                totalDebt={debt.data?.totalDebt ?? null}
              />
            )}
          </div>
        </section>
      </Surface>

      {/* ---- 2. What should I do next? --------------------------------- */}
      <InsightsSection
        title="Do this next"
        description="The highest-priority finding, ranked by amount at stake, urgency, detection confidence and whether you can act on it."
        result={feed}
        link={{
          label:
            needsAttention > 0
              ? `${needsAttention} need${needsAttention === 1 ? "s" : ""} attention`
              : "All intelligence",
          onClick: () => onNavigate({ section: "intelligence", view: null }),
        }}
        skeleton={<FeedSkeleton rows={1} />}
        empty={{
          reason: "no-data",
          title: "Nothing needs your attention",
          message:
            "No rule has flagged anything against your accounts, cards, loans or goals, and the health engine has no suggestions open.",
        }}
      >
        {() =>
          nextAction ? <InsightCard item={nextAction} onOpen={setOpenItem} featured /> : null
        }
      </InsightsSection>

      {/* ---- 3. What changed? ------------------------------------------ */}
      <Surface>
        <section className="space-y-4 p-4 sm:p-5" aria-label="What changed">
          <SectionHeader
            title="What changed"
            description="Movement between two recorded snapshots, sorted by whether it went your way."
          />
          {positionLoading ? <MetricRowSkeleton columns={2} /> : <WhatChanged changes={changes} />}
        </section>
      </Surface>

      {/* ---- 4. Where did it go? --------------------------------------- */}
      <InsightsSection
        title="Money flow"
        description="What came in this period, and how much of it stayed."
        result={cashFlow}
        link={{
          label: "Cash flow analytics",
          onClick: () => onNavigate({ section: "analytics", view: "cash-flow" }),
        }}
        empty={{
          reason: "no-data",
          title: "No cash-flow snapshot yet",
          message: "This is computed from recorded income and expenses.",
          action: { label: "Import statement", onClick: () => navigateToRoute("imports") },
        }}
      >
        {(data) => <MoneyFlow cashFlow={data} />}
      </InsightsSection>

      {/* ---- 5. Where is this heading? --------------------------------- */}
      <InsightsSection
        title="Where this is heading"
        description="Your position today against the engine's retirement projection."
        result={forecast}
        link={{
          label: "Net worth analytics",
          onClick: () => onNavigate({ section: "analytics", view: "net-worth" }),
        }}
        skeleton={<MetricRowSkeleton columns={3} />}
        empty={{
          reason: "insufficient-history",
          title: "No projection yet",
          message: "The retirement forecast needs recorded net worth to project from.",
        }}
      >
        {(data) => <TrajectoryStrip forecast={data} />}
      </InsightsSection>

      {/* ---- 6. How resilient am I? ------------------------------------ */}
      <InsightsSection
        title="Financial health"
        description="A weighted score across every dimension the engine measures."
        result={health}
        link={{ label: "Full diagnostic", onClick: () => onNavigate({ section: "health", view: null }) }}
        skeleton={<MetricRowSkeleton columns={2} />}
        empty={{
          reason: "processing",
          title: "No health score yet",
          message:
            "The engine hasn't scored this account. Add accounts and transactions, then recalculate from Settings.",
        }}
      >
        {(data) => (
          <MetricRow columns={3}>
            <FinancialMetric
              label="Health score"
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
              caption="The engine's own band for this score"
            />
            <FinancialMetric
              label="Dimensions scored"
              value={data.dimensions.filter((d) => d.score !== null).length}
              precision={0}
              caption={`of ${data.dimensions.length} measured`}
            />
          </MetricRow>
        )}
      </InsightsSection>

      <InsightDetail item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
};

/**
 * The four figures that locate someone financially: what they own net of what
 * they owe, what this period produced, what share of income they kept, and what
 * they owe.
 *
 * Each carries its own movement, so the row answers "where am I" and "which way
 * am I going" in one read. A figure with no prior period shows no comparison
 * rather than a zero change.
 */
const FinancialSnapshot: React.FC<{
  changes: FinancialChange[];
  netWorth: Money | null;
  netCashFlow: Money | null;
  savingsRate: number | null;
  totalDebt: Money | null;
}> = ({ changes, netWorth, netCashFlow, savingsRate, totalDebt }) => {
  const byId = new Map(changes.map((change) => [change.id, change]));
  const netWorthChange = byId.get("net-worth");
  const savingsChange = byId.get("savings-rate");
  const debtChange = byId.get("debt");

  return (
    <MetricRow>
      <FinancialMetric
        label="Net worth"
        value={netWorth}
        money
        change={
          netWorthChange
            ? {
                amount: netWorthChange.amount,
                percent: netWorthChange.percent,
                upIsGood: true,
              }
            : null
        }
        caption="Assets minus liabilities"
      />
      <FinancialMetric
        label="Net cash flow"
        value={netCashFlow}
        money
        tone={netCashFlow && Number(netCashFlow.amount) < 0 ? "negative" : undefined}
        caption="What this period produced"
      />
      <FinancialMetric
        label="Savings rate"
        value={savingsRate}
        suffix="%"
        tone={savingsRate !== null && savingsRate < 0 ? "negative" : undefined}
        change={
          savingsChange ? { points: savingsChange.points, upIsGood: true } : null
        }
        caption="Share of income kept"
      />
      <FinancialMetric
        label="Debt"
        value={totalDebt}
        money
        change={
          debtChange
            ? { amount: debtChange.amount, percent: debtChange.percent, upIsGood: false }
            : null
        }
        caption="Outstanding balance"
      />
    </MetricRow>
  );
};
