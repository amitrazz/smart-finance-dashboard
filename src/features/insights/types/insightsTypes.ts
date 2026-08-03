export interface Money {
  amount: string;
  currency: string;
}

export type TimeHorizon = "30D" | "90D" | "6M" | "1Y" | "3Y" | "5Y" | "ALL";
export type RiskSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RecommendationImpact = "HIGH_IMPACT" | "QUICK_WIN" | "LONG_TERM";

// 1. Financial Health Dimension
export interface HealthDimension {
  code: string;
  label: string;
  score: number; // 0 - 100
  stars: number; // 1 - 5
  why: string;
  recommendation: string;
  improvementTip: string;
  historicalTrendPercent: number;
}

export interface FinancialHealthOverview {
  overallScore: number;
  rating: string;
  historicalScores: { date: string; score: number }[];
  dimensions: HealthDimension[];
  scoreTrend: "UPWARD" | "STABLE" | "DOWNWARD";
}

// 2. Net Worth Analytics
export interface NetWorthPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface NetWorthAnalytics {
  currentNetWorth: Money;
  monthlyChangeAmount: Money;
  monthlyChangePercent: number;
  annualChangeAmount: Money;
  annualChangePercent: number;
  history: NetWorthPoint[];
  topGrowthDrivers: { name: string; category: string; growthAmount: Money; growthPercent: number }[];
  assetBreakdown: { category: string; value: Money; percentage: number; color?: string }[];
  liabilityBreakdown: { category: string; value: Money; percentage: number; color?: string }[];
}

// 3. Cash Flow Analytics
export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  rollingAverage: number;
}

export interface CashFlowAnalytics {
  totalIncomeThisMonth: Money;
  totalExpensesThisMonth: Money;
  netCashFlowThisMonth: Money;
  savingsRatePercent: number;
  history: CashFlowPoint[];
  largestIncomeSource: { name: string; amount: Money };
  largestExpenseCategory: { name: string; amount: Money };
  forecastNextMonth: Money;
}

// 4. Spending Intelligence
export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: Money;
  percentage: number;
  needsVsWants: "NEEDS" | "WANTS";
  previousMonthAmount: Money;
  monthOverMonthPercent: number;
}

export interface MerchantSpending {
  merchantName: string;
  amount: Money;
  transactionCount: number;
  category: string;
}

export interface DailySpendingPoint {
  date: string;
  amount: number;
  velocityRating: "LOW" | "NORMAL" | "HIGH" | "SPIKE";
}

export interface SpendingAnalytics {
  totalSpent: Money;
  needsTotal: Money;
  wantsTotal: Money;
  needsPercent: number;
  wantsPercent: number;
  categories: CategorySpending[];
  topMerchants: MerchantSpending[];
  dailyVelocity: DailySpendingPoint[];
  detectedAnomalies: { id: string; title: string; description: string; date: string; amount: Money }[];
}

// 5. Income Analytics
export interface IncomeSource {
  id: string;
  name: string;
  type: "SALARY" | "PASSIVE_DIVIDEND" | "RENTAL" | "INVESTMENT_GAIN" | "FREELANCE" | "OTHER";
  monthlyAmount: Money;
  volatilityRating: "STABLE" | "MODERATE" | "HIGHLY_VOLATILE";
}

export interface IncomeAnalytics {
  totalMonthlyIncome: Money;
  annualIncomeRunRate: Money;
  sources: IncomeSource[];
  monthlyHistory: { month: string; salary: number; passive: number; investment: number }[];
  incomeGrowthPercent1Y: number;
}

// 6. Budget Analytics
export interface BudgetHealthItem {
  budgetId: string;
  categoryName: string;
  allocatedAmount: Money;
  spentAmount: Money;
  remainingAmount: Money;
  percentUsed: number;
  status: "HEALTHY" | "WARNING" | "EXCEEDED";
  forecastEndMonthAmount: Money;
  recommendation: string;
}

export interface BudgetAnalytics {
  totalBudgeted: Money;
  totalSpent: Money;
  overallPercentUsed: number;
  budgets: BudgetHealthItem[];
  successHistoryPercent: number; // e.g. 92% of months under budget
}

// 7. Goal Analytics
export interface GoalAnalyticsItem {
  goalId: string;
  name: string;
  targetAmount: Money;
  currentAmount: Money;
  progressPercent: number;
  requiredMonthlySavings: Money;
  projectedCompletionDate: string;
  isBehindSchedule: boolean;
  velocityScore: number;
}

export interface GoalAnalytics {
  totalGoalsCount: number;
  onTrackCount: number;
  behindCount: number;
  goals: GoalAnalyticsItem[];
}

// 8. Investment Analytics
export interface InvestmentAnalyticsOverview {
  totalValuation: Money;
  totalGain: Money;
  cagrPercent: number;
  xirrPercent: number;
  sharpeRatio: number;
  volatilityPercent: number;
  allocationDriftPercent: number;
  bestHolding: { symbol: string; name: string; returnPercent: number };
  worstHolding: { symbol: string; name: string; returnPercent: number };
}

// 9. Debt & Loan Analytics
export interface DebtItem {
  id: string;
  name: string;
  type: "HOME_LOAN" | "CAR_LOAN" | "PERSONAL_LOAN" | "CREDIT_CARD";
  principalOutstanding: Money;
  interestRatePercent: number;
  monthlyEMI: Money;
  remainingTenureMonths: number;
}

export interface DebtAnalytics {
  totalDebt: Money;
  totalMonthlyEMI: Money;
  debtToIncomeRatioPercent: number;
  snowballPayoffMonths: number;
  avalanchePayoffMonths: number;
  interestSavedAvalanche: Money;
  debts: DebtItem[];
}

// 10. Subscription Analytics
export interface SubscriptionItem {
  id: string;
  name: string;
  monthlyCost: Money;
  billingFrequency: "MONTHLY" | "ANNUAL";
  category: string;
  lastUsedDate: string;
  isUnused: boolean;
  priceIncreaseFlag: boolean;
}

export interface SubscriptionAnalytics {
  totalMonthlyCost: Money;
  totalAnnualCost: Money;
  totalSubscriptionsCount: number;
  unusedCount: number;
  potentialAnnualSavings: Money;
  subscriptions: SubscriptionItem[];
}

// 11. Trends
export interface TrendPoint {
  period: string;
  netWorthTrend: number;
  incomeTrend: number;
  expenseTrend: number;
  savingsRateTrend: number;
  movingAverage3M: number;
}

export interface TrendAnalytics {
  timeframe: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  trends: TrendPoint[];
  accelerationCategory: string;
  decelerationCategory: string;
}

// 12. Forecasts
export interface ForecastPoint {
  date: string;
  projectedNetWorth: number;
  projectedSavings: number;
  projectedDebt: number;
  projectedInvestment: number;
}

export interface ForecastAnalytics {
  horizon: TimeHorizon;
  forecasts: ForecastPoint[];
  confidenceScorePercent: number;
}

// 13. Recommendations Priority Inbox
export interface SmartRecommendation {
  id: string;
  title: string;
  reason: string;
  impactType: RecommendationImpact;
  category: "SAVINGS" | "INVESTMENT" | "DEBT" | "SUBSCRIPTIONS" | "BUDGETS";
  estimatedMonthlySavings: Money;
  difficulty: "EASY" | "MEDIUM" | "ADVANCED";
  confidencePercent: number;
  actionLabel: string;
  actionRoute: string;
}

// 14. Risk Matrix Dashboard
export interface RiskItem {
  id: string;
  title: string;
  category: "OVERSPENDING" | "CASH_FLOW" | "DEBT" | "CREDIT" | "INVESTMENTS" | "EMERGENCY_FUND";
  severity: RiskSeverity;
  confidencePercent: number;
  reason: string;
  affectedAccount: string;
  resolutionSteps: string[];
}

export interface RiskMatrixAnalytics {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  risks: RiskItem[];
}

// 15. Reports Generator
export type AnalyticsReportType =
  | "MONTHLY_REVIEW"
  | "QUARTERLY_REVIEW"
  | "YEARLY_REVIEW"
  | "TAX_SUMMARY"
  | "INVESTMENT_REVIEW"
  | "DEBT_REVIEW"
  | "CASH_FLOW_REPORT";

export interface AnalyticsReportPayload {
  reportType: AnalyticsReportType;
  generatedAt: string;
  period: string;
  summaryText: string;
  downloadUrlPdf?: string;
  downloadUrlExcel?: string;
}

// 16. Workspace Global Filters
export interface InsightsFilterState {
  dateRange: TimeHorizon;
  accountId?: string;
  currency: string;
  categoryId?: string;
  portfolioId?: string;
}
