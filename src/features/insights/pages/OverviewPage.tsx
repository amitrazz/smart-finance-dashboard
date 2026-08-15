import React, { useMemo, useState } from "react";
import { InsightsRoute } from "../insightsNav";
import {
  useCashFlowAnalytics,
  useDebtAnalytics,
  useFinancialHealth,
  useForecastAnalytics,
  useIntelligenceFeed,
  useNetWorthAnalytics,
  useHistoricalInsights,
} from "../hooks/useInsightsQueries";
import {
  useDismissAction,
  useCompleteAction,
  useSnoozeAction,
} from "../../actions/hooks/useSmartActions";
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
import { dimensionStatus, healthStatus } from "../utils/insightsFormat";
import { useUIStore } from "../../../store/useUIStore";
import { Money } from "../../../components/common/Money";
import type { Money as MoneyValue } from "../../../types";

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

  const dismissMutation = useDismissAction();
  const completeMutation = useCompleteAction();
  const snoozeMutation = useSnoozeAction();

  const [openItem, setOpenItem] = useState<IntelligenceItem | null>(null);

  const changes = useMemo(
    () => mapChanges(netWorth.data, cashFlow.data),
    [netWorth.data, cashFlow.data],
  );

  const positionLoading = netWorth.isLoading || cashFlow.isLoading;
  const positionFailed = netWorth.isError && cashFlow.isError;
  const nextAction = feed.data?.[0] ?? null;
  const needsAttention = feed.data ? attentionCount(feed.data) : 0;

  const story = useMemo(
    () =>
      buildFinancialStory({
        netWorth: netWorth.data,
        cashFlow: cashFlow.data,
        changes,
        attentionCount: needsAttention,
        healthRating: health.data?.rating,
      }),
    [netWorth.data, cashFlow.data, changes, needsAttention, health.data?.rating],
  );

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
                liquidity={
                  netWorth.data?.assetBreakdown.find((a) => a.category === "Cash & savings")?.value ??
                  null
                }
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
          nextAction ? (
            <InsightCard
              item={nextAction}
              onOpen={setOpenItem}
              featured
              onComplete={(id, version) => completeMutation.mutate({ id, version })}
              onDismiss={(id, version) => dismissMutation.mutate({ id, version })}
              onSnooze={(id, version, snoozedUntil) =>
                snoozeMutation.mutate({ id, version, snoozedUntil })
              }
            />
          ) : null
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

      {/* ---- Why it changed ---- */}
      <Surface>
        <section className="space-y-4 p-4 sm:p-5" aria-label="Why it changed">
          <SectionHeader
            title="Why it changed"
            description="Contributing factors and primary drivers of your cash flow and spending this period."
          />
          {positionLoading ? (
            <MetricRowSkeleton columns={2} />
          ) : cashFlow.data ? (
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Income Drivers</span>
                {cashFlow.data.largestIncomeSource ? (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">
                      Primary driver: <span className="font-semibold text-slate-200">{cashFlow.data.largestIncomeSource.name}</span>
                    </p>
                    <p className="text-sm font-extrabold text-slate-100">
                      <Money value={cashFlow.data.largestIncomeSource.amount} fractionDigits={0} />
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No income source details available for this period.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spending Drivers</span>
                {cashFlow.data.largestExpenseCategory ? (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">
                      Primary driver: <span className="font-semibold text-slate-200">{cashFlow.data.largestExpenseCategory.name}</span>
                    </p>
                    <p className="text-sm font-extrabold text-slate-100">
                      <Money value={cashFlow.data.largestExpenseCategory.amount} fractionDigits={0} />
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No spending category details available for this period.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Detailed drivers aren't available for this period.</p>
          )}
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
        {(data) => {
          const status = healthStatus(data.rating);
          return (
            <div className="grid gap-6 md:grid-cols-5 items-stretch">
              {/* Score section (2/5 cols on desktop) */}
              <div className="md:col-span-2 flex flex-col justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall score</p>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold tracking-tight ${status.text}`}>
                      {data.overallScore}
                    </span>
                    <span className="text-slate-500 text-sm">/ 100</span>
                  </div>
                  <p className={`text-sm font-bold uppercase tracking-wider ${status.text}`}>
                    {status.label}
                  </p>
                </div>
                {data.monthlyTrend !== null && data.monthlyTrend !== 0 && (
                  <p className="text-xs text-slate-400 font-medium">
                    Trend:{" "}
                    <span className={data.monthlyTrend > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {data.monthlyTrend > 0 ? "+" : "−"}
                      {Math.abs(data.monthlyTrend)} pts
                    </span>{" "}
                    vs last snapshot
                  </p>
                )}
              </div>

              {/* Dimensions list (3/5 cols on desktop) */}
              <div className="md:col-span-3 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dimension Breakdown</p>
                <ul className="divide-y divide-slate-850 text-xs">
                  {data.dimensions.map((d) => {
                    const dimStat = dimensionStatus(d.score);
                    return (
                      <li key={d.code} className="flex justify-between items-center py-2">
                        <span className="text-slate-300 font-medium">{d.label}</span>
                        <span className={`font-bold ${dimStat.text}`}>
                          {d.score !== null ? `${d.score} (${dimStat.label})` : "Unscored"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        }}
      </InsightsSection>

      <InsightDetail
        item={openItem}
        onClose={() => setOpenItem(null)}
        onComplete={(id, version) => completeMutation.mutate({ id, version })}
        onDismiss={(id, version) => dismissMutation.mutate({ id, version })}
        onSnooze={(id, version, snoozedUntil) =>
          snoozeMutation.mutate({ id, version, snoozedUntil })
        }
      />

      {/* ---- 7. Recent insights history -------------------------------- */}
      <HistoricalInsightsList />
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
  netWorth: MoneyValue | null;
  netCashFlow: MoneyValue | null;
  liquidity: MoneyValue | null;
  totalDebt: MoneyValue | null;
}> = ({ changes, netWorth, netCashFlow, liquidity, totalDebt }) => {
  const byId = new Map(changes.map((change) => [change.id, change]));
  const netWorthChange = byId.get("net-worth");
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
        label="Liquidity"
        value={liquidity}
        money
        caption="Liquid cash & savings"
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

const HistoricalInsightsList: React.FC = () => {
  const history = useHistoricalInsights();

  if (history.isLoading) {
    return <MetricRowSkeleton columns={1} />;
  }

  if (history.isError || !history.data || history.data.length === 0) {
    return null;
  }

  return (
    <Surface>
      <section className="space-y-4 p-4 sm:p-5" aria-label="Recent insights history">
        <SectionHeader
          title="Recent Insights & Actions History"
          description="A record of recent actions you completed or dismissed."
        />
        <ul className="divide-y divide-slate-800/40">
          {history.data.map((item) => {
            const dateLabel = item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "";

            const dateStr = item.dueInDays !== null ? `Due in ${item.dueInDays}d` : "";
            const impactStr = item.financialImpact
              ? ` · ₹${Math.abs(Number(item.financialImpact.amount)).toLocaleString("en-IN")}`
              : "";
            const statusLabel = item.status === "COMPLETED" ? "🟢 Completed" : "⚪ Dismissed";

            return (
              <li key={item.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {dateLabel && (
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {dateLabel}:
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.observed}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {statusLabel}
                  </span>
                  {(dateStr || impactStr) && (
                    <p className="text-[9px] text-slate-500 mt-1">
                      {dateStr}
                      {impactStr}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Surface>
  );
};
