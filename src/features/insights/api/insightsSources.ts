/**
 * Raw backend sources for the Insights workspace.
 *
 * Every entry here is a 1:1 wrapper over one endpoint on the shared `api`
 * client — no new HTTP layer, no new fetch wrapper. The point of the
 * indirection is the *query key*.
 *
 * The previous revision gave each view model its own query (`["insights",
 * "cashFlow"]`, `["insights", "trends"]`, …) and each of those fanned out to
 * several endpoints internally. Overlaps were invisible to react-query, so one
 * Overview render issued `getIncomeSources` three times, `getExpensesByCategory`
 * twice and `getNetWorth` twice. Keying by *endpoint* instead of by *view* means
 * the cache deduplicates them: any number of sections can ask for net worth and
 * exactly one request goes out.
 *
 * Sources always reject on failure — none of them swallow errors — because
 * whether a failure is fatal depends on the *consumer*, not the endpoint. The
 * same net-worth-history query is essential to the Net Worth section and merely
 * decorative on Overview. `combine()` in `useInsightsQueries` is where each
 * section declares which of its sources are primary (failure ⇒ error state) and
 * which are optional (failure ⇒ partial-data notice).
 */
import { queryOptions } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";

/** Analytics is expensive to compute and changes slowly; a minute is plenty. */
const ANALYTICS_STALE_TIME = 60 * 1000;

const key = (...parts: (string | number)[]) => ["insights", "source", ...parts];

/** Root key for invalidating the whole workspace on Refresh. */
export const INSIGHTS_ROOT_KEY = ["insights"];

// ---------------------------------------------------------------------------
// Financial health
// ---------------------------------------------------------------------------

export const healthScoreSource = () =>
  queryOptions({
    queryKey: key("healthScore"),
    queryFn: () => api.getFinancialHealth(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const healthHistorySource = (limit: number) =>
  queryOptions({
    queryKey: key("healthHistory", limit),
    queryFn: () => api.getFinancialHealthHistory({ limit }),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const healthRecommendationsSource = () =>
  queryOptions({
    queryKey: key("healthRecommendations"),
    queryFn: () => api.getHealthRecommendations(),
    staleTime: ANALYTICS_STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Net worth
// ---------------------------------------------------------------------------

export const netWorthSource = () =>
  queryOptions({
    queryKey: key("netWorth"),
    queryFn: () => api.getNetWorth(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const netWorthHistorySource = (limit: number) =>
  queryOptions({
    queryKey: key("netWorthHistory", limit),
    queryFn: () => api.getNetWorthHistory({ limit }),
    staleTime: ANALYTICS_STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Cash flow, income, spending
// ---------------------------------------------------------------------------

export const cashFlowSource = (limit: number) =>
  queryOptions({
    queryKey: key("cashFlow", limit),
    queryFn: () => api.getCashFlow({ limit }),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const incomeSourcesSource = () =>
  queryOptions({
    queryKey: key("incomeSources"),
    queryFn: () => api.getIncomeSources({ limit: 20 }),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const incomeTrendSource = (limit: number) =>
  queryOptions({
    queryKey: key("incomeTrend", limit),
    queryFn: () => api.getIncomeTrend({ limit }),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const expenseTrendSource = (limit: number) =>
  queryOptions({
    queryKey: key("expenseTrend", limit),
    queryFn: () => api.getExpenseTrendAnalytics({ limit }),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const expensesByCategorySource = () =>
  queryOptions({
    queryKey: key("expensesByCategory"),
    queryFn: () => api.getExpensesByCategory(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const expensesByMerchantSource = () =>
  queryOptions({
    queryKey: key("expensesByMerchant"),
    queryFn: () => api.getExpensesByMerchant(),
    staleTime: ANALYTICS_STALE_TIME,
  });

/**
 * Recent outflows, used only to plot daily spend. Capped at 100 because this is
 * a sparkline input, not a ledger view — Transactions owns that.
 */
export const recentOutflowsSource = () =>
  queryOptions({
    queryKey: key("recentOutflows"),
    queryFn: () => api.getTransactions({ direction: "OUTFLOW", limit: 100 }),
    staleTime: ANALYTICS_STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Budgets & goals (owned by Planning; Insights only interprets them)
// ---------------------------------------------------------------------------

export const budgetDashboardSource = () =>
  queryOptions({
    queryKey: key("budgetDashboard"),
    queryFn: () => api.getBudgetDashboard(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const goalDashboardSource = () =>
  queryOptions({
    queryKey: key("goalDashboard"),
    queryFn: () => api.getGoalDashboard(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const goalsSource = () =>
  queryOptions({
    queryKey: key("goals"),
    queryFn: () => api.getGoals({ limit: 50 }),
    staleTime: ANALYTICS_STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Investments & debt (owned by Investments / Loans & Debt)
// ---------------------------------------------------------------------------

export const investmentReturnsSource = () =>
  queryOptions({
    queryKey: key("investmentReturns"),
    queryFn: () => api.getInvestmentReturns(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const assetAllocationSource = () =>
  queryOptions({
    queryKey: key("assetAllocation"),
    queryFn: () => api.getAssetAllocation(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const loansSource = () =>
  queryOptions({
    queryKey: key("loans"),
    queryFn: () => api.getLoans({ status: "ACTIVE" }),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const debtBreakdownSource = () =>
  queryOptions({
    queryKey: key("debtBreakdown"),
    queryFn: () => api.getDebtBreakdown(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const liabilitiesSummarySource = () =>
  queryOptions({
    queryKey: key("liabilitiesSummary"),
    queryFn: () => api.getLiabilitiesSummary(),
    staleTime: ANALYTICS_STALE_TIME,
  });

export const subscriptionsSource = () =>
  queryOptions({
    queryKey: key("subscriptions"),
    queryFn: () => api.getSubscriptions({ limit: 50 }),
    staleTime: ANALYTICS_STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Smart Action Center — the live source for risks and anomalies
// ---------------------------------------------------------------------------

export const smartActionsSource = () =>
  queryOptions({
    queryKey: key("smartActions"),
    queryFn: () => api.getSmartActions({ status: "ACTIVE", limit: 50 }),
    staleTime: ANALYTICS_STALE_TIME,
  });

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

/**
 * The backend requires an age pair it cannot infer (this app stores no date of
 * birth). 30/60 matches the defaults the standalone retirement calculator uses,
 * and the resulting figures are always labelled with the ages they assume so
 * the number is never presented as personalised when it isn't.
 */
export const RETIREMENT_FORECAST_DEFAULTS = { currentAge: 30, retirementAge: 60 } as const;

export const retirementForecastSource = (
  params: { currentAge: number; retirementAge: number } = RETIREMENT_FORECAST_DEFAULTS,
) =>
  queryOptions({
    queryKey: key("retirementForecast", params.currentAge, params.retirementAge),
    queryFn: () => api.getRetirementForecast(params),
    staleTime: ANALYTICS_STALE_TIME,
  });
