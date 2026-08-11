import React, { useMemo } from "react";
import { InsightsRoute } from "../insightsNav";
import {
  useCashFlowAnalytics,
  useDebtAnalytics,
  useFinancialHealth,
  useForecastAnalytics,
  useInvestmentAnalytics,
  useNetWorthAnalytics,
  useRecommendations,
  useRiskMatrix,
} from "../hooks/useInsightsQueries";
import { mapChanges } from "../api/insightsMappers";
import { AnalyticsSection } from "../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../components/common/AnalyticsKpi";
import { PieChart, PiggyBank, ShieldAlert, Wallet } from "lucide-react";
import { HealthScoreCard } from "../components/health/HealthScoreCard";
import { HealthDimensionCard } from "../components/health/HealthDimensionCard";
import { lowestScoringDimensions } from "../utils/healthRanking";
import {
  AttentionRequired,
  NothingNeedsAttention,
} from "../components/overview/AttentionRequired";
import { FinancialChangeGrid } from "../components/overview/FinancialChangeGrid";
import { RecommendationCard } from "../components/intelligence/RecommendationCard";
import { ForecastPanel } from "../components/forecast/ForecastPanel";
import { sortRecommendations } from "../utils/insightsFormat";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
  EmptyAnalyticsState,
} from "../components/common/AnalyticsStates";

interface OverviewPageProps {
  onNavigate: (route: InsightsRoute) => void;
}

/**
 * The executive command center.
 *
 * Answers six questions in the order someone actually asks them, one section
 * each, and hands off everything deeper:
 *
 * 1. How healthy am I?            → score + the three weakest dimensions
 * 2. What needs me right now?     → top risks by severity and due date
 * 3. What changed?                → period-over-period movement
 * 4. What should I do next?       → top recommendations
 * 5. Where is this heading?       → current position and the projection
 *
 * The previous Overview rendered all eight health dimensions with two
 * paragraphs each, four gradient metric cards, two recommendations, two risks
 * and a full forecast chart — with the forecast, the thing that answers "where
 * is this heading", pushed below roughly three screens of diagnostics. Each
 * section here caps what it shows and links to the section that owns the rest.
 */
export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const health = useFinancialHealth();
  const risks = useRiskMatrix();
  const netWorth = useNetWorthAnalytics();
  const cashFlow = useCashFlowAnalytics();
  const debt = useDebtAnalytics();
  const investments = useInvestmentAnalytics();
  const recommendations = useRecommendations();
  const forecast = useForecastAnalytics();

  const changes = useMemo(
    () => mapChanges(netWorth.data, cashFlow.data),
    [netWorth.data, cashFlow.data],
  );

  const topDimensions = health.data ? lowestScoringDimensions(health.data.dimensions, 3) : [];
  const topRecommendations = recommendations.data
    ? sortRecommendations(recommendations.data).slice(0, 3)
    : [];

  return (
    <div className="space-y-10">
      {/* ---- 1. How healthy am I? -------------------------------------- */}
      <section className="space-y-4" aria-busy={health.isLoading}>
        <h2 className="sr-only">Financial health</h2>

        {health.isLoading ? (
          <AnalyticsLoadingState rows={1} />
        ) : health.isError ? (
          <AnalyticsErrorState onRetry={health.refetch} />
        ) : !health.data ? (
          <EmptyAnalyticsState
            title="No health score yet"
            message="The health engine hasn't scored this account. Add accounts and transactions, then recalculate from Settings."
          />
        ) : (
          <div className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <HealthScoreCard health={health.data} compact updatedAt={health.updatedAt} />

            <div className="space-y-2 lg:border-l lg:border-slate-800 lg:pl-6">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Weakest dimensions
              </p>
              {topDimensions.length > 0 ? (
                <div className="divide-y divide-slate-800/70">
                  {topDimensions.map((dimension) => (
                    <HealthDimensionCard
                      key={dimension.code}
                      dimension={dimension}
                      variant="row"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No dimensions were scored.</p>
              )}
              <button
                type="button"
                onClick={() => onNavigate({ section: "health", view: null })}
                className="pt-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                View all {health.data.dimensions.length} dimensions →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ---- 2. What needs me right now? ------------------------------- */}
      <AnalyticsSection
        title="Attention required"
        description="Risks flagged against your accounts, cards, loans and goals — highest severity first."
        result={risks}
        link={{
          label: "All risks",
          onClick: () => onNavigate({ section: "intelligence", view: "risks" }),
        }}
        emptyTitle="Nothing needs your attention"
        emptyMessage="No active risks were flagged. This section fills in when a rule detects something."
      >
        {(matrix) =>
          matrix.risks.length === 0 ? (
            <NothingNeedsAttention />
          ) : (
            <AttentionRequired matrix={matrix} limit={3} />
          )
        }
      </AnalyticsSection>

      {/* ---- 3. What changed? ------------------------------------------ */}
      <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl sm:p-6">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-slate-100">What changed</h2>
          <p className="text-xs text-slate-400">
            Movement since the previous period, measured between two reported snapshots.
          </p>
        </div>
        {netWorth.isLoading || cashFlow.isLoading ? (
          <AnalyticsLoadingState rows={0} />
        ) : (
          <FinancialChangeGrid changes={changes} />
        )}
      </section>

      {/* ---- 4. What should I do next? --------------------------------- */}
      <AnalyticsSection
        title="Recommended actions"
        description="Ranked by the impact the health engine attributes to each."
        result={recommendations}
        link={{
          label: "All actions",
          onClick: () => onNavigate({ section: "intelligence", view: "actions" }),
        }}
        emptyTitle="No recommendations right now"
        emptyMessage="The health engine hasn't produced any suggestions for this account."
      >
        {() => (
          <div className="grid gap-3 md:grid-cols-3">
            {topRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                compact
              />
            ))}
          </div>
        )}
      </AnalyticsSection>

      {/* ---- 5. Where is this heading? --------------------------------- */}
      <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl sm:p-6">
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-slate-100">
            Current trajectory
          </h2>
          <p className="text-xs text-slate-400">
            Your position today, and where the backend's retirement projection puts it.
          </p>
        </div>

        <AnalyticsKpiRow>
          <AnalyticsKpi
            label="Net worth"
            value={netWorth.data?.currentNetWorth ?? null}
            money
            caption="Assets minus liabilities"
            accent="emerald"
            icon={<Wallet className="h-6 w-6 text-emerald-400" aria-hidden="true" />}
          />
          <AnalyticsKpi
            label="Savings rate"
            value={cashFlow.data?.savingsRatePercent ?? null}
            suffix="%"
            caption={cashFlow.data ? `Period ${cashFlow.data.period}` : null}
            accent="indigo"
            icon={<PiggyBank className="h-6 w-6 text-indigo-400" aria-hidden="true" />}
          />
          <AnalyticsKpi
            label="Debt"
            value={debt.data?.totalDebt ?? null}
            money
            caption="Outstanding balance"
            upIsGood={false}
            accent="rose"
            icon={<ShieldAlert className="h-6 w-6 text-rose-400" aria-hidden="true" />}
          />
          <AnalyticsKpi
            label="Investments"
            value={investments.data?.totalValuation ?? null}
            money
            caption="Portfolio valuation"
            accent="purple"
            icon={<PieChart className="h-6 w-6 text-purple-400" aria-hidden="true" />}
          />
        </AnalyticsKpiRow>

        {forecast.isLoading ? (
          <AnalyticsLoadingState rows={1} />
        ) : forecast.isError ? (
          <AnalyticsErrorState onRetry={forecast.refetch} />
        ) : !forecast.data ? (
          <EmptyAnalyticsState
            title="No projection available"
            message="The retirement forecast endpoint returned nothing for this account."
          />
        ) : (
          <ForecastPanel forecast={forecast.data} />
        )}
      </section>
    </div>
  );
};
