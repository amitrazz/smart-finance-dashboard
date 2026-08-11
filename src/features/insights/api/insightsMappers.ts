/**
 * Pure backend-shape → view-model mappers for the Insights workspace.
 *
 * Every function here is synchronous, side-effect free and returns `null` when
 * the backend gave it nothing to work with. That is deliberate: it makes the
 * riskiest logic in this feature — deciding what counts as "no data" — directly
 * unit-testable without a network, a QueryClient or a DOM.
 *
 * ## What is *not* in here, and why
 *
 * The previous revision computed a lot of money in the browser. It ran a
 * 480-iteration amortisation loop to claim "debt-free in N months, ₹X interest
 * saved", annualised income by multiplying by 4.33/2.17/12, interpolated a
 * four-point net-worth forecast, and derived a "confidence %" from how many
 * request parameters happened to be defined. None of those figures existed
 * anywhere in the backend, and all of them were rendered with the same
 * authority as a real balance.
 *
 * The frontend now derives exactly one class of value: the difference between
 * two figures the backend already reported, which is what the "What changed"
 * section is *for*. That lives in `diffMoney`/`diffPercentPoints` below and
 * nowhere else.
 */
import {
  Money,
  SmartActionItem,
  FinancialHealthScore,
  FinancialHealthHistoryPoint,
  HealthDimensionDetail,
  HealthRecommendation,
  NetWorthSnapshot,
  CashFlowSnapshot,
  Budget,
  BudgetDashboardData,
  Goal,
  GoalDashboardData,
  InvestmentReturnsPortfolio,
  AssetAllocationResponse,
  DebtBreakdownResponse,
  IncomeTrendResponse,
  RetirementForecastResponse,
  Loan,
  Transaction,
} from "../../../types";
import { PaginatedResponse } from "../../../services/api/endpoints";
import { HEALTH_DIMENSION_LABELS } from "../../health/hooks/useFinancialHealth";
import {
  FinancialHealthOverview,
  HealthDimension,
  NetWorthAnalytics,
  NetWorthPoint,
  CashFlowAnalytics,
  CashFlowPoint,
  SpendingAnalytics,
  SpendingAnomaly,
  IncomeAnalytics,
  BudgetAnalytics,
  BudgetHealthItem,
  GoalAnalytics,
  InvestmentAnalyticsOverview,
  DebtAnalytics,
  DebtItem,
  SubscriptionAnalytics,
  TrendAnalytics,
  ForecastAnalytics,
  SmartRecommendation,
  RiskItem,
  RiskMatrixAnalytics,
} from "../types/insightsTypes";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Parses a wire decimal. Returns `null` — never 0 — when there is no number. */
export function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const parsed = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(amount: number, currency: string): Money {
  return { amount: amount.toFixed(2), currency };
}

function moneyValue(m: Money | string | null | undefined): number | null {
  if (m === null || m === undefined) return null;
  return typeof m === "object" ? num(m.amount) : num(m);
}

function asMoney(m: Money | string | null | undefined, currency: string): Money | null {
  if (m === null || m === undefined) return null;
  if (typeof m === "object") return m;
  const parsed = num(m);
  return parsed === null ? null : money(parsed, currency);
}

/**
 * The one place the frontend produces a money figure the backend did not send.
 *
 * "What changed" is defined as a difference, so it cannot be sourced directly;
 * the honest thing is to compute it in exactly one audited spot rather than
 * inline at a dozen call sites. Rounding to the minor unit before it becomes a
 * string keeps binary-float dust (₹41,999.99999997) off the screen. Returns
 * `null` unless *both* operands are real, so an absent prior period surfaces as
 * "no comparison available" rather than a change equal to the whole balance.
 */
export function diffMoney(
  current: Money | null | undefined,
  previous: Money | null | undefined,
): Money | null {
  const a = moneyValue(current);
  const b = moneyValue(previous);
  if (a === null || b === null) return null;
  return money(Math.round((a - b) * 100) / 100, current?.currency ?? previous?.currency ?? "INR");
}

/** Percent change between two backend figures. `null` when the base is absent or zero. */
export function diffPercent(
  current: Money | number | null | undefined,
  previous: Money | number | null | undefined,
): number | null {
  const a = typeof current === "number" ? current : moneyValue(current);
  const b = typeof previous === "number" ? previous : moneyValue(previous);
  if (a === null || b === null || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

/** Difference between two backend-reported percentages, in percentage points. */
export function diffPercentPoints(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (current === null || current === undefined) return null;
  if (previous === null || previous === undefined) return null;
  return Math.round((current - previous) * 10) / 10;
}

/**
 * Chronological comparator that tolerates a missing key.
 *
 * Backend list DTOs type `date`/`period` as required, but real payloads have
 * shipped rows without them (a snapshot mid-write, a trend point for a month
 * with no activity). `String.prototype.localeCompare` on `undefined` throws,
 * and inside a `.sort()` that takes down the whole workspace behind the error
 * boundary — a single malformed row blanking every section. Undated rows sort
 * to the front and are filtered out downstream by the same `null` checks that
 * handle every other absent value.
 */
export function byAscending<T>(key: (item: T) => string | null | undefined) {
  return (a: T, b: T) => (key(a) ?? "").localeCompare(key(b) ?? "");
}

export function unwrapList<T>(res: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as PaginatedResponse<T>).data)) {
    return (res as PaginatedResponse<T>).data;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Financial health
// ---------------------------------------------------------------------------

export function mapFinancialHealth(
  health: FinancialHealthScore | null | undefined,
  historyRes: FinancialHealthHistoryPoint[] | PaginatedResponse<FinancialHealthHistoryPoint> | null | undefined,
): FinancialHealthOverview | null {
  if (!health || typeof health.overallScore !== "number") return null;

  const componentScores = health.componentScores || health.components || {};
  const topRecommendations = health.topRecommendations || [];

  const dimensions: HealthDimension[] = Object.values(
    componentScores as Record<string, HealthDimensionDetail>,
  ).map((d) => ({
    code: d.code,
    label: d.label || HEALTH_DIMENSION_LABELS[d.code] || d.code,
    // A dimension the engine could not score comes back without a number. It
    // is not a zero-scored dimension, and must not be charted as one.
    score: typeof d.score === "number" ? d.score : null,
    why: d.why || d.reason || null,
    improvement:
      d.recommendations?.[0]?.text ||
      d.recommendationText ||
      topRecommendations.find((r) => r.component === d.code)?.text ||
      null,
    scoreImpact: typeof d.scoreImpact === "number" ? d.scoreImpact : null,
    deepLink: d.deepLink || null,
  }));

  const history = unwrapList(historyRes)
    .map((h) => ({ date: h.snapshotDate || h.date || "", score: h.overallScore ?? h.score ?? null }))
    .filter((p): p is { date: string; score: number } => Boolean(p.date) && typeof p.score === "number")
    .sort(byAscending((p) => p.date));

  return {
    overallScore: health.overallScore,
    rating: health.rating,
    monthlyTrend: typeof health.monthlyTrend === "number" ? health.monthlyTrend : null,
    history,
    dimensions,
    asOf: health.snapshotDate || health.lastCalculatedAt || health.updatedAt || null,
  };
}

// ---------------------------------------------------------------------------
// Net worth
// ---------------------------------------------------------------------------

export function mapNetWorth(
  current: NetWorthSnapshot | null | undefined,
  historyRes: NetWorthSnapshot[] | PaginatedResponse<NetWorthSnapshot> | null | undefined,
): NetWorthAnalytics | null {
  if (!current?.netWorth) return null;

  const currency = current.netWorth.currency;
  const sorted = [...unwrapList(historyRes)].sort(byAscending((s) => s.date));

  const history: NetWorthPoint[] = sorted
    .map((snap) => ({
      date: snap.date,
      netWorth: moneyValue(snap.netWorth),
      totalAssets: moneyValue(snap.totalAssets),
      totalLiabilities: moneyValue(snap.totalLiabilities),
    }))
    .filter(
      (p): p is NetWorthPoint =>
        Boolean(p.date) &&
        p.netWorth !== null &&
        p.totalAssets !== null &&
        p.totalLiabilities !== null,
    );

  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const oldest = sorted.length >= 2 ? sorted[0] : null;

  const totalAssets = moneyValue(current.totalAssets) ?? 0;
  const totalLiabilities = moneyValue(current.totalLiabilities) ?? 0;
  const b = current.breakdown;

  const breakdown = (entries: [string, string | undefined][], total: number) =>
    entries
      .map(([category, raw]) => ({ category, value: num(raw) }))
      .filter((e): e is { category: string; value: number } => e.value !== null && e.value > 0)
      .map((e) => ({
        category: e.category,
        value: money(e.value, currency),
        percentage: total > 0 ? (e.value / total) * 100 : 0,
      }));

  return {
    currentNetWorth: current.netWorth,
    totalAssets: current.totalAssets,
    totalLiabilities: current.totalLiabilities,
    periodChangeAmount: diffMoney(current.netWorth, previous?.netWorth),
    periodChangePercent: diffPercent(current.netWorth, previous?.netWorth),
    windowChangeAmount: diffMoney(current.netWorth, oldest?.netWorth),
    windowChangePercent: diffPercent(current.netWorth, oldest?.netWorth),
    history,
    assetBreakdown: breakdown(
      [
        ["Cash & savings", b?.liquidCash],
        ["Investments", b?.investments],
        ["Real estate", b?.realEstate],
      ],
      totalAssets,
    ),
    liabilityBreakdown: breakdown(
      [
        ["Loans", b?.loans],
        ["Credit cards", b?.creditCards],
      ],
      totalLiabilities,
    ),
    asOf: current.date || null,
  };
}

// ---------------------------------------------------------------------------
// Cash flow
// ---------------------------------------------------------------------------

interface IncomeSourceWire {
  id: string;
  name: string;
  frequency: string;
  expectedAmount: Money;
}

export function mapCashFlow(
  snapshotsRes: CashFlowSnapshot[] | PaginatedResponse<CashFlowSnapshot> | null | undefined,
  incomeSourcesRes: IncomeSourceWire[] | PaginatedResponse<IncomeSourceWire> | null | undefined,
): CashFlowAnalytics | null {
  const sorted = [...unwrapList(snapshotsRes)].sort(byAscending((s) => s.period));
  if (sorted.length === 0) return null;

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  const history: CashFlowPoint[] = sorted
    .map((snap) => ({
      month: snap.period,
      income: moneyValue(snap.totalIncome),
      expenses: moneyValue(snap.totalExpense),
      netCashFlow: moneyValue(snap.netSavings),
    }))
    .filter(
      (p): p is CashFlowPoint =>
        Boolean(p.month) &&
        p.income !== null &&
        p.expenses !== null &&
        p.netCashFlow !== null,
    );

  const largestExpense = [...(latest.categoryBreakdown ?? [])].sort(
    (a, b) => (moneyValue(b.amount) ?? 0) - (moneyValue(a.amount) ?? 0),
  )[0];

  const largestIncome = [...unwrapList(incomeSourcesRes)].sort(
    (a, b) => (moneyValue(b.expectedAmount) ?? 0) - (moneyValue(a.expectedAmount) ?? 0),
  )[0];

  return {
    period: latest.period,
    totalIncome: latest.totalIncome,
    totalExpenses: latest.totalExpense,
    netCashFlow: latest.netSavings,
    savingsRatePercent: num(latest.savingsRate),
    savingsRateChangePoints: diffPercentPoints(
      num(latest.savingsRate),
      previous ? num(previous.savingsRate) : null,
    ),
    history,
    largestExpenseCategory: largestExpense
      ? { name: largestExpense.categoryName, amount: largestExpense.amount }
      : null,
    largestIncomeSource: largestIncome
      ? { name: largestIncome.name, amount: largestIncome.expectedAmount }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Spending
// ---------------------------------------------------------------------------

type CategoryWire = { categoryId: string; categoryName: string; amount: Money; percentage: number };
type MerchantWire = { merchantId: string; merchantName: string; amount: Money };

/**
 * Smart Action types that describe *unusual behaviour* rather than a standing
 * obligation. Matched on the rule's own type string so the Anomalies view shows
 * what the backend actually flagged — the previous revision invented anomalies
 * client-side by calling any day above 2× the trailing average a "spike".
 */
const ANOMALY_PATTERN = /ANOMAL|UNUSUAL|SPIKE|DUPLICATE|OUTLIER|UNEXPECTED/i;

export function mapSpending(
  categoriesRes: CategoryWire[] | null | undefined,
  merchantsRes: MerchantWire[] | null | undefined,
  transactionsRes: Transaction[] | PaginatedResponse<Transaction> | null | undefined,
  actions: SmartActionItem[],
): SpendingAnalytics | null {
  const categoriesRaw = Array.isArray(categoriesRes) ? categoriesRes : [];
  if (categoriesRaw.length === 0) return null;

  const currency = categoriesRaw[0].amount.currency;
  const totalSpent = categoriesRaw.reduce((sum, c) => sum + (moneyValue(c.amount) ?? 0), 0);

  const transactions = unwrapList(transactionsRes);
  const merchantsRaw = Array.isArray(merchantsRes) ? merchantsRes : [];

  const topMerchants = merchantsRaw.slice(0, 6).map((m) => {
    const matching = transactions.filter((t) => t.merchantName === m.merchantName);
    return {
      merchantName: m.merchantName,
      amount: m.amount,
      transactionCount: matching.length > 0 ? matching.length : null,
      category: matching[0]?.categoryName ?? null,
    };
  });

  const byDay = new Map<string, number>();
  for (const t of transactions) {
    const day = t.date?.slice(0, 10);
    const amount = moneyValue(t.amount);
    if (!day || amount === null) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + amount);
  }
  const dailyVelocity = [...byDay.entries()]
    .sort(byAscending(([date]) => date))
    .slice(-30)
    .map(([date, amount]) => ({ date, amount }));

  const anomalies: SpendingAnomaly[] = actions
    .filter((a) => ANOMALY_PATTERN.test(a.type) || ANOMALY_PATTERN.test(a.title))
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.explanation || a.description,
      date: a.createdAt,
      amount: asMoney(a.amount ?? a.financialImpact, currency) ?? money(0, currency),
    }));

  return {
    totalSpent: money(totalSpent, currency),
    categories: categoriesRaw.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      amount: c.amount,
      percentage: c.percentage,
    })),
    topMerchants,
    dailyVelocity,
    anomalies,
  };
}

// ---------------------------------------------------------------------------
// Income
// ---------------------------------------------------------------------------

export function mapIncome(
  sourcesRes: IncomeSourceWire[] | PaginatedResponse<IncomeSourceWire> | null | undefined,
  trendRes: IncomeTrendResponse | PaginatedResponse<{ date: string; amount: Money }> | null | undefined,
  cashFlow: CashFlowAnalytics | null,
): IncomeAnalytics | null {
  const sourcesRaw = unwrapList(sourcesRes);
  const trendPoints =
    trendRes && typeof trendRes === "object" && "points" in trendRes && trendRes.points
      ? trendRes.points
      : unwrapList(trendRes as PaginatedResponse<{ date: string; amount: Money }> | null);

  if (sourcesRaw.length === 0 && trendPoints.length === 0) return null;

  const history = [...trendPoints]
    .map((p) => ({ date: p.date, amount: moneyValue(p.amount) }))
    .filter((p): p is { date: string; amount: number } => p.amount !== null && Boolean(p.date))
    .sort(byAscending((p) => p.date));

  const first = history[0];
  const last = history[history.length - 1];

  return {
    // The measured income for the period, straight off the cash-flow snapshot.
    // Not a run-rate: the previous revision multiplied each source's expected
    // amount by a frequency factor and presented the product as actual income.
    totalIncomeThisPeriod: cashFlow?.totalIncome ?? null,
    growthPercent: first && last ? diffPercent(last.amount, first.amount) : null,
    sources: sourcesRaw.map((s) => ({
      id: s.id,
      name: s.name,
      frequency: s.frequency ?? null,
      expectedAmount: s.expectedAmount,
    })),
    history,
  };
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export function mapBudgets(dashboard: BudgetDashboardData | null | undefined): BudgetAnalytics | null {
  if (!dashboard) return null;

  const all: Budget[] = [
    ...(dashboard.activeBudgets || []),
    ...(dashboard.exceededBudgets || []),
    ...(dashboard.nearLimitBudgets || []),
  ];
  const currency = all[0]?.currency || "INR";

  const budgets: BudgetHealthItem[] = all.map((budget) => {
    const allocated = moneyValue(budget.totalLimit) ?? 0;
    const spent = moneyValue(budget.totalSpent) ?? 0;
    // The backend reports utilisation per budget; fall back to the ratio of two
    // backend figures only when it doesn't.
    const percentUsed = budget.utilizationPercent ?? (allocated > 0 ? (spent / allocated) * 100 : 0);
    return {
      budgetId: budget.id,
      name: budget.name,
      allocatedAmount: budget.totalLimit,
      spentAmount: budget.totalSpent ?? money(0, budget.currency),
      remainingAmount: budget.remainingAmount ?? money(allocated - spent, budget.currency),
      percentUsed,
      status: percentUsed > 100 ? "EXCEEDED" : percentUsed >= 85 ? "WARNING" : "HEALTHY",
      forecastEndOfPeriod: budget.forecastMonthEndSpend ?? null,
    };
  });

  const totalBudgeted = num(dashboard.totalBudget);
  const totalSpent = num(dashboard.totalSpent);
  if (totalBudgeted === null && budgets.length === 0) return null;

  return {
    totalBudgeted: money(totalBudgeted ?? 0, currency),
    totalSpent: money(totalSpent ?? 0, currency),
    overallPercentUsed: num(dashboard.overallUtilization),
    budgetHealthScore:
      typeof dashboard.budgetHealthScore === "number" ? dashboard.budgetHealthScore : null,
    budgets,
  };
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export function mapGoals(
  dashboard: GoalDashboardData | null | undefined,
  goalsRes: Goal[] | PaginatedResponse<Goal> | null | undefined,
): GoalAnalytics | null {
  const goalsRaw = unwrapList(goalsRes);
  if (!dashboard && goalsRaw.length === 0) return null;

  const goals = goalsRaw.map((g) => {
    // `goalHealth` is the backend's own verdict. Absent it we say nothing —
    // an unscored goal is not an on-track goal.
    const isBehindSchedule = g.goalHealth
      ? g.goalHealth === "FAIR" || g.goalHealth === "POOR"
      : null;
    return {
      goalId: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount || g.currentCorpus || money(0, g.currency),
      progressPercent: g.progressPercent,
      monthlyContribution: g.monthlyContribution || g.autoContributionAmount || null,
      projectedCompletionDate:
        g.estimatedCompletionDate || g.forecastCompletionDate || g.targetDate || null,
      isBehindSchedule,
    };
  });

  const scored = goals.filter((g) => g.isBehindSchedule !== null);

  return {
    totalGoalsCount: dashboard
      ? dashboard.activeGoalsCount + dashboard.completedGoalsCount
      : goals.length,
    onTrackCount: scored.length > 0 ? scored.filter((g) => !g.isBehindSchedule).length : null,
    behindCount: scored.length > 0 ? scored.filter((g) => g.isBehindSchedule).length : null,
    goals,
  };
}

// ---------------------------------------------------------------------------
// Investments
// ---------------------------------------------------------------------------

export function mapInvestments(
  portfolios: InvestmentReturnsPortfolio[] | null | undefined,
  allocationRes: AssetAllocationResponse | null | undefined,
): InvestmentAnalyticsOverview | null {
  const list = Array.isArray(portfolios) ? portfolios : [];
  if (list.length === 0) return null;

  const totalValuation = list.reduce((s, p) => s + (num(p.totalMarketValue) ?? 0), 0);
  const totalCost = list.reduce((s, p) => s + (num(p.totalCostBasis) ?? 0), 0);
  const totalGain = list.reduce((s, p) => s + (num(p.totalUnrealizedGain) ?? 0), 0);

  // Only portfolios that actually report an XIRR contribute to the average.
  const xirrs = list.map((p) => num(p.xirr)).filter((v): v is number => v !== null);

  const holdings = list
    .flatMap((p) => p.holdings ?? [])
    .map((h) => ({ ...h, ret: num(h.unrealizedGainPercent) }))
    .filter((h) => h.ret !== null)
    .sort((a, b) => (b.ret as number) - (a.ret as number));

  const toHolding = (h: (typeof holdings)[number] | undefined) =>
    h ? { symbol: h.symbol ?? "", name: h.name ?? h.symbol ?? "Unnamed holding", returnPercent: h.ret as number } : null;

  return {
    totalValuation: money(totalValuation, "INR"),
    totalGain: money(totalGain, "INR"),
    totalGainPercent: totalCost > 0 ? (totalGain / totalCost) * 100 : null,
    xirrPercent: xirrs.length > 0 ? xirrs.reduce((s, v) => s + v, 0) / xirrs.length : null,
    bestHolding: toHolding(holdings[0]),
    worstHolding: holdings.length > 1 ? toHolding(holdings[holdings.length - 1]) : null,
    allocation: (allocationRes?.allocations ?? []).map((a) => ({
      label: a.assetClass,
      value: a.amount,
      percentage: a.percentage,
    })),
  };
}

// ---------------------------------------------------------------------------
// Debt
// ---------------------------------------------------------------------------

export function mapDebt(
  loansRes: Loan[] | PaginatedResponse<Loan> | null | undefined,
  breakdown: DebtBreakdownResponse | null | undefined,
  summary: { debtToIncomeRatio: string } | null | undefined,
): DebtAnalytics | null {
  const loans = unwrapList(loansRes);
  if (loans.length === 0 && !breakdown?.totalDebt) return null;

  const debts: DebtItem[] = loans.map((l) => {
    const outstanding =
      asMoney(l.outstandingPrincipal ?? l.outstandingBalance ?? l.principalAmount, l.currency) ??
      money(0, l.currency);
    return {
      id: l.id,
      name: l.name,
      type: l.type,
      principalOutstanding: outstanding,
      interestRatePercent: typeof l.interestRate === "number" ? l.interestRate : null,
      monthlyEMI: asMoney(l.monthlyEmi ?? l.emiAmount ?? l.installmentAmount, l.currency),
      remainingTenureMonths: l.remainingTenureMonths ?? l.tenureMonths ?? null,
    };
  });

  const currency = breakdown?.totalDebt?.currency ?? debts[0]?.principalOutstanding.currency ?? "INR";
  const totalDebt =
    moneyValue(breakdown?.totalDebt) ??
    debts.reduce((s, d) => s + (moneyValue(d.principalOutstanding) ?? 0), 0);

  const emis = debts.map((d) => moneyValue(d.monthlyEMI)).filter((v): v is number => v !== null);
  const dti = summary ? num(summary.debtToIncomeRatio) : null;

  return {
    totalDebt: money(totalDebt, currency),
    // Payoff-strategy figures ("debt-free in N months", "₹X interest saved")
    // used to be simulated here. Loans & Debt owns amortisation; Insights
    // reports the position and links there.
    totalMonthlyEMI: emis.length > 0 ? money(emis.reduce((s, v) => s + v, 0), currency) : null,
    debtToIncomeRatioPercent: dti === null ? null : dti * 100,
    debts,
  };
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

type SubscriptionWire = {
  id: string;
  name: string;
  amount: Money;
  billingCycle: string;
  nextDueDate: string;
};

const MONTHLY_CYCLES = /^MONTH/i;

export function mapSubscriptions(
  res: SubscriptionWire[] | PaginatedResponse<SubscriptionWire> | null | undefined,
): SubscriptionAnalytics | null {
  const list = unwrapList(res);
  if (list.length === 0) return null;

  const currency = list[0].amount.currency;
  const monthly = list
    .filter((s) => MONTHLY_CYCLES.test(s.billingCycle ?? ""))
    .map((s) => moneyValue(s.amount))
    .filter((v): v is number => v !== null);

  return {
    // Only monthly-billed subscriptions are summed. Converting an annual plan
    // to a monthly figure means dividing by 12, which invents a payment that
    // never happens; those rows are listed with their real cycle instead.
    totalMonthlyCost: monthly.length > 0 ? money(monthly.reduce((s, v) => s + v, 0), currency) : null,
    totalSubscriptionsCount: list.length,
    subscriptions: list.map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
      billingCycle: s.billingCycle ?? null,
      nextDueDate: s.nextDueDate || null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

export function mapTrends(
  incomeTrendRes: IncomeTrendResponse | PaginatedResponse<{ date: string; amount: Money }> | null | undefined,
  expenseTrendRes: PaginatedResponse<{ month: string; amount: Money }> | null | undefined,
): TrendAnalytics | null {
  const incomePoints =
    incomeTrendRes && typeof incomeTrendRes === "object" && "points" in incomeTrendRes && incomeTrendRes.points
      ? incomeTrendRes.points
      : unwrapList(incomeTrendRes as PaginatedResponse<{ date: string; amount: Money }> | null);
  const expensePoints = unwrapList(expenseTrendRes);

  if (incomePoints.length === 0 && expensePoints.length === 0) return null;

  const byMonth = new Map<string, { income: number | null; expense: number | null }>();
  const touch = (k: string) => byMonth.get(k) ?? { income: null, expense: null };

  for (const p of incomePoints) {
    const k = (p.date ?? "").slice(0, 7);
    if (k) byMonth.set(k, { ...touch(k), income: moneyValue(p.amount) });
  }
  for (const p of expensePoints) {
    const k = (p.month ?? "").slice(0, 7);
    if (k) byMonth.set(k, { ...touch(k), expense: moneyValue(p.amount) });
  }

  return {
    trends: [...byMonth.keys()]
      .sort()
      .map((period) => ({ period, ...byMonth.get(period)! })),
  };
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export function mapForecast(
  forecast: RetirementForecastResponse | null | undefined,
  netWorth: NetWorthAnalytics | null,
): ForecastAnalytics | null {
  if (!forecast?.projectedCorpus && !netWorth) return null;

  return {
    currentNetWorth: netWorth?.currentNetWorth ?? null,
    projectedCorpus: forecast?.projectedCorpus ?? null,
    monthlySavingsNeeded: forecast?.monthlySavingsNeeded ?? null,
    currentAge: forecast?.currentAge ?? null,
    retirementAge: forecast?.retirementAge ?? null,
    expectedReturnPercent:
      typeof forecast?.expectedReturnPercent === "number" ? forecast.expectedReturnPercent : null,
    history: netWorth?.history ?? [],
  };
}

// ---------------------------------------------------------------------------
// "What changed" — period-over-period movement
// ---------------------------------------------------------------------------

export interface FinancialChange {
  id: string;
  label: string;
  amount: Money | null;
  percent: number | null;
  /** Percentage-point movement, for figures that are themselves percentages. */
  points: number | null;
  /** Whether an increase is a good outcome for this measure. */
  upIsGood: boolean;
  caption: string | null;
}

/**
 * Answers "what moved since last period", using only differences between two
 * figures the backend already reported.
 *
 * Each row is omitted entirely when there is no prior period to compare
 * against, rather than rendered as a change of zero — "no movement" and "no
 * comparison" are different answers, and only one of them is reassuring.
 *
 * Debt movement is read from the net-worth snapshot's liabilities line rather
 * than from the debt endpoint, which exposes only a current balance. That keeps
 * the comparison honest: both sides come from the same pair of snapshots.
 */
export function mapChanges(
  netWorth: NetWorthAnalytics | null,
  cashFlow: CashFlowAnalytics | null,
): FinancialChange[] {
  const changes: FinancialChange[] = [];

  if (netWorth?.periodChangeAmount) {
    changes.push({
      id: "net-worth",
      label: "Net worth",
      amount: netWorth.periodChangeAmount,
      percent: netWorth.periodChangePercent,
      points: null,
      upIsGood: true,
      caption: "vs previous snapshot",
    });
  }

  const history = cashFlow?.history ?? [];
  if (history.length >= 2) {
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const currency = cashFlow?.totalIncome.currency ?? "INR";

    changes.push({
      id: "income",
      label: "Income",
      amount: money(Math.round((latest.income - previous.income) * 100) / 100, currency),
      percent: diffPercent(latest.income, previous.income),
      points: null,
      upIsGood: true,
      caption: `vs ${previous.month}`,
    });

    changes.push({
      id: "spending",
      label: "Spending",
      amount: money(Math.round((latest.expenses - previous.expenses) * 100) / 100, currency),
      percent: diffPercent(latest.expenses, previous.expenses),
      points: null,
      upIsGood: false,
      caption: `vs ${previous.month}`,
    });
  }

  if (cashFlow?.savingsRateChangePoints !== null && cashFlow?.savingsRateChangePoints !== undefined) {
    changes.push({
      id: "savings-rate",
      label: "Savings rate",
      amount: null,
      percent: null,
      points: cashFlow.savingsRateChangePoints,
      upIsGood: true,
      caption: "vs previous period",
    });
  }

  const nwHistory = netWorth?.history ?? [];
  if (nwHistory.length >= 2) {
    const latest = nwHistory[nwHistory.length - 1];
    const previous = nwHistory[nwHistory.length - 2];
    const currency = netWorth?.currentNetWorth.currency ?? "INR";
    changes.push({
      id: "debt",
      label: "Debt",
      amount: money(
        Math.round((latest.totalLiabilities - previous.totalLiabilities) * 100) / 100,
        currency,
      ),
      percent: diffPercent(latest.totalLiabilities, previous.totalLiabilities),
      points: null,
      upIsGood: false,
      caption: "total liabilities",
    });
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/**
 * Buckets a recommendation by the score movement the engine attributes to it.
 * This is a *labelling* decision over a backend number, not a derived figure —
 * the number itself is always shown alongside so the bucket can be checked.
 */
function impactBucket(scoreImpact: number | null): SmartRecommendation["impactType"] {
  if (scoreImpact === null) return "LONG_TERM";
  if (Math.abs(scoreImpact) >= 5) return "HIGH_IMPACT";
  if (Math.abs(scoreImpact) >= 1) return "QUICK_WIN";
  return "LONG_TERM";
}

export function mapRecommendations(
  list: HealthRecommendation[] | null | undefined,
): SmartRecommendation[] {
  if (!Array.isArray(list)) return [];

  return list.map((r, idx) => {
    const scoreImpact =
      typeof r.estimatedImpact === "number"
        ? r.estimatedImpact
        : typeof r.scoreImpact === "number"
          ? r.scoreImpact
          : null;
    const title = r.title || r.text;
    const reason = r.description && r.description !== title ? r.description : null;
    return {
      id: r.id || `rec-${idx}`,
      title,
      reason,
      impactType: impactBucket(scoreImpact),
      component: r.component ?? null,
      scoreImpact,
      deepLink: r.deepLink ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Risks
// ---------------------------------------------------------------------------

/**
 * Which action categories represent a *risk*, and what this workspace calls it.
 *
 * Acting as an allow-list is the point: the action feed also carries
 * DATA_QUALITY, IMPORT, SYSTEM and OPPORTUNITY items ("a transaction needs a
 * category"), which are chores, not risks. Listing them on a severity dashboard
 * would inflate the counts and train users to ignore it.
 */
const RISK_CATEGORIES: Record<string, string | undefined> = {
  SPENDING: "Overspending",
  PAYMENT: "Cash flow",
  INCOME: "Cash flow",
  CREDIT: "Credit",
  INVESTMENT: "Investments",
  SAVINGS: "Savings",
  GOALS: "Goals",
};

/** The backend's 5 priorities collapse onto 4 severities; INFO is not its own band. */
const RISK_SEVERITY: Record<string, RiskItem["severity"] | undefined> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  INFO: "LOW",
};

/**
 * Confidence in the *detection*, taken from the evidence the rule fired on.
 *
 * Evidence read straight off a snapshot or ledger is `confidence: 1`; anything
 * lower means the rule projected the figure. The weakest piece of evidence
 * governs — a risk is only as certain as its shakiest input. With no evidence
 * at all this returns `null` rather than the old hardcoded 90%, because an
 * unquantified detection should show no confidence figure, not a flattering one.
 */
export function riskConfidencePercent(action: SmartActionItem): number | null {
  const evidence = action.evidence ?? [];
  if (evidence.length === 0) return null;
  return Math.round(Math.min(...evidence.map((e) => e.confidence)) * 100);
}

/** What the risk is *about* — prefers a named entity from the evidence. */
export function riskSubject(action: SmartActionItem): string | null {
  const ref = (action.evidence ?? []).flatMap((e) => e.sourceEntityIds ?? [])[0];
  if (!ref?.type) return null;
  return ref.type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapRisks(actions: SmartActionItem[]): RiskMatrixAnalytics {
  const risks: RiskItem[] = actions
    .filter((a) => RISK_CATEGORIES[a.category])
    .map((action) => ({
      id: action.id,
      title: action.title,
      category: RISK_CATEGORIES[action.category] ?? "Other",
      severity: RISK_SEVERITY[action.priority] ?? "LOW",
      confidencePercent: riskConfidencePercent(action),
      // `explanation` is the rule's structured "why" — always a concrete
      // comparison, never vague — which is exactly what this card wants.
      reason: action.explanation || action.description,
      affectedEntity: riskSubject(action),
      financialImpact: asMoney(action.amount ?? action.financialImpact, "INR"),
      dueInDays: typeof action.dueInDays === "number" ? action.dueInDays : null,
      resolution: action.recommendation ?? null,
      deepLink: action.deepLink ?? null,
    }));

  return {
    criticalCount: risks.filter((r) => r.severity === "CRITICAL").length,
    highCount: risks.filter((r) => r.severity === "HIGH").length,
    mediumCount: risks.filter((r) => r.severity === "MEDIUM").length,
    lowCount: risks.filter((r) => r.severity === "LOW").length,
    risks,
  };
}
