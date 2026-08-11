/**
 * Insights workspace view models.
 *
 * Two rules govern every type in this file, and they are why it looks the way
 * it does:
 *
 * 1. **`null` means "the backend did not give us this."** It never collapses to
 *    `0`. A savings rate of 0% and an unknown savings rate are different facts,
 *    and rendering the second as the first is the single most misleading thing
 *    this workspace can do. Consumers render `null` via `<MetricValue>`, which
 *    prints "Not enough data" rather than a number.
 *
 * 2. **No field exists here unless a live endpoint populates it.** The previous
 *    revision declared `sharpeRatio`, `allocationDriftPercent`, `unusedCount`,
 *    `potentialAnnualSavings`, `monthOverMonthPercent`, `topGrowthDrivers`,
 *    `difficulty` and `estimatedMonthlySavings`. Nothing in the API returns any
 *    of them, so the mapper filled them with zeros and the UI rendered those
 *    zeros as findings ("0% Drift", "+₹0.00 est. impact", "0 Unused"). Deleting
 *    the fields is the only fix that stops a future component re-introducing
 *    the lie.
 *
 * Money is the app-wide `Money` from `src/types` — this module used to declare
 * its own structurally-identical copy, which let the two drift.
 */
import { Money } from "../../../types";

export type { Money };

/**
 * How far back history-shaped queries look. These map to real `limit`
 * parameters on the backend (months of snapshots), so changing the period
 * genuinely changes the request rather than re-labelling the same data.
 */
export type InsightsPeriod = "3M" | "6M" | "1Y" | "3Y";

export const INSIGHTS_PERIOD_MONTHS: Record<InsightsPeriod, number> = {
  "3M": 3,
  "6M": 6,
  "1Y": 12,
  "3Y": 36,
};

export const INSIGHTS_PERIOD_LABELS: Record<InsightsPeriod, string> = {
  "3M": "Last 3 months",
  "6M": "Last 6 months",
  "1Y": "Last 12 months",
  "3Y": "Last 3 years",
};

export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RecommendationImpact = "HIGH_IMPACT" | "QUICK_WIN" | "LONG_TERM";

// ---------------------------------------------------------------------------
// 1. Financial health
// ---------------------------------------------------------------------------

export interface HealthDimension {
  code: string;
  label: string;
  /** 0–100. `null` when the engine could not score this dimension. */
  score: number | null;
  /** The engine's plain-language "why", or `null` when it gave none. */
  why: string | null;
  /** Single most useful next step for this dimension, if the engine supplied one. */
  improvement: string | null;
  /** Points this dimension is estimated to move the overall score. */
  scoreImpact: number | null;
  /** Where in the app this dimension is actually managed, if resolvable. */
  deepLink: string | null;
}

export interface HealthHistoryPoint {
  date: string;
  score: number;
}

export interface FinancialHealthOverview {
  overallScore: number;
  /** Backend rating enum, e.g. `NEEDS_ATTENTION`. Presentational mapping lives in the UI. */
  rating: string;
  /** Points moved since the previous snapshot. `null` when there is no prior snapshot. */
  monthlyTrend: number | null;
  /** Oldest → newest. Empty when the history endpoint returned nothing. */
  history: HealthHistoryPoint[];
  dimensions: HealthDimension[];
  /** Snapshot the score describes — scores are never implicitly "now". */
  asOf: string | null;
}

// ---------------------------------------------------------------------------
// 2. Net worth
// ---------------------------------------------------------------------------

export interface NetWorthPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface NetWorthBreakdownItem {
  category: string;
  value: Money;
  percentage: number;
}

export interface NetWorthAnalytics {
  currentNetWorth: Money;
  totalAssets: Money;
  totalLiabilities: Money;
  /** Change vs the previous snapshot. `null` without at least two snapshots. */
  periodChangeAmount: Money | null;
  periodChangePercent: number | null;
  /** Change vs the oldest snapshot in the selected window. */
  windowChangeAmount: Money | null;
  windowChangePercent: number | null;
  history: NetWorthPoint[];
  assetBreakdown: NetWorthBreakdownItem[];
  liabilityBreakdown: NetWorthBreakdownItem[];
  asOf: string | null;
}

// ---------------------------------------------------------------------------
// 3. Cash flow
// ---------------------------------------------------------------------------

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface CashFlowAnalytics {
  period: string;
  totalIncome: Money;
  totalExpenses: Money;
  netCashFlow: Money;
  /** Backend-computed. `null` when the snapshot omitted it. */
  savingsRatePercent: number | null;
  /** Percentage points moved vs the prior period. */
  savingsRateChangePoints: number | null;
  history: CashFlowPoint[];
  largestExpenseCategory: { name: string; amount: Money } | null;
  largestIncomeSource: { name: string; amount: Money } | null;
}

// ---------------------------------------------------------------------------
// 4. Spending
// ---------------------------------------------------------------------------

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: Money;
  percentage: number;
}

export interface MerchantSpending {
  merchantName: string;
  amount: Money;
  transactionCount: number | null;
  category: string | null;
}

export interface DailySpendingPoint {
  date: string;
  amount: number;
}

export interface SpendingAnomaly {
  id: string;
  title: string;
  description: string;
  date: string;
  amount: Money;
}

export interface SpendingAnalytics {
  totalSpent: Money;
  categories: CategorySpending[];
  topMerchants: MerchantSpending[];
  dailyVelocity: DailySpendingPoint[];
  /**
   * Detected by the backend's Smart Action rules, not by a client-side
   * threshold. Empty when nothing was flagged.
   */
  anomalies: SpendingAnomaly[];
}

// ---------------------------------------------------------------------------
// 5. Income
// ---------------------------------------------------------------------------

export interface IncomeSource {
  id: string;
  name: string;
  /**
   * As stated by the backend (MONTHLY, WEEKLY, …) — never normalised
   * client-side. `null` when the source doesn't declare one; the wire type says
   * `string`, but manually-created sources come back without it.
   */
  frequency: string | null;
  expectedAmount: Money;
}

export interface IncomeTrendPoint {
  date: string;
  amount: number;
}

export interface IncomeAnalytics {
  /** From the latest cash-flow snapshot — a measured figure, not a run-rate guess. */
  totalIncomeThisPeriod: Money | null;
  growthPercent: number | null;
  sources: IncomeSource[];
  history: IncomeTrendPoint[];
}

// ---------------------------------------------------------------------------
// 6. Budgets
// ---------------------------------------------------------------------------

export interface BudgetHealthItem {
  budgetId: string;
  name: string;
  allocatedAmount: Money;
  spentAmount: Money;
  remainingAmount: Money;
  percentUsed: number;
  status: "HEALTHY" | "WARNING" | "EXCEEDED";
  forecastEndOfPeriod: Money | null;
}

export interface BudgetAnalytics {
  totalBudgeted: Money;
  totalSpent: Money;
  overallPercentUsed: number | null;
  budgetHealthScore: number | null;
  budgets: BudgetHealthItem[];
}

// ---------------------------------------------------------------------------
// 7. Goals
// ---------------------------------------------------------------------------

export interface GoalAnalyticsItem {
  goalId: string;
  name: string;
  targetAmount: Money;
  currentAmount: Money;
  progressPercent: number;
  monthlyContribution: Money | null;
  projectedCompletionDate: string | null;
  isBehindSchedule: boolean | null;
}

export interface GoalAnalytics {
  totalGoalsCount: number;
  onTrackCount: number | null;
  behindCount: number | null;
  goals: GoalAnalyticsItem[];
}

// ---------------------------------------------------------------------------
// 8. Investments
// ---------------------------------------------------------------------------

export interface InvestmentAnalyticsOverview {
  totalValuation: Money;
  totalGain: Money;
  totalGainPercent: number | null;
  /** Average XIRR across portfolios that report one. `null` when none do. */
  xirrPercent: number | null;
  bestHolding: { symbol: string; name: string; returnPercent: number } | null;
  worstHolding: { symbol: string; name: string; returnPercent: number } | null;
  allocation: { label: string; value: Money; percentage: number }[];
}

// ---------------------------------------------------------------------------
// 9. Debt
// ---------------------------------------------------------------------------

export interface DebtItem {
  id: string;
  name: string;
  type: string;
  principalOutstanding: Money;
  interestRatePercent: number | null;
  monthlyEMI: Money | null;
  remainingTenureMonths: number | null;
}

export interface DebtAnalytics {
  totalDebt: Money;
  totalMonthlyEMI: Money | null;
  debtToIncomeRatioPercent: number | null;
  debts: DebtItem[];
}

// ---------------------------------------------------------------------------
// 10. Subscriptions
// ---------------------------------------------------------------------------

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: Money;
  /** `null` when the detector couldn't establish a cycle. */
  billingCycle: string | null;
  nextDueDate: string | null;
}

export interface SubscriptionAnalytics {
  /** Sum of monthly-equivalent cost as reported. `null` when cycles are unknown. */
  totalMonthlyCost: Money | null;
  totalSubscriptionsCount: number;
  subscriptions: SubscriptionItem[];
}

// ---------------------------------------------------------------------------
// 11. Trends
// ---------------------------------------------------------------------------

export interface TrendPoint {
  period: string;
  income: number | null;
  expense: number | null;
}

export interface TrendAnalytics {
  trends: TrendPoint[];
}

// ---------------------------------------------------------------------------
// 12. Forecast
// ---------------------------------------------------------------------------

/**
 * What `/finance/analytics/retirement-forecast` actually returns: a single
 * corpus figure at a retirement age, plus the savings rate required to reach
 * it. There is no month-by-month path and no confidence interval.
 *
 * The previous revision manufactured both — it interpolated four points between
 * today's net worth and the corpus, hardcoded `projectedDebt: 0`, reused the
 * net-worth series as "projected investments" (so two charted lines were
 * identical), and derived a "confidence %" from how many request parameters
 * happened to be defined. This shape refuses to carry any of that.
 */
export interface ForecastAnalytics {
  currentNetWorth: Money | null;
  projectedCorpus: Money | null;
  monthlySavingsNeeded: Money | null;
  currentAge: number | null;
  retirementAge: number | null;
  expectedReturnPercent: number | null;
  /** Actual history, for drawing "where you are" beneath "where this leads". */
  history: NetWorthPoint[];
}

// ---------------------------------------------------------------------------
// 13. Recommendations
// ---------------------------------------------------------------------------

export interface SmartRecommendation {
  id: string;
  title: string;
  reason: string | null;
  impactType: RecommendationImpact;
  /** Health dimension this came from, e.g. `EMERGENCY_FUND`. */
  component: string | null;
  /** Points this is estimated to move the health score. */
  scoreImpact: number | null;
  /**
   * Raw backend deep-link token. Resolved to an in-app destination by
   * `resolveActionRoute` — never navigated to directly.
   */
  deepLink: string | null;
}

// ---------------------------------------------------------------------------
// 14. Risks
// ---------------------------------------------------------------------------

export interface RiskItem {
  id: string;
  title: string;
  category: string;
  severity: RiskSeverity;
  /** Detection confidence derived from the rule's own evidence. `null` when no evidence. */
  confidencePercent: number | null;
  reason: string;
  affectedEntity: string | null;
  financialImpact: Money | null;
  dueInDays: number | null;
  resolution: string | null;
  deepLink: string | null;
}

export interface RiskMatrixAnalytics {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  risks: RiskItem[];
}

// ---------------------------------------------------------------------------
// 15. Reports
// ---------------------------------------------------------------------------

export type AnalyticsReportType =
  | "MONTHLY_REVIEW"
  | "QUARTERLY_REVIEW"
  | "YEARLY_REVIEW"
  | "INVESTMENT_REVIEW"
  | "DEBT_REVIEW"
  | "CASH_FLOW_REPORT";

// ---------------------------------------------------------------------------
// 16. Workspace filters
// ---------------------------------------------------------------------------

export interface InsightsFilterState {
  period: InsightsPeriod;
}
