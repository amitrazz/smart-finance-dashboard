import { fetchWithAuth } from "../../../services/api/client";
import {
  FinancialHealthOverview,
  NetWorthAnalytics,
  CashFlowAnalytics,
  SpendingAnalytics,
  IncomeAnalytics,
  BudgetAnalytics,
  GoalAnalytics,
  InvestmentAnalyticsOverview,
  DebtAnalytics,
  SubscriptionAnalytics,
  TrendAnalytics,
  ForecastAnalytics,
  SmartRecommendation,
  RiskMatrixAnalytics,
  AnalyticsReportPayload,
  AnalyticsReportType,
  TimeHorizon,
} from "../types/insightsTypes";

// Mock Fallback Generator when backend API endpoints are booting
const MOCK_FINANCIAL_HEALTH: FinancialHealthOverview = {
  overallScore: 82,
  rating: "Excellent",
  scoreTrend: "UPWARD",
  historicalScores: [
    { date: "2026-03-01", score: 74 },
    { date: "2026-04-01", score: 76 },
    { date: "2026-05-01", score: 78 },
    { date: "2026-06-01", score: 80 },
    { date: "2026-07-01", score: 81 },
    { date: "2026-08-01", score: 82 },
  ],
  dimensions: [
    {
      code: "CASH_FLOW",
      label: "Net Cash Flow",
      score: 88,
      stars: 5,
      why: "Positive net cash flow run rate with +28.5% savings rate.",
      recommendation: "Maintain current expenditure controls.",
      improvementTip: "Automate monthly surplus sweep to index funds.",
      historicalTrendPercent: 4.2,
    },
    {
      code: "SAVINGS_RATE",
      label: "Savings Rate",
      score: 85,
      stars: 4,
      why: "Saving ₹74,500/mo out of ₹2,60,000 monthly income.",
      recommendation: "Increase SIP by 5% on next salary appraisal.",
      improvementTip: "Cap un-budgeted weekend dining expenses.",
      historicalTrendPercent: 2.1,
    },
    {
      code: "EMERGENCY_FUND",
      label: "Emergency Liquidity",
      score: 95,
      stars: 5,
      why: "5.8 months of liquid expenses saved in high-yield FDs & liquid MFs.",
      recommendation: "Emergency corpus is optimal.",
      improvementTip: "Review liquid fund yield quarterly.",
      historicalTrendPercent: 0,
    },
    {
      code: "DEBT_HEALTH",
      label: "Debt-to-Income Ratio",
      score: 76,
      stars: 4,
      why: "EMI outflow is 22.4% of net monthly income (Ceiling: 35%).",
      recommendation: "Prepay home loan principal with annual bonus.",
      improvementTip: "Accelerate high-rate debt payoff.",
      historicalTrendPercent: 5.4,
    },
    {
      code: "CREDIT_UTILIZATION",
      label: "Credit Card Usage",
      score: 92,
      stars: 5,
      why: "Credit card utilization is 14% across 3 active card accounts.",
      recommendation: "Excellent credit score maintenance.",
      improvementTip: "Keep card balances below 30% statement limit.",
      historicalTrendPercent: 1.0,
    },
    {
      code: "INVESTMENT_DIVERSIFICATION",
      label: "Asset Diversification",
      score: 72,
      stars: 3,
      why: "Technology sector weight (28.5%) exceeds target ceiling (20%).",
      recommendation: "Rebalance technology profits into gold or debt funds.",
      improvementTip: "Add international index fund exposure.",
      historicalTrendPercent: -1.5,
    },
    {
      code: "BILL_DISCIPLINE",
      label: "Bill Payment Discipline",
      score: 100,
      stars: 5,
      why: "100% on-time payment track record across 48 bill cycles.",
      recommendation: "Flawless discipline maintained.",
      improvementTip: "Continue auto-debit triggers.",
      historicalTrendPercent: 0,
    },
    {
      code: "SPENDING_DISCIPLINE",
      label: "Budget Adherence",
      score: 80,
      stars: 4,
      why: "Adhering to budget in 7 out of 9 active spend categories.",
      recommendation: "Dining out category exceeded budget by ₹4,200.",
      improvementTip: "Set weekly food delivery caps.",
      historicalTrendPercent: 3.0,
    },
  ],
};

const MOCK_NET_WORTH: NetWorthAnalytics = {
  currentNetWorth: { amount: "6485400.00", currency: "INR" },
  monthlyChangeAmount: { amount: "+148500.00", currency: "INR" },
  monthlyChangePercent: 2.34,
  annualChangeAmount: { amount: "+1245000.00", currency: "INR" },
  annualChangePercent: 23.75,
  history: [
    { date: "2025-08-01", netWorth: 5240400, totalAssets: 6840400, totalLiabilities: 1600000 },
    { date: "2025-11-01", netWorth: 5580000, totalAssets: 7120000, totalLiabilities: 1540000 },
    { date: "2026-02-01", netWorth: 5920000, totalAssets: 7400000, totalLiabilities: 1480000 },
    { date: "2026-05-01", netWorth: 6210000, totalAssets: 7630000, totalLiabilities: 1420000 },
    { date: "2026-08-01", netWorth: 6485400, totalAssets: 7845400, totalLiabilities: 1360000 },
  ],
  topGrowthDrivers: [
    { name: "Parag Parikh Flexi Cap Fund", category: "MUTUAL_FUND", growthAmount: { amount: "166431.00", currency: "INR" }, growthPercent: 49.24 },
    { name: "Sovereign Gold Bond 2028 IX", category: "GOLD", growthAmount: { amount: "186400.00", currency: "INR" }, growthPercent: 48.34 },
    { name: "Reliance Industries Ltd", category: "EQUITY", growthAmount: { amount: "100500.00", currency: "INR" }, growthPercent: 27.35 },
  ],
  assetBreakdown: [
    { category: "Equity & Mutual Funds", value: { amount: "3135000.00", currency: "INR" }, percentage: 39.96, color: "#6366f1" },
    { category: "Real Estate Property", value: { amount: "2500000.00", currency: "INR" }, percentage: 31.86, color: "#10b981" },
    { category: "Gold & SGBs", value: { amount: "673400.00", currency: "INR" }, percentage: 8.58, color: "#f59e0b" },
    { category: "Fixed Deposits & Provident Fund", value: { amount: "1052000.00", currency: "INR" }, percentage: 13.41, color: "#3b82f6" },
    { category: "Cash & Savings Accounts", value: { amount: "485000.00", currency: "INR" }, percentage: 6.18, color: "#64748b" },
  ],
  liabilityBreakdown: [
    { category: "Housing Loan Outstanding", value: { amount: "1280000.00", currency: "INR" }, percentage: 94.12, color: "#rose-500" },
    { category: "Credit Card Balances", value: { amount: "80000.00", currency: "INR" }, percentage: 5.88, color: "#amber-500" },
  ],
};

const MOCK_CASH_FLOW: CashFlowAnalytics = {
  totalIncomeThisMonth: { amount: "260000.00", currency: "INR" },
  totalExpensesThisMonth: { amount: "115500.00", currency: "INR" },
  netCashFlowThisMonth: { amount: "+144500.00", currency: "INR" },
  savingsRatePercent: 55.57,
  largestIncomeSource: { name: "Primary Salary", amount: { amount: "240000.00", currency: "INR" } },
  largestExpenseCategory: { name: "Housing Rent & Maintenance", amount: { amount: "38000.00", currency: "INR" } },
  forecastNextMonth: { amount: "+148000.00", currency: "INR" },
  history: [
    { month: "Mar 2026", income: 250000, expenses: 122000, netCashFlow: 128000, rollingAverage: 125000 },
    { month: "Apr 2026", income: 250000, expenses: 118000, netCashFlow: 132000, rollingAverage: 128000 },
    { month: "May 2026", income: 255000, expenses: 110000, netCashFlow: 145000, rollingAverage: 132000 },
    { month: "Jun 2026", income: 255000, expenses: 114000, netCashFlow: 141000, rollingAverage: 135000 },
    { month: "Jul 2026", income: 260000, expenses: 119000, netCashFlow: 141000, rollingAverage: 138000 },
    { month: "Aug 2026", income: 260000, expenses: 115500, netCashFlow: 144500, rollingAverage: 142000 },
  ],
};

const MOCK_SPENDING: SpendingAnalytics = {
  totalSpent: { amount: "115500.00", currency: "INR" },
  needsTotal: { amount: "74000.00", currency: "INR" },
  wantsTotal: { amount: "41500.00", currency: "INR" },
  needsPercent: 64.07,
  wantsPercent: 35.93,
  categories: [
    { categoryId: "cat-housing", categoryName: "Housing & Utilities", amount: { amount: "38000.00", currency: "INR" }, percentage: 32.90, needsVsWants: "NEEDS", previousMonthAmount: { amount: "38000.00", currency: "INR" }, monthOverMonthPercent: 0 },
    { categoryId: "cat-groceries", categoryName: "Groceries & Supplies", amount: { amount: "18500.00", currency: "INR" }, percentage: 16.02, needsVsWants: "NEEDS", previousMonthAmount: { amount: "17800.00", currency: "INR" }, monthOverMonthPercent: 3.93 },
    { categoryId: "cat-dining", categoryName: "Dining & Food Outing", amount: { amount: "16200.00", currency: "INR" }, percentage: 14.03, needsVsWants: "WANTS", previousMonthAmount: { amount: "12000.00", currency: "INR" }, monthOverMonthPercent: 35.00 },
    { categoryId: "cat-travel", categoryName: "Transport & Fuel", amount: { amount: "14500.00", currency: "INR" }, percentage: 12.55, needsVsWants: "NEEDS", previousMonthAmount: { amount: "14000.00", currency: "INR" }, monthOverMonthPercent: 3.57 },
    { categoryId: "cat-shopping", categoryName: "Shopping & Gadgets", amount: { amount: "12800.00", currency: "INR" }, percentage: 11.08, needsVsWants: "WANTS", previousMonthAmount: { amount: "15500.00", currency: "INR" }, monthOverMonthPercent: -17.42 },
    { categoryId: "cat-subscriptions", categoryName: "Subscriptions & SaaS", amount: { amount: "6500.00", currency: "INR" }, percentage: 5.63, needsVsWants: "WANTS", previousMonthAmount: { amount: "6500.00", currency: "INR" }, monthOverMonthPercent: 0 },
    { categoryId: "cat-misc", categoryName: "Entertainment & Misc", amount: { amount: "9000.00", currency: "INR" }, percentage: 7.79, needsVsWants: "WANTS", previousMonthAmount: { amount: "8000.00", currency: "INR" }, monthOverMonthPercent: 12.50 },
  ],
  topMerchants: [
    { merchantName: "Swiggy / Zomato", amount: { amount: "11200.00", currency: "INR" }, transactionCount: 14, category: "Dining Out" },
    { merchantName: "Blinkit / Zepto", amount: { amount: "12400.00", currency: "INR" }, transactionCount: 18, category: "Groceries" },
    { merchantName: "Amazon India", amount: { amount: "9800.00", currency: "INR" }, transactionCount: 4, category: "Shopping" },
    { merchantName: "HPCL Fuel Outlet", amount: { amount: "6500.00", currency: "INR" }, transactionCount: 3, category: "Fuel" },
  ],
  dailyVelocity: [
    { date: "2026-08-01", amount: 2400, velocityRating: "NORMAL" },
    { date: "2026-08-02", amount: 18500, velocityRating: "SPIKE" },
    { date: "2026-08-03", amount: 1200, velocityRating: "NORMAL" },
  ],
  detectedAnomalies: [
    { id: "anom-1", title: "Dining Out Spend Spike (+35%)", description: "Weekend restaurant expenditures exceeded historical 3-month average by ₹4,200.", date: "2026-08-02", amount: { amount: "4200.00", currency: "INR" } },
  ],
};

const MOCK_INCOME: IncomeAnalytics = {
  totalMonthlyIncome: { amount: "260000.00", currency: "INR" },
  annualIncomeRunRate: { amount: "3120000.00", currency: "INR" },
  incomeGrowthPercent1Y: 12.5,
  sources: [
    { id: "inc-1", name: "Primary Employment Salary", type: "SALARY", monthlyAmount: { amount: "240000.00", currency: "INR" }, volatilityRating: "STABLE" },
    { id: "inc-2", name: "Equity Dividends & Interest", type: "PASSIVE_DIVIDEND", monthlyAmount: { amount: "12000.00", currency: "INR" }, volatilityRating: "MODERATE" },
    { id: "inc-3", name: "Freelance Tech Consulting", type: "FREELANCE", monthlyAmount: { amount: "8000.00", currency: "INR" }, volatilityRating: "HIGHLY_VOLATILE" },
  ],
  monthlyHistory: [
    { month: "Mar 2026", salary: 230000, passive: 10000, investment: 10000 },
    { month: "Apr 2026", salary: 230000, passive: 12000, investment: 8000 },
    { month: "May 2026", salary: 240000, passive: 9000, investment: 6000 },
    { month: "Jun 2026", salary: 240000, passive: 11000, investment: 4000 },
    { month: "Jul 2026", salary: 240000, passive: 14000, investment: 6000 },
    { month: "Aug 2026", salary: 240000, passive: 12000, investment: 8000 },
  ],
};

const MOCK_BUDGETS: BudgetAnalytics = {
  totalBudgeted: { amount: "120000.00", currency: "INR" },
  totalSpent: { amount: "115500.00", currency: "INR" },
  overallPercentUsed: 96.25,
  successHistoryPercent: 88,
  budgets: [
    { budgetId: "b-1", categoryName: "Housing & Utilities", allocatedAmount: { amount: "40000.00", currency: "INR" }, spentAmount: { amount: "38000.00", currency: "INR" }, remainingAmount: { amount: "2000.00", currency: "INR" }, percentUsed: 95.0, status: "HEALTHY", forecastEndMonthAmount: { amount: "38000.00", currency: "INR" }, recommendation: "On track." },
    { budgetId: "b-2", categoryName: "Groceries & Supplies", allocatedAmount: { amount: "20000.00", currency: "INR" }, spentAmount: { amount: "18500.00", currency: "INR" }, remainingAmount: { amount: "1500.00", currency: "INR" }, percentUsed: 92.5, status: "HEALTHY", forecastEndMonthAmount: { amount: "19500.00", currency: "INR" }, recommendation: "Within safety margin." },
    { budgetId: "b-3", categoryName: "Dining Out", allocatedAmount: { amount: "12000.00", currency: "INR" }, spentAmount: { amount: "16200.00", currency: "INR" }, remainingAmount: { amount: "-4200.00", currency: "INR" }, percentUsed: 135.0, status: "EXCEEDED", forecastEndMonthAmount: { amount: "17500.00", currency: "INR" }, recommendation: "Budget exceeded. Limit food delivery orders." },
  ],
};

const MOCK_GOALS: GoalAnalytics = {
  totalGoalsCount: 3,
  onTrackCount: 2,
  behindCount: 1,
  goals: [
    { goalId: "g-1", name: "Early Retirement Corpus", targetAmount: { amount: "50000000.00", currency: "INR" }, currentAmount: { amount: "2450000.00", currency: "INR" }, progressPercent: 4.9, requiredMonthlySavings: { amount: "65000.00", currency: "INR" }, projectedCompletionDate: "2039-06-15", isBehindSchedule: false, velocityScore: 94 },
    { goalId: "g-2", name: "Villa Down Payment", targetAmount: { amount: "10000000.00", currency: "INR" }, currentAmount: { amount: "1250000.00", currency: "INR" }, progressPercent: 12.5, requiredMonthlySavings: { amount: "115000.00", currency: "INR" }, projectedCompletionDate: "2030-03-31", isBehindSchedule: true, velocityScore: 68 },
    { goalId: "g-3", name: "Emergency Liquidity Corpus", targetAmount: { amount: "600000.00", currency: "INR" }, currentAmount: { amount: "585400.00", currency: "INR" }, progressPercent: 97.57, requiredMonthlySavings: { amount: "5000.00", currency: "INR" }, projectedCompletionDate: "2026-11-15", isBehindSchedule: false, velocityScore: 99 },
  ],
};

const MOCK_INVESTMENTS: InvestmentAnalyticsOverview = {
  totalValuation: { amount: "4285400.00", currency: "INR" },
  totalGain: { amount: "+1035400.00", currency: "INR" },
  cagrPercent: 16.75,
  xirrPercent: 18.42,
  sharpeRatio: 1.64,
  volatilityPercent: 12.4,
  allocationDriftPercent: 8.5,
  bestHolding: { symbol: "PPFCF", name: "Parag Parikh Flexi Cap Fund", returnPercent: 49.24 },
  worstHolding: { symbol: "PAYTM", name: "One97 Communications Ltd", returnPercent: -1.78 },
};

const MOCK_DEBTS: DebtAnalytics = {
  totalDebt: { amount: "1360000.00", currency: "INR" },
  totalMonthlyEMI: { amount: "58200.00", currency: "INR" },
  debtToIncomeRatioPercent: 22.38,
  snowballPayoffMonths: 28,
  avalanchePayoffMonths: 24,
  interestSavedAvalanche: { amount: "142500.00", currency: "INR" },
  debts: [
    { id: "d-1", name: "HDFC Housing Loan", type: "HOME_LOAN", principalOutstanding: { amount: "1280000.00", currency: "INR" }, interestRatePercent: 8.5, monthlyEMI: { amount: "52000.00", currency: "INR" }, remainingTenureMonths: 28 },
    { id: "d-2", name: "ICICI Sapphiro Credit Card", type: "CREDIT_CARD", principalOutstanding: { amount: "80000.00", currency: "INR" }, interestRatePercent: 42.0, monthlyEMI: { amount: "6200.00", currency: "INR" }, remainingTenureMonths: 2 },
  ],
};

const MOCK_SUBSCRIPTIONS: SubscriptionAnalytics = {
  totalMonthlyCost: { amount: "6500.00", currency: "INR" },
  totalAnnualCost: { amount: "78000.00", currency: "INR" },
  totalSubscriptionsCount: 8,
  unusedCount: 2,
  potentialAnnualSavings: { amount: "18000.00", currency: "INR" },
  subscriptions: [
    { id: "s-1", name: "ChatGPT Plus Subscription", monthlyCost: { amount: "1650.00", currency: "INR" }, billingFrequency: "MONTHLY", category: "AI Tools", lastUsedDate: "2026-08-01", isUnused: false, priceIncreaseFlag: false },
    { id: "s-2", name: "Netflix Premium 4K", monthlyCost: { amount: "649.00", currency: "INR" }, billingFrequency: "MONTHLY", category: "Streaming", lastUsedDate: "2026-05-10", isUnused: true, priceIncreaseFlag: true },
    { id: "s-3", name: "Spotify Family Plan", monthlyCost: { amount: "179.00", currency: "INR" }, billingFrequency: "MONTHLY", category: "Music", lastUsedDate: "2026-08-02", isUnused: false, priceIncreaseFlag: false },
  ],
};

const MOCK_TRENDS: TrendAnalytics = {
  timeframe: "MONTHLY",
  accelerationCategory: "Mutual Fund SIP Growth",
  decelerationCategory: "Credit Card Impulse Spend",
  trends: [
    { period: "Mar 2026", netWorthTrend: 5920000, incomeTrend: 250000, expenseTrend: 122000, savingsRateTrend: 51.2, movingAverage3M: 125000 },
    { period: "Apr 2026", netWorthTrend: 6050000, incomeTrend: 250000, expenseTrend: 118000, savingsRateTrend: 52.8, movingAverage3M: 128000 },
    { period: "May 2026", netWorthTrend: 6210000, incomeTrend: 255000, expenseTrend: 110000, savingsRateTrend: 56.8, movingAverage3M: 132000 },
    { period: "Jun 2026", netWorthTrend: 6320000, incomeTrend: 255000, expenseTrend: 114000, savingsRateTrend: 55.2, movingAverage3M: 135000 },
    { period: "Jul 2026", netWorthTrend: 6410000, incomeTrend: 260000, expenseTrend: 119000, savingsRateTrend: 54.2, movingAverage3M: 138000 },
    { period: "Aug 2026", netWorthTrend: 6485400, incomeTrend: 260000, expenseTrend: 115500, savingsRateTrend: 55.5, movingAverage3M: 142000 },
  ],
};

const MOCK_FORECASTS: ForecastAnalytics = {
  horizon: "1Y",
  confidenceScorePercent: 92,
  forecasts: [
    { date: "2026-09-01", projectedNetWorth: 6630000, projectedSavings: 630000, projectedDebt: 1310000, projectedInvestment: 4430000 },
    { date: "2026-12-01", projectedNetWorth: 7080000, projectedSavings: 780000, projectedDebt: 1160000, projectedInvestment: 4860000 },
    { date: "2027-03-01", projectedNetWorth: 7550000, projectedSavings: 930000, projectedDebt: 1010000, projectedInvestment: 5310000 },
    { date: "2027-06-01", projectedNetWorth: 8040000, projectedSavings: 1090000, projectedDebt: 860000, projectedInvestment: 5780000 },
  ],
};

const MOCK_RECOMMENDATIONS: SmartRecommendation[] = [
  {
    id: "rec-1",
    title: "Cancel Unused Netflix Premium Subscription",
    reason: "Zero stream activity detected in last 84 days while monthly cost is ₹649.",
    impactType: "QUICK_WIN",
    category: "SUBSCRIPTIONS",
    estimatedMonthlySavings: { amount: "649.00", currency: "INR" },
    difficulty: "EASY",
    confidencePercent: 98,
    actionLabel: "Manage Subscriptions",
    actionRoute: "#insights/subscriptions",
  },
  {
    id: "rec-2",
    title: "Prepay High-Interest Credit Card Outstanding",
    reason: "Paying off ₹80,000 credit card balance @ 42% p.a. saves ₹33,600 annual interest penalty.",
    impactType: "HIGH_IMPACT",
    category: "DEBT",
    estimatedMonthlySavings: { amount: "2800.00", currency: "INR" },
    difficulty: "EASY",
    confidencePercent: 99,
    actionLabel: "Payoff Debt Now",
    actionRoute: "#insights/debts",
  },
  {
    id: "rec-3",
    title: "Increase Parag Parikh Flexi Cap SIP by 10%",
    reason: "Monthly surplus of ₹1,44,500 allows increasing SIP to accelerate Early Retirement goal by 14 months.",
    impactType: "LONG_TERM",
    category: "INVESTMENT",
    estimatedMonthlySavings: { amount: "15000.00", currency: "INR" },
    difficulty: "MEDIUM",
    confidencePercent: 91,
    actionLabel: "Boost SIP",
    actionRoute: "#insights/investments",
  },
];

const MOCK_RISKS: RiskMatrixAnalytics = {
  criticalCount: 0,
  highCount: 1,
  mediumCount: 2,
  lowCount: 1,
  risks: [
    {
      id: "risk-1",
      title: "Technology Sector Over-Concentration",
      category: "INVESTMENTS",
      severity: "HIGH",
      confidencePercent: 94,
      reason: "28.5% of total portfolio value is concentrated in tech stocks (Target Ceiling: 20%).",
      affectedAccount: "Zerodha Demat Account",
      resolutionSteps: [
        "Pause fresh SIP buys in Tech index funds for 3 months.",
        "Allocate monthly surplus to Nifty 50 or Sovereign Gold Bonds.",
      ],
    },
    {
      id: "risk-2",
      title: "Dining Out Budget Exceeded (+35%)",
      category: "OVERSPENDING",
      severity: "MEDIUM",
      confidencePercent: 89,
      reason: "Swiggy & restaurant charges reached ₹16,200 (Allocated budget: ₹12,000).",
      affectedAccount: "HDFC Primary Bank Account",
      resolutionSteps: [
        "Set weekly meal delivery spending cap.",
        "Use prepaid card for entertainment expenses.",
      ],
    },
  ],
};

export const insightsApi = {
  getFinancialHealth: async (): Promise<FinancialHealthOverview> => {
    try {
      const res = await fetchWithAuth<FinancialHealthOverview>("/analytics/health");
      return res || MOCK_FINANCIAL_HEALTH;
    } catch {
      return MOCK_FINANCIAL_HEALTH;
    }
  },

  getNetWorthAnalytics: async (): Promise<NetWorthAnalytics> => {
    try {
      const res = await fetchWithAuth<NetWorthAnalytics>("/analytics/net-worth");
      return res || MOCK_NET_WORTH;
    } catch {
      return MOCK_NET_WORTH;
    }
  },

  getCashFlowAnalytics: async (): Promise<CashFlowAnalytics> => {
    try {
      const res = await fetchWithAuth<CashFlowAnalytics>("/analytics/cash-flow");
      return res || MOCK_CASH_FLOW;
    } catch {
      return MOCK_CASH_FLOW;
    }
  },

  getSpendingAnalytics: async (): Promise<SpendingAnalytics> => {
    try {
      const res = await fetchWithAuth<SpendingAnalytics>("/analytics/spending");
      return res || MOCK_SPENDING;
    } catch {
      return MOCK_SPENDING;
    }
  },

  getIncomeAnalytics: async (): Promise<IncomeAnalytics> => {
    try {
      const res = await fetchWithAuth<IncomeAnalytics>("/analytics/income");
      return res || MOCK_INCOME;
    } catch {
      return MOCK_INCOME;
    }
  },

  getBudgetAnalytics: async (): Promise<BudgetAnalytics> => {
    try {
      const res = await fetchWithAuth<BudgetAnalytics>("/analytics/budgets");
      return res || MOCK_BUDGETS;
    } catch {
      return MOCK_BUDGETS;
    }
  },

  getGoalAnalytics: async (): Promise<GoalAnalytics> => {
    try {
      const res = await fetchWithAuth<GoalAnalytics>("/analytics/goals");
      return res || MOCK_GOALS;
    } catch {
      return MOCK_GOALS;
    }
  },

  getInvestmentAnalytics: async (): Promise<InvestmentAnalyticsOverview> => {
    try {
      const res = await fetchWithAuth<InvestmentAnalyticsOverview>("/analytics/investments");
      return res || MOCK_INVESTMENTS;
    } catch {
      return MOCK_INVESTMENTS;
    }
  },

  getDebtAnalytics: async (): Promise<DebtAnalytics> => {
    try {
      const res = await fetchWithAuth<DebtAnalytics>("/analytics/debts");
      return res || MOCK_DEBTS;
    } catch {
      return MOCK_DEBTS;
    }
  },

  getSubscriptionAnalytics: async (): Promise<SubscriptionAnalytics> => {
    try {
      const res = await fetchWithAuth<SubscriptionAnalytics>("/analytics/subscriptions");
      return res || MOCK_SUBSCRIPTIONS;
    } catch {
      return MOCK_SUBSCRIPTIONS;
    }
  },

  getTrendAnalytics: async (): Promise<TrendAnalytics> => {
    try {
      const res = await fetchWithAuth<TrendAnalytics>("/analytics/trends");
      return res || MOCK_TRENDS;
    } catch {
      return MOCK_TRENDS;
    }
  },

  getForecastAnalytics: async (horizon: TimeHorizon = "1Y"): Promise<ForecastAnalytics> => {
    try {
      const res = await fetchWithAuth<ForecastAnalytics>(`/analytics/forecasts?horizon=${horizon}`);
      return res || { ...MOCK_FORECASTS, horizon };
    } catch {
      return { ...MOCK_FORECASTS, horizon };
    }
  },

  getRecommendations: async (): Promise<SmartRecommendation[]> => {
    try {
      const res = await fetchWithAuth<SmartRecommendation[]>("/analytics/recommendations");
      return Array.isArray(res) && res.length > 0 ? res : MOCK_RECOMMENDATIONS;
    } catch {
      return MOCK_RECOMMENDATIONS;
    }
  },

  getRiskMatrix: async (): Promise<RiskMatrixAnalytics> => {
    try {
      const res = await fetchWithAuth<RiskMatrixAnalytics>("/analytics/risks");
      return res || MOCK_RISKS;
    } catch {
      return MOCK_RISKS;
    }
  },

  generateAnalyticsReport: async (reportType: AnalyticsReportType): Promise<AnalyticsReportPayload> => {
    return {
      reportType,
      generatedAt: new Date().toISOString(),
      period: "FY 2025-2026",
      summaryText: "Precomputed comprehensive financial intelligence assessment report.",
    };
  },
};
