/**
 * View-model hooks for the Insights workspace.
 *
 * Each hook composes one or more *shared* endpoint queries (see
 * `api/insightsSources.ts`) and runs the result through a pure mapper. Because
 * the sources are keyed by endpoint, two sections asking for the same endpoint
 * share one request — mounting Overview no longer issues `getNetWorth` twice
 * and `getIncomeSources` three times.
 *
 * Every hook returns the same shape so sections can render loading / error /
 * empty / partial / stale uniformly through `<AnalyticsSection>`:
 *
 * - `data: null` after loading means *the backend has nothing here*, which the
 *   UI renders as an empty state — never as zeroes.
 * - `isPartial` means a primary source succeeded but an enrichment source did
 *   not, so the section is worth showing with a caveat.
 * - `isStale` means react-query is serving cache while it revalidates.
 */
import { useMemo } from "react";
import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import {
  INSIGHTS_ROOT_KEY,
  assetAllocationSource,
  budgetDashboardSource,
  cashFlowSource,
  debtBreakdownSource,
  expenseTrendSource,
  expensesByCategorySource,
  expensesByMerchantSource,
  goalDashboardSource,
  goalsSource,
  healthHistorySource,
  healthRecommendationsSource,
  healthScoreSource,
  incomeSourcesSource,
  incomeTrendSource,
  investmentReturnsSource,
  liabilitiesSummarySource,
  loansSource,
  netWorthHistorySource,
  netWorthSource,
  recentOutflowsSource,
  retirementForecastSource,
  smartActionsSource,
  subscriptionsSource,
} from "../api/insightsSources";
import {
  mapBudgets,
  mapCashFlow,
  mapDebt,
  mapFinancialHealth,
  mapForecast,
  mapGoals,
  mapIncome,
  mapInvestments,
  mapNetWorth,
  mapRecommendations,
  mapSpending,
  mapSubscriptions,
  mapTrends,
  unwrapList,
} from "../api/insightsMappers";
import { IntelligenceItem, buildIntelligenceFeed } from "../api/intelligenceModel";
import { useInsightsPeriodMonths } from "./useInsightsFilters";
import {
  BudgetAnalytics,
  CashFlowAnalytics,
  DebtAnalytics,
  FinancialHealthOverview,
  ForecastAnalytics,
  GoalAnalytics,
  IncomeAnalytics,
  InvestmentAnalyticsOverview,
  NetWorthAnalytics,
  SpendingAnalytics,
  SubscriptionAnalytics,
  TrendAnalytics,
} from "../types/insightsTypes";

export interface InsightsQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isPartial: boolean;
  isStale: boolean;
  /** Timestamp of the last successful fetch, for the freshness badge. */
  updatedAt: number | null;
  refetch: () => void;
}

type AnyQuery = Pick<
  UseQueryResult<unknown, Error>,
  "isPending" | "isError" | "isFetching" | "dataUpdatedAt" | "refetch"
>;

/**
 * Folds a set of source queries plus a derived value into the common result.
 *
 * `primary` queries decide loading and error; `optional` queries only decide
 * whether the section is partial, since the section still means something
 * without them.
 */
function combine<T>(
  value: T | null,
  primary: AnyQuery[],
  optional: { query: AnyQuery; value: unknown }[] = [],
  /**
   * Escape hatch for sections whose failure condition isn't "any primary
   * failed" — Trends survives losing either series but not both.
   */
  isErrorOverride?: boolean,
): InsightsQueryResult<T> {
  const isLoading = primary.some((q) => q.isPending) || optional.some((o) => o.query.isPending);
  const isError = isErrorOverride ?? primary.some((q) => q.isError);
  return {
    data: isLoading || isError ? null : value,
    isLoading,
    isError,
    // An optional source that failed and one that returned nothing are the same
    // situation for the reader: part of this section is missing, say so.
    isPartial:
      !isLoading &&
      !isError &&
      optional.some((o) => o.query.isError || o.value === null || o.value === undefined),
    isStale: !isLoading && [...primary, ...optional.map((o) => o.query)].some((q) => q.isFetching),
    updatedAt: [...primary, ...optional.map((o) => o.query)].reduce<number | null>(
      (min, q) => (q.dataUpdatedAt ? (min === null ? q.dataUpdatedAt : Math.min(min, q.dataUpdatedAt)) : min),
      null,
    ),
    refetch: () => {
      primary.forEach((q) => void q.refetch());
      optional.forEach((o) => void o.query.refetch());
    },
  };
}

/** Invalidates every Insights source. Wired to the header's Refresh control. */
export function useRefreshInsights() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: INSIGHTS_ROOT_KEY });
}

// ---------------------------------------------------------------------------

export function useFinancialHealth(): InsightsQueryResult<FinancialHealthOverview> {
  const months = useInsightsPeriodMonths();
  const score = useQuery(healthScoreSource());
  const history = useQuery(healthHistorySource(months));
  const value = useMemo(
    () => mapFinancialHealth(score.data, history.data),
    [score.data, history.data],
  );
  return combine(value, [score], [{ query: history, value: history.data }]);
}

export function useNetWorthAnalytics(): InsightsQueryResult<NetWorthAnalytics> {
  const months = useInsightsPeriodMonths();
  const current = useQuery(netWorthSource());
  const history = useQuery(netWorthHistorySource(months));
  const value = useMemo(() => mapNetWorth(current.data, history.data), [current.data, history.data]);
  return combine(value, [current], [{ query: history, value: history.data }]);
}

export function useCashFlowAnalytics(): InsightsQueryResult<CashFlowAnalytics> {
  const months = useInsightsPeriodMonths();
  const snapshots = useQuery(cashFlowSource(months));
  const sources = useQuery(incomeSourcesSource());
  const value = useMemo(
    () => mapCashFlow(snapshots.data, sources.data),
    [snapshots.data, sources.data],
  );
  return combine(value, [snapshots], [{ query: sources, value: sources.data }]);
}

export function useSpendingAnalytics(): InsightsQueryResult<SpendingAnalytics> {
  const categories = useQuery(expensesByCategorySource());
  const merchants = useQuery(expensesByMerchantSource());
  const outflows = useQuery(recentOutflowsSource());
  const actions = useQuery(smartActionsSource());
  const value = useMemo(
    () => mapSpending(categories.data, merchants.data, outflows.data, unwrapList(actions.data)),
    [categories.data, merchants.data, outflows.data, actions.data],
  );
  return combine(
    value,
    [categories],
    [
      { query: merchants, value: merchants.data },
      { query: outflows, value: outflows.data },
    ],
  );
}

export function useIncomeAnalytics(): InsightsQueryResult<IncomeAnalytics> {
  const months = useInsightsPeriodMonths();
  const sources = useQuery(incomeSourcesSource());
  const trend = useQuery(incomeTrendSource(months));
  // Composed rather than re-fetched: the cash-flow snapshot supplies the one
  // *measured* income figure, and its sources are already in the shared cache.
  const cashFlow = useCashFlowAnalytics();
  const value = useMemo(
    () => mapIncome(sources.data, trend.data, cashFlow.data),
    [sources.data, trend.data, cashFlow.data],
  );
  return combine(value, [sources], [{ query: trend, value: trend.data }]);
}

export function useBudgetAnalytics(): InsightsQueryResult<BudgetAnalytics> {
  const dashboard = useQuery(budgetDashboardSource());
  const value = useMemo(() => mapBudgets(dashboard.data), [dashboard.data]);
  return combine(value, [dashboard]);
}

export function useGoalAnalytics(): InsightsQueryResult<GoalAnalytics> {
  const dashboard = useQuery(goalDashboardSource());
  const goals = useQuery(goalsSource());
  const value = useMemo(() => mapGoals(dashboard.data, goals.data), [dashboard.data, goals.data]);
  return combine(value, [goals], [{ query: dashboard, value: dashboard.data }]);
}

export function useInvestmentAnalytics(): InsightsQueryResult<InvestmentAnalyticsOverview> {
  const returns = useQuery(investmentReturnsSource());
  const allocation = useQuery(assetAllocationSource());
  const value = useMemo(
    () => mapInvestments(returns.data, allocation.data),
    [returns.data, allocation.data],
  );
  return combine(value, [returns], [{ query: allocation, value: allocation.data }]);
}

export function useDebtAnalytics(): InsightsQueryResult<DebtAnalytics> {
  const loans = useQuery(loansSource());
  const breakdown = useQuery(debtBreakdownSource());
  const summary = useQuery(liabilitiesSummarySource());
  const value = useMemo(
    () => mapDebt(loans.data, breakdown.data, summary.data),
    [loans.data, breakdown.data, summary.data],
  );
  return combine(
    value,
    [loans],
    [
      { query: breakdown, value: breakdown.data },
      { query: summary, value: summary.data },
    ],
  );
}

export function useSubscriptionAnalytics(): InsightsQueryResult<SubscriptionAnalytics> {
  const subscriptions = useQuery(subscriptionsSource());
  const value = useMemo(() => mapSubscriptions(subscriptions.data), [subscriptions.data]);
  return combine(value, [subscriptions]);
}

export function useTrendAnalytics(): InsightsQueryResult<TrendAnalytics> {
  const months = useInsightsPeriodMonths();
  const income = useQuery(incomeTrendSource(months));
  const expense = useQuery(expenseTrendSource(months));
  const value = useMemo(() => mapTrends(income.data, expense.data), [income.data, expense.data]);
  // Either series alone is a usable trend view, so neither is individually
  // primary — but losing both leaves nothing to draw, which is an error, not
  // an empty state.
  return combine(
    value,
    [],
    [
      { query: income, value: income.data },
      { query: expense, value: expense.data },
    ],
    income.isError && expense.isError,
  );
}

export function useForecastAnalytics(): InsightsQueryResult<ForecastAnalytics> {
  const forecast = useQuery(retirementForecastSource());
  const netWorth = useNetWorthAnalytics();
  const value = useMemo(() => mapForecast(forecast.data, netWorth.data), [forecast.data, netWorth.data]);
  return combine(value, [forecast]);
}

/**
 * The unified Intelligence feed: detections and recommendations, ranked
 * together.
 *
 * Both sources are already in the shared cache — the Smart Action feed backs
 * Risks and Anomalies, the health recommendations back Actions — so merging them
 * costs no additional request. `null` when neither produced anything, which the
 * section renders as an empty state rather than as an empty list.
 */
export function useIntelligenceFeed(): InsightsQueryResult<IntelligenceItem[]> {
  const actions = useQuery(smartActionsSource());
  const recommendations = useQuery(healthRecommendationsSource());
  const value = useMemo(() => {
    const items = buildIntelligenceFeed(
      unwrapList(actions.data),
      mapRecommendations(recommendations.data),
    );
    return items.length > 0 ? items : null;
  }, [actions.data, recommendations.data]);
  return combine(value, [actions], [{ query: recommendations, value: recommendations.data }]);
}

