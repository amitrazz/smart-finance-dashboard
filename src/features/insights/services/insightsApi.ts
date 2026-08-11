import { api } from "../../../services/api/endpoints";
import { HEALTH_DIMENSION_LABELS, getRatingLabel } from "../../health/hooks/useFinancialHealth";
import {
  Money,
  HealthDimensionDetail,
  LoanType,
  SmartActionItem,
} from "../../../types";
import {
  FinancialHealthOverview,
  HealthDimension,
  NetWorthAnalytics,
  NetWorthPoint,
  CashFlowAnalytics,
  CashFlowPoint,
  SpendingAnalytics,
  CategorySpending,
  MerchantSpending,
  DailySpendingPoint,
  IncomeAnalytics,
  IncomeSource,
  BudgetAnalytics,
  BudgetHealthItem,
  GoalAnalytics,
  GoalAnalyticsItem,
  InvestmentAnalyticsOverview,
  DebtAnalytics,
  DebtItem,
  SubscriptionAnalytics,
  SubscriptionItem,
  TrendAnalytics,
  TrendPoint,
  ForecastAnalytics,
  ForecastPoint,
  SmartRecommendation,
  RiskMatrixAnalytics,
  RiskItem,
  AnalyticsReportPayload,
  AnalyticsReportType,
  TimeHorizon,
} from "../types/insightsTypes";

// ---- Shared helpers -------------------------------------------------------

const n = (v: string | number | null | undefined): number => {
  const parsed = typeof v === "number" ? v : parseFloat(v ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

const toMoney = (amount: string | number | null | undefined, currency = "INR"): Money => ({
  amount: String(amount ?? "0"),
  currency,
});

function unwrapList<T>(res: T[] | { data: T[] } | null | undefined): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as { data: T[] }).data)) return (res as { data: T[] }).data;
  return [];
}

const EMPTY_HEALTH: FinancialHealthOverview = { overallScore: 0, rating: "Critical", scoreTrend: "STABLE", historicalScores: [], dimensions: [] };
const EMPTY_NET_WORTH: NetWorthAnalytics = {
  currentNetWorth: toMoney(0),
  monthlyChangeAmount: toMoney(0),
  monthlyChangePercent: 0,
  annualChangeAmount: toMoney(0),
  annualChangePercent: 0,
  history: [],
  topGrowthDrivers: [],
  assetBreakdown: [],
  liabilityBreakdown: [],
};
const EMPTY_CASH_FLOW: CashFlowAnalytics = {
  totalIncomeThisMonth: toMoney(0),
  totalExpensesThisMonth: toMoney(0),
  netCashFlowThisMonth: toMoney(0),
  savingsRatePercent: 0,
  history: [],
  largestIncomeSource: { name: "N/A", amount: toMoney(0) },
  largestExpenseCategory: { name: "N/A", amount: toMoney(0) },
  forecastNextMonth: toMoney(0),
};
const EMPTY_SPENDING: SpendingAnalytics = {
  totalSpent: toMoney(0),
  needsTotal: toMoney(0),
  wantsTotal: toMoney(0),
  needsPercent: 0,
  wantsPercent: 0,
  categories: [],
  topMerchants: [],
  dailyVelocity: [],
  detectedAnomalies: [],
};
const EMPTY_INCOME: IncomeAnalytics = {
  totalMonthlyIncome: toMoney(0),
  annualIncomeRunRate: toMoney(0),
  sources: [],
  monthlyHistory: [],
  incomeGrowthPercent1Y: 0,
};
const EMPTY_BUDGETS: BudgetAnalytics = { totalBudgeted: toMoney(0), totalSpent: toMoney(0), overallPercentUsed: 0, budgets: [], successHistoryPercent: 0 };
const EMPTY_GOALS: GoalAnalytics = { totalGoalsCount: 0, onTrackCount: 0, behindCount: 0, goals: [] };
const EMPTY_INVESTMENTS: InvestmentAnalyticsOverview = {
  totalValuation: toMoney(0),
  totalGain: toMoney(0),
  cagrPercent: 0,
  xirrPercent: 0,
  sharpeRatio: 0,
  volatilityPercent: 0,
  allocationDriftPercent: 0,
  bestHolding: { symbol: "", name: "No Holdings", returnPercent: 0 },
  worstHolding: { symbol: "", name: "No Holdings", returnPercent: 0 },
};
const EMPTY_DEBTS: DebtAnalytics = {
  totalDebt: toMoney(0),
  totalMonthlyEMI: toMoney(0),
  debtToIncomeRatioPercent: 0,
  snowballPayoffMonths: 0,
  avalanchePayoffMonths: 0,
  interestSavedAvalanche: toMoney(0),
  debts: [],
};
const EMPTY_SUBSCRIPTIONS: SubscriptionAnalytics = {
  totalMonthlyCost: toMoney(0),
  totalAnnualCost: toMoney(0),
  totalSubscriptionsCount: 0,
  unusedCount: 0,
  potentialAnnualSavings: toMoney(0),
  subscriptions: [],
};
const EMPTY_TRENDS: TrendAnalytics = { timeframe: "MONTHLY", trends: [], accelerationCategory: "N/A", decelerationCategory: "N/A" };
const EMPTY_FORECASTS: ForecastAnalytics = { horizon: "1Y", forecasts: [], confidenceScorePercent: 0 };
const EMPTY_RISKS: RiskMatrixAnalytics = { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, risks: [] };

/**
 * Which action categories represent a *risk*, and what this page calls it.
 *
 * Acting as an allow-list is the point: the action feed also carries
 * DATA_QUALITY, IMPORT, SYSTEM and OPPORTUNITY items ("a transaction needs a
 * category"), which are chores, not risks. Listing them on a severity
 * dashboard would inflate the counts and train users to ignore it.
 */
const RISK_CATEGORIES: Record<string, RiskItem["category"] | undefined> = {
  SPENDING: "OVERSPENDING",
  PAYMENT: "CASH_FLOW",
  INCOME: "CASH_FLOW",
  CREDIT: "CREDIT",
  INVESTMENT: "INVESTMENTS",
  SAVINGS: "EMERGENCY_FUND",
  GOALS: "EMERGENCY_FUND",
};

/** The backend's 5 priorities collapse onto this page's 4 severities; INFO is not its own band. */
const RISK_SEVERITY: Record<string, RiskItem["severity"] | undefined> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  INFO: "LOW",
};

/**
 * Confidence in the *detection*, taken from the evidence the rule fired on
 * rather than the hardcoded 85% this page used to show.
 *
 * Evidence read straight off a snapshot or ledger is `confidence: 1`; anything
 * lower means the rule projected the figure (e.g. a goal shortfall). The
 * weakest piece of evidence governs — a risk is only as certain as its
 * shakiest input. With no evidence at all the rule still fired on a
 * deterministic threshold, so this reports high-but-not-certain rather than
 * implying a precision it cannot back.
 */
function riskConfidencePercent(action: SmartActionItem): number {
  const evidence = action.evidence ?? [];
  if (evidence.length === 0) return 90;
  const weakest = Math.min(...evidence.map((e) => e.confidence));
  return Math.round(weakest * 100);
}

/**
 * What the risk is *about*. Prefers a named entity from the evidence over the
 * bare category — "the credit card this concerns" beats "CREDIT".
 */
function riskSubject(action: SmartActionItem): string {
  const ref = (action.evidence ?? []).flatMap((e) => e.sourceEntityIds)[0];
  if (!ref) return String(action.category);
  return ref.type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const mapLoanType = (type: LoanType): DebtItem["type"] => {
  switch (type) {
    case "HOME":
    case "MORTGAGE":
      return "HOME_LOAN";
    case "VEHICLE":
      return "CAR_LOAN";
    default:
      return "PERSONAL_LOAN";
  }
};

const NEEDS_KEYWORDS = [
  "hous", "rent", "emi", "loan", "utilit", "grocer", "insurance", "fuel",
  "transport", "medical", "health", "electric", "water", "gas", "maintenance",
  "school", "tuition", "bill",
];
const isNeedCategory = (name: string) => NEEDS_KEYWORDS.some((k) => name.toLowerCase().includes(k));

// Simulates minimum-payment-plus-surplus debt paydown to compare payoff order
// strategies with real balances/rates/EMIs instead of guessed figures.
function simulatePayoff(
  debts: { balance: number; rate: number; emi: number }[],
  extraBudget: number,
  order: "rate" | "balance",
): { months: number; totalInterest: number } {
  const items = debts.filter((d) => d.balance > 0).map((d) => ({ ...d }));
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 480;
  while (items.some((d) => d.balance > 1) && months < maxMonths) {
    months++;
    for (const d of items) {
      if (d.balance <= 0) continue;
      const interest = (d.rate / 1200) * d.balance;
      totalInterest += interest;
      d.balance = Math.max(0, d.balance + interest - d.emi);
    }
    const active = [...items]
      .filter((d) => d.balance > 0)
      .sort((a, b) => (order === "rate" ? b.rate - a.rate : a.balance - b.balance));
    let extra = extraBudget;
    for (const d of active) {
      if (extra <= 0) break;
      const pay = Math.min(extra, d.balance);
      d.balance -= pay;
      extra -= pay;
    }
  }
  return { months, totalInterest };
}

// ---- API -------------------------------------------------------------------

export const insightsApi = {
  getFinancialHealth: async (): Promise<FinancialHealthOverview> => {
    const [health, historyRes] = await Promise.all([
      api.getFinancialHealth().catch(() => null),
      api.getFinancialHealthHistory({ limit: 6 }).catch(() => null),
    ]);
    if (!health || typeof health.overallScore !== "number") return EMPTY_HEALTH;

    const componentScores = health.componentScores || health.components || {};
    const topRecommendations = health.topRecommendations || [];
    const dimensions: HealthDimension[] = Object.values(componentScores).map((d: HealthDimensionDetail) => ({
      code: d.code,
      label: d.label || HEALTH_DIMENSION_LABELS[d.code] || d.code,
      score: d.score,
      stars: d.stars,
      why: d.why || d.reason || "",
      recommendation: topRecommendations.find((r) => r.component === d.code)?.text || d.recommendationText || "",
      improvementTip: d.recommendations?.[0]?.text || d.recommendationText || "",
      historicalTrendPercent: d.scoreImpact ?? 0,
    }));

    const historyList = unwrapList(historyRes);
    const historicalScores = historyList.map((h) => ({
      date: h.snapshotDate || h.date || "",
      score: h.overallScore ?? h.score ?? 0,
    }));

    const trend = health.monthlyTrend ?? 0;
    return {
      overallScore: health.overallScore,
      rating: getRatingLabel(health.rating),
      scoreTrend: trend > 0 ? "UPWARD" : trend < 0 ? "DOWNWARD" : "STABLE",
      historicalScores,
      dimensions,
    };
  },

  getNetWorthAnalytics: async (): Promise<NetWorthAnalytics> => {
    const [current, historyRes] = await Promise.all([
      api.getNetWorth().catch(() => null),
      api.getNetWorthHistory({ limit: 12 }).catch(() => null),
    ]);
    if (!current) return EMPTY_NET_WORTH;

    const currency = current.netWorth.currency;
    const sortedHistory = [...unwrapList(historyRes)].sort((a, b) => a.date.localeCompare(b.date));
    const history: NetWorthPoint[] = sortedHistory.map((snap) => ({
      date: snap.date,
      netWorth: n(snap.netWorth.amount),
      totalAssets: n(snap.totalAssets.amount),
      totalLiabilities: n(snap.totalLiabilities.amount),
    }));

    const latestNetWorth = n(current.netWorth.amount);
    const prevMonth = sortedHistory.length >= 2 ? sortedHistory[sortedHistory.length - 2] : null;
    const yearAgo = sortedHistory.length >= 1 ? sortedHistory[0] : null;
    const monthlyChange = prevMonth ? latestNetWorth - n(prevMonth.netWorth.amount) : 0;
    const monthlyChangePercent = prevMonth && n(prevMonth.netWorth.amount) !== 0 ? (monthlyChange / n(prevMonth.netWorth.amount)) * 100 : 0;
    const annualChange = yearAgo ? latestNetWorth - n(yearAgo.netWorth.amount) : 0;
    const annualChangePercent = yearAgo && n(yearAgo.netWorth.amount) !== 0 ? (annualChange / n(yearAgo.netWorth.amount)) * 100 : 0;

    const totalAssets = n(current.totalAssets.amount);
    const totalLiabilities = n(current.totalLiabilities.amount);
    const b = current.breakdown;

    const assetBreakdown = (
      [
        ["Liquid Cash & Savings", n(b.liquidCash)],
        ["Investments", n(b.investments)],
        ["Real Estate", n(b.realEstate)],
      ] as const
    )
      .filter(([, value]) => value > 0)
      .map(([category, value]) => ({
        category,
        value: toMoney(value, currency),
        percentage: totalAssets > 0 ? (value / totalAssets) * 100 : 0,
      }));

    const liabilityBreakdown = (
      [
        ["Loans Outstanding", n(b.loans)],
        ["Credit Card Balances", n(b.creditCards)],
      ] as const
    )
      .filter(([, value]) => value > 0)
      .map(([category, value]) => ({
        category,
        value: toMoney(value, currency),
        percentage: totalLiabilities > 0 ? (value / totalLiabilities) * 100 : 0,
      }));

    return {
      currentNetWorth: current.netWorth,
      monthlyChangeAmount: toMoney(monthlyChange, currency),
      monthlyChangePercent,
      annualChangeAmount: toMoney(annualChange, currency),
      annualChangePercent,
      history,
      topGrowthDrivers: [],
      assetBreakdown,
      liabilityBreakdown,
    };
  },

  getCashFlowAnalytics: async (): Promise<CashFlowAnalytics> => {
    const [historyRes, incomeSourcesRes] = await Promise.all([
      api.getCashFlow({ limit: 6 }).catch(() => null),
      api.getIncomeSources({ limit: 5 }).catch(() => null),
    ]);
    const sorted = [...unwrapList(historyRes)].sort((a, b) => a.period.localeCompare(b.period));
    if (sorted.length === 0) return EMPTY_CASH_FLOW;

    const history: CashFlowPoint[] = sorted.map((snap, idx, arr) => {
      const window = arr.slice(Math.max(0, idx - 2), idx + 1);
      const rollingAverage = window.reduce((sum, w) => sum + n(w.netSavings.amount), 0) / window.length;
      return {
        month: snap.period,
        income: n(snap.totalIncome.amount),
        expenses: n(snap.totalExpense.amount),
        netCashFlow: n(snap.netSavings.amount),
        rollingAverage,
      };
    });

    const latest = sorted[sorted.length - 1];
    const currency = latest.totalIncome.currency;
    const largestExpenseCategory = [...latest.categoryBreakdown].sort((a, b) => n(b.amount.amount) - n(a.amount.amount))[0];
    const incomeSources = unwrapList(incomeSourcesRes);
    const largestIncomeSourceRaw = [...incomeSources].sort((a, b) => n(b.expectedAmount.amount) - n(a.expectedAmount.amount))[0];
    const recentNet = history.slice(-3).map((h) => h.netCashFlow);
    const forecastNextMonth = recentNet.length ? recentNet.reduce((s, v) => s + v, 0) / recentNet.length : 0;

    return {
      totalIncomeThisMonth: latest.totalIncome,
      totalExpensesThisMonth: latest.totalExpense,
      netCashFlowThisMonth: latest.netSavings,
      savingsRatePercent: n(latest.savingsRate),
      history,
      largestIncomeSource: largestIncomeSourceRaw
        ? { name: largestIncomeSourceRaw.name, amount: largestIncomeSourceRaw.expectedAmount }
        : { name: "N/A", amount: toMoney(0, currency) },
      largestExpenseCategory: largestExpenseCategory
        ? { name: largestExpenseCategory.categoryName, amount: largestExpenseCategory.amount }
        : { name: "N/A", amount: toMoney(0, currency) },
      forecastNextMonth: toMoney(forecastNextMonth, currency),
    };
  },

  getSpendingAnalytics: async (): Promise<SpendingAnalytics> => {
    const [categoriesRes, merchantsRes, txRes] = await Promise.all([
      api.getExpensesByCategory().catch(() => []),
      api.getExpensesByMerchant().catch(() => []),
      api.getTransactions({ direction: "OUTFLOW", limit: 100 }).catch(() => null),
    ]);
    const categoriesRaw = Array.isArray(categoriesRes) ? categoriesRes : [];
    if (categoriesRaw.length === 0) return EMPTY_SPENDING;

    const currency = categoriesRaw[0].amount.currency;
    const totalSpentAmount = categoriesRaw.reduce((s, c) => s + n(c.amount.amount), 0);

    const categories: CategorySpending[] = categoriesRaw.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      amount: c.amount,
      percentage: n(c.percentage),
      needsVsWants: isNeedCategory(c.categoryName) ? "NEEDS" : "WANTS",
      previousMonthAmount: c.amount,
      monthOverMonthPercent: 0,
    }));

    const needsTotalAmount = categories.filter((c) => c.needsVsWants === "NEEDS").reduce((s, c) => s + n(c.amount.amount), 0);
    const wantsTotalAmount = Math.max(0, totalSpentAmount - needsTotalAmount);

    const transactions = unwrapList(txRes);
    const merchantsRaw = Array.isArray(merchantsRes) ? merchantsRes : [];
    const topMerchants: MerchantSpending[] = merchantsRaw.slice(0, 6).map((m) => {
      const matching = transactions.filter((t) => t.merchantName === m.merchantName);
      return {
        merchantName: m.merchantName,
        amount: m.amount,
        transactionCount: matching.length,
        category: matching[0]?.categoryName || "Uncategorized",
      };
    });

    const byDay = new Map<string, number>();
    for (const t of transactions) {
      const day = t.date.slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + n(t.amount.amount));
    }
    const dailyEntries = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    const avgDaily = dailyEntries.length ? dailyEntries.reduce((s, [, v]) => s + v, 0) / dailyEntries.length : 0;
    const dailyVelocity: DailySpendingPoint[] = dailyEntries.map(([date, amount]) => {
      let velocityRating: DailySpendingPoint["velocityRating"] = "NORMAL";
      if (avgDaily > 0) {
        if (amount > avgDaily * 2) velocityRating = "SPIKE";
        else if (amount > avgDaily * 1.3) velocityRating = "HIGH";
        else if (amount < avgDaily * 0.5) velocityRating = "LOW";
      }
      return { date, amount, velocityRating };
    });

    const spikeDay = dailyVelocity.find((d) => d.velocityRating === "SPIKE");
    const detectedAnomalies = spikeDay
      ? [
          {
            id: `anom-${spikeDay.date}`,
            title: "Unusual Daily Spend Detected",
            description: `Outflow on ${spikeDay.date} was ${avgDaily > 0 ? Math.round((spikeDay.amount / avgDaily - 1) * 100) : 0}% above the recent daily average.`,
            date: spikeDay.date,
            amount: toMoney(spikeDay.amount, currency),
          },
        ]
      : [];

    return {
      totalSpent: toMoney(totalSpentAmount, currency),
      needsTotal: toMoney(needsTotalAmount, currency),
      wantsTotal: toMoney(wantsTotalAmount, currency),
      needsPercent: totalSpentAmount > 0 ? (needsTotalAmount / totalSpentAmount) * 100 : 0,
      wantsPercent: totalSpentAmount > 0 ? (wantsTotalAmount / totalSpentAmount) * 100 : 0,
      categories,
      topMerchants,
      dailyVelocity,
      detectedAnomalies,
    };
  },

  getIncomeAnalytics: async (): Promise<IncomeAnalytics> => {
    const [sourcesRes, trendRes] = await Promise.all([
      api.getIncomeSources({ limit: 20 }).catch(() => null),
      api.getIncomeTrend({ limit: 12 }).catch(() => null),
    ]);
    const sourcesRaw = unwrapList(sourcesRes);
    if (sourcesRaw.length === 0) return EMPTY_INCOME;

    const currency = sourcesRaw[0].expectedAmount.currency;
    const monthlyMultiplier = (freq: string) => {
      switch ((freq || "").toUpperCase()) {
        case "WEEKLY": return 4.33;
        case "BIWEEKLY": return 2.17;
        case "ANNUAL":
        case "YEARLY": return 1 / 12;
        case "QUARTERLY": return 1 / 3;
        default: return 1;
      }
    };
    const sources: IncomeSource[] = sourcesRaw.map((s) => ({
      id: s.id,
      name: s.name,
      type: "OTHER",
      monthlyAmount: toMoney(n(s.expectedAmount.amount) * monthlyMultiplier(s.frequency), s.expectedAmount.currency),
      volatilityRating: "STABLE",
    }));
    const totalMonthlyIncome = sources.reduce((sum, s) => sum + n(s.monthlyAmount.amount), 0);

    const trendPoints = trendRes && typeof trendRes === "object" && "points" in trendRes && trendRes.points
      ? trendRes.points
      : unwrapList(trendRes as { data: { date: string; amount: Money }[] } | null);
    const sortedTrend = [...trendPoints].sort((a, b) => a.date.localeCompare(b.date));
    const first = sortedTrend[0];
    const last = sortedTrend[sortedTrend.length - 1];
    const incomeGrowthPercent1Y = first && last && n(first.amount.amount) !== 0
      ? ((n(last.amount.amount) - n(first.amount.amount)) / n(first.amount.amount)) * 100
      : 0;

    return {
      totalMonthlyIncome: toMoney(totalMonthlyIncome, currency),
      annualIncomeRunRate: toMoney(totalMonthlyIncome * 12, currency),
      sources,
      monthlyHistory: [],
      incomeGrowthPercent1Y,
    };
  },

  getBudgetAnalytics: async (): Promise<BudgetAnalytics> => {
    const dashboard = await api.getBudgetDashboard().catch(() => null);
    if (!dashboard) return EMPTY_BUDGETS;

    const allBudgets = [
      ...(dashboard.activeBudgets || []),
      ...(dashboard.exceededBudgets || []),
      ...(dashboard.nearLimitBudgets || []),
    ];
    const currency = allBudgets[0]?.currency || "INR";

    const budgets: BudgetHealthItem[] = allBudgets.map((budget) => {
      const allocated = n(budget.totalLimit.amount);
      const spent = n(budget.totalSpent?.amount ?? 0);
      const remaining = allocated - spent;
      const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
      const status: BudgetHealthItem["status"] = percentUsed > 100 ? "EXCEEDED" : percentUsed >= 85 ? "WARNING" : "HEALTHY";
      return {
        budgetId: budget.id,
        categoryName: budget.name,
        allocatedAmount: toMoney(allocated, budget.currency),
        spentAmount: toMoney(spent, budget.currency),
        remainingAmount: toMoney(remaining, budget.currency),
        percentUsed,
        status,
        forecastEndMonthAmount: budget.forecastMonthEndSpend ?? toMoney(spent, budget.currency),
        recommendation: status === "EXCEEDED"
          ? "Budget exceeded — review category spend."
          : status === "WARNING"
            ? "Approaching limit — monitor closely."
            : "On track.",
      };
    });

    return {
      totalBudgeted: toMoney(dashboard.totalBudget, currency),
      totalSpent: toMoney(dashboard.totalSpent, currency),
      overallPercentUsed: n(dashboard.overallUtilization),
      budgets,
      successHistoryPercent: dashboard.budgetHealthScore,
    };
  },

  getGoalAnalytics: async (): Promise<GoalAnalytics> => {
    const [dashboard, goalsRes] = await Promise.all([
      api.getGoalDashboard().catch(() => null),
      api.getGoals({ limit: 50 }).catch(() => null),
    ]);
    const goalsRaw = unwrapList(goalsRes);
    if (!dashboard && goalsRaw.length === 0) return EMPTY_GOALS;

    const goals: GoalAnalyticsItem[] = goalsRaw.map((g) => {
      const isBehindSchedule = g.goalHealth === "FAIR" || g.goalHealth === "POOR";
      return {
        goalId: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount || g.currentCorpus || toMoney(0, g.currency),
        progressPercent: n(g.progressPercent),
        requiredMonthlySavings: g.monthlyContribution || g.autoContributionAmount || toMoney(0, g.currency),
        projectedCompletionDate: g.estimatedCompletionDate || g.forecastCompletionDate || g.targetDate,
        isBehindSchedule,
        velocityScore: g.goalHealthScore ?? 0,
      };
    });
    const onTrackCount = goals.filter((g) => !g.isBehindSchedule).length;

    return {
      totalGoalsCount: dashboard ? dashboard.activeGoalsCount + dashboard.completedGoalsCount : goals.length,
      onTrackCount,
      behindCount: goals.length - onTrackCount,
      goals,
    };
  },

  getInvestmentAnalytics: async (): Promise<InvestmentAnalyticsOverview> => {
    const portfolios = await api.getInvestmentReturns().catch(() => []);
    const list = Array.isArray(portfolios) ? portfolios : [];
    if (list.length === 0) return EMPTY_INVESTMENTS;

    const totalValuation = list.reduce((s, p) => s + n(p.totalMarketValue), 0);
    const totalGain = list.reduce((s, p) => s + n(p.totalUnrealizedGain), 0);
    const xirrValues = list.map((p) => n(p.xirr)).filter((v) => v !== 0);
    const avgXirr = xirrValues.length ? xirrValues.reduce((s, v) => s + v, 0) / xirrValues.length : 0;

    const allHoldings = list.flatMap((p) => p.holdings);
    const sortedHoldings = [...allHoldings].sort((a, b) => n(b.unrealizedGainPercent) - n(a.unrealizedGainPercent));
    const best = sortedHoldings[0];
    const worst = sortedHoldings[sortedHoldings.length - 1];

    return {
      totalValuation: toMoney(totalValuation),
      totalGain: toMoney(totalGain),
      cagrPercent: avgXirr,
      xirrPercent: avgXirr,
      sharpeRatio: 0,
      volatilityPercent: 0,
      allocationDriftPercent: 0,
      bestHolding: best ? { symbol: best.symbol || "", name: best.name || "", returnPercent: n(best.unrealizedGainPercent) } : EMPTY_INVESTMENTS.bestHolding,
      worstHolding: worst ? { symbol: worst.symbol || "", name: worst.name || "", returnPercent: n(worst.unrealizedGainPercent) } : EMPTY_INVESTMENTS.worstHolding,
    };
  },

  getDebtAnalytics: async (): Promise<DebtAnalytics> => {
    const [loansRes, breakdown, summary] = await Promise.all([
      api.getLoans({ status: "ACTIVE" }).catch(() => []),
      api.getDebtBreakdown().catch(() => null),
      api.getLiabilitiesSummary().catch(() => null),
    ]);
    const loans = unwrapList(loansRes);
    if (loans.length === 0 && !breakdown) return EMPTY_DEBTS;

    const currency = "INR";
    const debts: DebtItem[] = loans.map((l) => {
      const outstandingRaw = l.outstandingPrincipal ?? l.outstandingBalance ?? l.principalAmount ?? "0";
      const emiRaw = l.monthlyEmi ?? l.emiAmount ?? l.installmentAmount ?? "0";
      const principalOutstanding = typeof outstandingRaw === "object" ? outstandingRaw : toMoney(outstandingRaw, currency);
      const monthlyEMI = typeof emiRaw === "object" ? emiRaw : toMoney(emiRaw, currency);
      return {
        id: l.id,
        name: l.name,
        type: mapLoanType(l.type),
        principalOutstanding,
        interestRatePercent: l.interestRate,
        monthlyEMI,
        remainingTenureMonths: l.remainingTenureMonths ?? l.tenureMonths ?? 0,
      };
    });

    const totalDebtAmount = breakdown?.totalDebt ? n(breakdown.totalDebt.amount) : debts.reduce((s, d) => s + n(d.principalOutstanding.amount), 0);
    const totalMonthlyEMI = debts.reduce((s, d) => s + n(d.monthlyEMI.amount), 0);
    const debtToIncomeRatioPercent = summary ? n(summary.debtToIncomeRatio) * 100 : 0;

    const simDebts = debts
      .map((d) => ({ balance: n(d.principalOutstanding.amount), rate: d.interestRatePercent, emi: n(d.monthlyEMI.amount) }))
      .filter((d) => d.balance > 0 && d.emi > 0);
    // Extra monthly budget beyond minimum EMIs: half of current EMI outflow,
    // used only to differentiate payoff order strategies (not a claimed cash figure).
    const extraBudget = totalMonthlyEMI * 0.5;
    const avalanche = simDebts.length ? simulatePayoff(simDebts, extraBudget, "rate") : { months: 0, totalInterest: 0 };
    const snowball = simDebts.length ? simulatePayoff(simDebts, extraBudget, "balance") : { months: 0, totalInterest: 0 };
    const interestSavedAvalanche = Math.max(0, snowball.totalInterest - avalanche.totalInterest);

    return {
      totalDebt: toMoney(totalDebtAmount, currency),
      totalMonthlyEMI: toMoney(totalMonthlyEMI, currency),
      debtToIncomeRatioPercent,
      snowballPayoffMonths: snowball.months,
      avalanchePayoffMonths: avalanche.months,
      interestSavedAvalanche: toMoney(interestSavedAvalanche, currency),
      debts,
    };
  },

  getSubscriptionAnalytics: async (): Promise<SubscriptionAnalytics> => {
    const res = await api.getSubscriptions({ limit: 50 }).catch(() => null);
    const list = unwrapList(res);
    if (list.length === 0) return EMPTY_SUBSCRIPTIONS;

    const currency = list[0].amount.currency;
    const subscriptions: SubscriptionItem[] = list.map((s) => {
      const isAnnual = ["ANNUAL", "YEARLY"].includes((s.billingCycle || "").toUpperCase());
      return {
        id: s.id,
        name: s.name,
        monthlyCost: isAnnual ? toMoney(n(s.amount.amount) / 12, s.amount.currency) : s.amount,
        billingFrequency: isAnnual ? "ANNUAL" : "MONTHLY",
        category: "Subscription",
        lastUsedDate: "",
        isUnused: false,
        priceIncreaseFlag: false,
      };
    });
    const totalMonthlyCost = subscriptions.reduce((sum, s) => sum + n(s.monthlyCost.amount), 0);

    return {
      totalMonthlyCost: toMoney(totalMonthlyCost, currency),
      totalAnnualCost: toMoney(totalMonthlyCost * 12, currency),
      totalSubscriptionsCount: subscriptions.length,
      unusedCount: 0,
      potentialAnnualSavings: toMoney(0, currency),
      subscriptions,
    };
  },

  getTrendAnalytics: async (): Promise<TrendAnalytics> => {
    const [incomeTrendRes, expenseTrendRes, incomeSourcesRes, expenseCategoriesRes] = await Promise.all([
      api.getIncomeTrend({ limit: 6 }).catch(() => null),
      api.getExpenseTrendAnalytics({ limit: 6 }).catch(() => null),
      api.getIncomeSources({ limit: 5 }).catch(() => null),
      api.getExpensesByCategory().catch(() => []),
    ]);
    const incomePoints = incomeTrendRes && typeof incomeTrendRes === "object" && "points" in incomeTrendRes && incomeTrendRes.points
      ? incomeTrendRes.points
      : unwrapList(incomeTrendRes as { data: { date: string; amount: Money }[] } | null);
    const expensePoints = unwrapList(expenseTrendRes);
    if (incomePoints.length === 0 && expensePoints.length === 0) return EMPTY_TRENDS;

    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const p of incomePoints) {
      const key = p.date.slice(0, 7);
      byMonth.set(key, { ...(byMonth.get(key) || { income: 0, expense: 0 }), income: n(p.amount.amount) });
    }
    for (const p of expensePoints) {
      const key = (p.month || "").slice(0, 7);
      const existing = byMonth.get(key) || { income: 0, expense: 0 };
      byMonth.set(key, { ...existing, expense: n(p.amount.amount) });
    }
    const months = [...byMonth.keys()].sort();
    let runningSum = 0;
    const trends: TrendPoint[] = months.map((month, idx) => {
      const { income, expense } = byMonth.get(month)!;
      const net = income - expense;
      runningSum += net;
      const window = months.slice(Math.max(0, idx - 2), idx + 1).map((m) => byMonth.get(m)!);
      const movingAverage3M = window.reduce((s, w) => s + (w.income - w.expense), 0) / window.length;
      return {
        period: month,
        netWorthTrend: runningSum,
        incomeTrend: income,
        expenseTrend: expense,
        savingsRateTrend: income > 0 ? (net / income) * 100 : 0,
        movingAverage3M,
      };
    });

    const incomeSources = unwrapList(incomeSourcesRes);
    const topIncomeSource = [...incomeSources].sort((a, b) => n(b.expectedAmount.amount) - n(a.expectedAmount.amount))[0];
    const expenseCategories = Array.isArray(expenseCategoriesRes) ? expenseCategoriesRes : [];
    const topExpenseCategory = [...expenseCategories].sort((a, b) => n(b.amount.amount) - n(a.amount.amount))[0];

    return {
      timeframe: "MONTHLY",
      trends,
      accelerationCategory: topIncomeSource?.name || "Income Growth",
      decelerationCategory: topExpenseCategory?.categoryName || "Expense Control",
    };
  },

  getForecastAnalytics: async (horizon: TimeHorizon = "1Y"): Promise<ForecastAnalytics> => {
    // currentAge/retirementAge are required by the backend (no user-profile
    // age field exists in this app), so default to the same 30/60 starting
    // point used by AnalyticsView's retirement forecast inputs.
    const [forecast, netWorth] = await Promise.all([
      api.getRetirementForecast({ currentAge: 30, retirementAge: 60 }).catch(() => null),
      api.getNetWorth().catch(() => null),
    ]);
    if (!forecast || !forecast.projectedCorpus) return { ...EMPTY_FORECASTS, horizon };

    const currentNetWorth = netWorth ? n(netWorth.netWorth.amount) : 0;
    const projectedCorpus = n(forecast.projectedCorpus.amount);
    const yearsToRetirement = Math.max(1, (forecast.retirementAge ?? 60) - (forecast.currentAge ?? 30));

    const HORIZON_YEARS: Record<TimeHorizon, number> = { "30D": 1 / 12, "90D": 0.25, "6M": 0.5, "1Y": 1, "3Y": 3, "5Y": 5, ALL: yearsToRetirement };
    const years = Math.min(yearsToRetirement, HORIZON_YEARS[horizon] ?? 1);
    const monthlySavingsNeeded = n(forecast.monthlySavingsNeeded?.amount);

    const steps = 4;
    const today = new Date();
    const forecasts: ForecastPoint[] = Array.from({ length: steps }, (_, i) => {
      const fraction = ((i + 1) / steps) * years;
      const date = new Date(today);
      date.setMonth(date.getMonth() + Math.round(fraction * 12));
      const projectedNetWorth = currentNetWorth + (projectedCorpus - currentNetWorth) * (fraction / yearsToRetirement);
      return {
        date: date.toISOString().slice(0, 10),
        projectedNetWorth,
        projectedSavings: monthlySavingsNeeded * fraction * 12,
        projectedDebt: 0,
        projectedInvestment: projectedNetWorth,
      };
    });

    const definedFields = [forecast.currentAge, forecast.retirementAge, forecast.expectedReturnPercent].filter((v) => v !== undefined).length;
    const confidenceScorePercent = Math.min(95, 60 + definedFields * 10);

    return { horizon, forecasts, confidenceScorePercent };
  },

  getRecommendations: async (): Promise<SmartRecommendation[]> => {
    const list = await api.getHealthRecommendations().catch(() => []);
    if (!Array.isArray(list) || list.length === 0) return [];

    const CATEGORY_MAP: Record<string, SmartRecommendation["category"]> = {
      CASH_FLOW: "SAVINGS",
      SAVINGS_RATE: "SAVINGS",
      EMERGENCY_FUND: "SAVINGS",
      DEBT_HEALTH: "DEBT",
      CREDIT_UTILIZATION: "DEBT",
      INVESTMENT_DIVERSIFICATION: "INVESTMENT",
      BILL_DISCIPLINE: "BUDGETS",
      SPENDING_DISCIPLINE: "BUDGETS",
    };

    return list.map((r, idx) => ({
      id: r.id || `rec-${idx}`,
      title: r.title || r.text,
      reason: r.description || r.text,
      impactType: Math.abs(r.estimatedImpact ?? r.scoreImpact ?? 0) >= 5 ? "HIGH_IMPACT" : "QUICK_WIN",
      category: (r.component && CATEGORY_MAP[r.component]) || "SAVINGS",
      estimatedMonthlySavings: toMoney(0),
      difficulty: "MEDIUM",
      confidencePercent: Math.min(99, 60 + Math.abs(r.estimatedImpact ?? r.scoreImpact ?? 0)),
      actionLabel: "View Details",
      actionRoute: r.deepLink || "#insights/recommendations",
    }));
  },

  getRiskMatrix: async (): Promise<RiskMatrixAnalytics> => {
    // Sourced from the Smart Action Center, not the retired `/finance/insights`
    // feed. That endpoint still responds but has returned zero rows since
    // generation was retired, so this page rendered 0/0/0/0 with no cards —
    // silently, because "no risks" looks identical to "working fine". The old
    // mapping was doubly broken: it read `description`/`category`/`isDismissed`/
    // `actionableLink`, none of which that endpoint ever returned.
    const res = await api
      .getSmartActions({ status: "ACTIVE", limit: 50 })
      .catch(() => null);
    const list = unwrapList(res).filter((a) => RISK_CATEGORIES[a.category]);
    if (list.length === 0) return EMPTY_RISKS;

    const risks: RiskItem[] = list.map((action) => ({
      id: action.id,
      title: action.title,
      category: RISK_CATEGORIES[action.category] ?? "OVERSPENDING",
      severity: RISK_SEVERITY[action.priority] ?? "LOW",
      confidencePercent: riskConfidencePercent(action),
      // `explanation` is the rule's structured "why" — always a concrete
      // comparison, never vague — which is exactly what this card wants.
      reason: action.explanation || action.description,
      affectedAccount: riskSubject(action),
      resolutionSteps: action.recommendation ? [action.recommendation] : [],
    }));

    return {
      criticalCount: risks.filter((r) => r.severity === "CRITICAL").length,
      highCount: risks.filter((r) => r.severity === "HIGH").length,
      mediumCount: risks.filter((r) => r.severity === "MEDIUM").length,
      lowCount: risks.filter((r) => r.severity === "LOW").length,
      risks,
    };
  },

  generateAnalyticsReport: async (reportType: AnalyticsReportType): Promise<AnalyticsReportPayload> => {
    return {
      reportType,
      generatedAt: new Date().toISOString(),
      period: new Date().toISOString().slice(0, 7),
      summaryText: "Report generation from live account data is not yet available from the backend.",
    };
  },
};
