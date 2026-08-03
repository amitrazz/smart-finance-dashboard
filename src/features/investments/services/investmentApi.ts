import { fetchWithAuth } from "../../../services/api/client";
import {
  PortfolioSummary,
  Holding,
  HoldingLot,
  SecurityAsset,
  InvestmentInsight,
  CorporateAction,
  PerformanceAnalytics,
  AllocationOverview,
  InvestmentGoalLink,
  IncomeDashboardData,
  InvestmentTransaction,
  WatchlistItem,
  ImportJobState,
  ImportSourceType,
  ReportPayload,
  ReportType,
  SearchResultItem,
  InvestmentFilterState,
} from "../types/investmentTypes";

// Mock Fallback Generator when backend API is starting or in dev mode
const MOCK_PORTFOLIO_SUMMARY: PortfolioSummary = {
  id: "pf-main-001",
  name: "Master Wealth Portfolio",
  currency: "INR",
  currentValue: { amount: "4285400.00", currency: "INR" },
  investedAmount: { amount: "3250000.00", currency: "INR" },
  availableCash: { amount: "185000.00", currency: "INR" },
  todayGainLoss: { amount: "+24850.50", currency: "INR" },
  todayGainLossPercent: 0.58,
  lifetimeReturn: { amount: "+1035400.00", currency: "INR" },
  lifetimeReturnPercent: 31.86,
  xirr: 18.42,
  cagr: 16.75,
  riskMetrics: {
    overallScore: 68,
    riskCategory: "BALANCED",
    concentrationRiskScore: 42,
    sectorRiskScore: 58,
    volatilityRating: "Moderate Volatility (12.4%)",
    largestHoldingWeight: 14.2,
    largestSectorWeight: 28.5,
  },
  totalHoldingsCount: 18,
  benchmarkName: "NIFTY 50 TRI",
  benchmarkReturnPercent: 24.10,
  outperformingBenchmark: true,
  lastCalculatedAt: new Date().toISOString(),
};

const MOCK_INSIGHTS: InvestmentInsight[] = [
  {
    id: "ins-001",
    title: "Technology Sector Exposure Warning",
    description: "Your technology asset weight (28.5%) exceeds recommended allocation ceiling (20.0%).",
    severity: "WARNING",
    category: "ALLOCATION",
    actionLabel: "Rebalance Portfolio",
    actionRoute: "#investments/allocation",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ins-002",
    title: "Upcoming Dividend Expected Next Week",
    description: "TCS announced ₹28.00 per share dividend payout estimated at ₹4,200.00 on Aug 12, 2026.",
    severity: "INFO",
    category: "INCOME",
    actionLabel: "View Income Calendar",
    actionRoute: "#investments/income",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ins-003",
    title: "Fixed Deposit Maturing Soon",
    description: "HDFC Senior FD (₹2,50,000 @ 7.75%) matures in 6 days on Aug 08, 2026.",
    severity: "CRITICAL",
    category: "MATURITY",
    actionLabel: "Plan Reinvestment",
    actionRoute: "#investments/holdings",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ins-004",
    title: "Outperforming Benchmark",
    description: "Your 1Y XIRR (18.42%) is outperforming NIFTY 50 TRI (+14.20%) by +4.22%.",
    severity: "SUCCESS",
    category: "BENCHMARK",
    actionLabel: "See Analytics",
    actionRoute: "#investments/performance",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ins-005",
    title: "Upcoming SIP Tomorrow",
    description: "Parag Parikh Flexi Cap Fund monthly SIP of ₹15,000 will be auto-debited tomorrow.",
    severity: "INFO",
    category: "SIP",
    actionLabel: "Manage SIPs",
    actionRoute: "#investments/transactions",
    createdAt: new Date().toISOString(),
  },
];

const MOCK_HOLDINGS: Holding[] = [
  {
    id: "h-001",
    portfolioId: "pf-main-001",
    securityId: "sec-rel",
    symbol: "RELIANCE",
    securityName: "Reliance Industries Ltd",
    assetClass: "EQUITY",
    sector: "Energy & Petrochemicals",
    quantity: 150,
    averageCostPrice: { amount: "2450.00", currency: "INR" },
    totalCost: { amount: "367500.00", currency: "INR" },
    currentPrice: { amount: "3120.00", currency: "INR" },
    currentValue: { amount: "468000.00", currency: "INR" },
    unrealizedGain: { amount: "100500.00", currency: "INR" },
    unrealizedGainPercent: 27.35,
    realizedGain: { amount: "12500.00", currency: "INR" },
    dayChangeAmount: { amount: "+3450.00", currency: "INR" },
    dayChangePercent: 0.74,
    allocationPercent: 10.92,
    brokerName: "Zerodha",
    lastUpdated: new Date().toISOString(),
    mappedGoalIds: ["goal-retirement"],
    lots: [
      {
        id: "lot-r1",
        holdingId: "h-001",
        purchaseDate: "2023-04-15",
        purchaseQuantity: 100,
        remainingQuantity: 100,
        purchaseCostPerUnit: { amount: "2380.00", currency: "INR" },
        totalCost: { amount: "238000.00", currency: "INR" },
        currentValue: { amount: "312000.00", currency: "INR" },
        unrealizedGain: { amount: "74000.00", currency: "INR" },
        unrealizedGainPercent: 31.09,
        realizedGainToDate: { amount: "0.00", currency: "INR" },
        holdingPeriodDays: 840,
        taxTerm: "LONG_TERM",
        fifoStatus: "UNTOUCHED",
        brokerAccount: "Zerodha Demat",
      },
      {
        id: "lot-r2",
        holdingId: "h-001",
        purchaseDate: "2024-01-10",
        purchaseQuantity: 50,
        remainingQuantity: 50,
        purchaseCostPerUnit: { amount: "2590.00", currency: "INR" },
        totalCost: { amount: "129500.00", currency: "INR" },
        currentValue: { amount: "156000.00", currency: "INR" },
        unrealizedGain: { amount: "26500.00", currency: "INR" },
        unrealizedGainPercent: 20.46,
        realizedGainToDate: { amount: "0.00", currency: "INR" },
        holdingPeriodDays: 569,
        taxTerm: "LONG_TERM",
        fifoStatus: "UNTOUCHED",
        brokerAccount: "Zerodha Demat",
      },
    ],
  },
  {
    id: "h-002",
    portfolioId: "pf-main-001",
    securityId: "sec-ppfc",
    symbol: "PPFCF",
    securityName: "Parag Parikh Flexi Cap Fund Direct Growth",
    assetClass: "MUTUAL_FUND",
    sector: "Diversified Equity",
    quantity: 6450.82,
    averageCostPrice: { amount: "52.40", currency: "INR" },
    totalCost: { amount: "338023.00", currency: "INR" },
    currentPrice: { amount: "78.20", currency: "INR" },
    currentValue: { amount: "504454.00", currency: "INR" },
    unrealizedGain: { amount: "166431.00", currency: "INR" },
    unrealizedGainPercent: 49.24,
    realizedGain: { amount: "0.00", currency: "INR" },
    dayChangeAmount: { amount: "+2450.00", currency: "INR" },
    dayChangePercent: 0.49,
    allocationPercent: 11.77,
    brokerName: "Groww",
    lastUpdated: new Date().toISOString(),
    mappedGoalIds: ["goal-wealth", "goal-retirement"],
    lots: [
      {
        id: "lot-p1",
        holdingId: "h-002",
        purchaseDate: "2022-06-01",
        purchaseQuantity: 3000,
        remainingQuantity: 3000,
        purchaseCostPerUnit: { amount: "46.20", currency: "INR" },
        totalCost: { amount: "138600.00", currency: "INR" },
        currentValue: { amount: "234600.00", currency: "INR" },
        unrealizedGain: { amount: "96000.00", currency: "INR" },
        unrealizedGainPercent: 69.26,
        realizedGainToDate: { amount: "0.00", currency: "INR" },
        holdingPeriodDays: 1158,
        taxTerm: "LONG_TERM",
        fifoStatus: "UNTOUCHED",
        brokerAccount: "Groww MF Direct",
      },
      {
        id: "lot-p2",
        holdingId: "h-002",
        purchaseDate: "2023-08-15",
        purchaseQuantity: 3450.82,
        remainingQuantity: 3450.82,
        purchaseCostPerUnit: { amount: "57.80", currency: "INR" },
        totalCost: { amount: "199423.00", currency: "INR" },
        currentValue: { amount: "269854.00", currency: "INR" },
        unrealizedGain: { amount: "70431.00", currency: "INR" },
        unrealizedGainPercent: 35.32,
        realizedGainToDate: { amount: "0.00", currency: "INR" },
        holdingPeriodDays: 718,
        taxTerm: "LONG_TERM",
        fifoStatus: "UNTOUCHED",
        brokerAccount: "Groww MF Direct",
      },
    ],
  },
  {
    id: "h-003",
    portfolioId: "pf-main-001",
    securityId: "sec-sgb",
    symbol: "SGB2028IX",
    securityName: "Sovereign Gold Bond 2028 Series IX",
    assetClass: "SGB",
    sector: "Precious Metals",
    quantity: 80,
    averageCostPrice: { amount: "4820.00", currency: "INR" },
    totalCost: { amount: "385600.00", currency: "INR" },
    currentPrice: { amount: "7150.00", currency: "INR" },
    currentValue: { amount: "572000.00", currency: "INR" },
    unrealizedGain: { amount: "186400.00", currency: "INR" },
    unrealizedGainPercent: 48.34,
    realizedGain: { amount: "19280.00", currency: "INR" },
    dayChangeAmount: { amount: "+1200.00", currency: "INR" },
    dayChangePercent: 0.21,
    allocationPercent: 13.35,
    brokerName: "RBI Retail Direct",
    lastUpdated: new Date().toISOString(),
    mappedGoalIds: ["goal-house"],
    lots: [
      {
        id: "lot-sgb1",
        holdingId: "h-003",
        purchaseDate: "2021-11-25",
        purchaseQuantity: 80,
        remainingQuantity: 80,
        purchaseCostPerUnit: { amount: "4820.00", currency: "INR" },
        totalCost: { amount: "385600.00", currency: "INR" },
        currentValue: { amount: "572000.00", currency: "INR" },
        unrealizedGain: { amount: "186400.00", currency: "INR" },
        unrealizedGainPercent: 48.34,
        realizedGainToDate: { amount: "19280.00", currency: "INR" },
        holdingPeriodDays: 1711,
        taxTerm: "LONG_TERM",
        fifoStatus: "UNTOUCHED",
        brokerAccount: "RBI Retail Direct Account",
      },
    ],
  },
  {
    id: "h-004",
    portfolioId: "pf-main-001",
    securityId: "sec-hdfc-fd",
    symbol: "HDFC-FD-775",
    securityName: "HDFC Senior Fixed Deposit 7.75%",
    assetClass: "FIXED_DEPOSIT",
    sector: "Banking / Debt",
    quantity: 1,
    averageCostPrice: { amount: "250000.00", currency: "INR" },
    totalCost: { amount: "250000.00", currency: "INR" },
    currentPrice: { amount: "288500.00", currency: "INR" },
    currentValue: { amount: "288500.00", currency: "INR" },
    unrealizedGain: { amount: "38500.00", currency: "INR" },
    unrealizedGainPercent: 15.40,
    realizedGain: { amount: "0.00", currency: "INR" },
    dayChangeAmount: { amount: "0.00", currency: "INR" },
    dayChangePercent: 0,
    allocationPercent: 6.73,
    brokerName: "HDFC Bank",
    lastUpdated: new Date().toISOString(),
    mappedGoalIds: ["goal-emergency"],
    lots: [
      {
        id: "lot-fd1",
        holdingId: "h-004",
        purchaseDate: "2024-08-08",
        purchaseQuantity: 1,
        remainingQuantity: 1,
        purchaseCostPerUnit: { amount: "250000.00", currency: "INR" },
        totalCost: { amount: "250000.00", currency: "INR" },
        currentValue: { amount: "288500.00", currency: "INR" },
        unrealizedGain: { amount: "38500.00", currency: "INR" },
        unrealizedGainPercent: 15.40,
        realizedGainToDate: { amount: "0.00", currency: "INR" },
        holdingPeriodDays: 724,
        taxTerm: "SHORT_TERM",
        fifoStatus: "UNTOUCHED",
        brokerAccount: "HDFC Bank FD Account",
      },
    ],
  },
];

const MOCK_CORPORATE_ACTIONS: CorporateAction[] = [
  {
    id: "ca-001",
    securityId: "sec-tcs",
    symbol: "TCS",
    securityName: "Tata Consultancy Services Ltd",
    actionType: "DIVIDEND",
    recordDate: "2026-08-10",
    exDate: "2026-08-09",
    executionDate: "2026-08-18",
    status: "UPCOMING",
    description: "Interim Dividend of ₹28.00 per equity share for FY 2026-27.",
    ratioOrRate: "₹28.00 / share",
    estimatedAmount: { amount: "4200.00", currency: "INR" },
    taxable: true,
  },
  {
    id: "ca-002",
    securityId: "sec-hdfc-fd",
    symbol: "HDFC-FD-775",
    securityName: "HDFC Senior Fixed Deposit 7.75%",
    actionType: "FD_MATURITY",
    recordDate: "2026-08-08",
    executionDate: "2026-08-08",
    status: "UPCOMING",
    description: "FD maturity payout including principal ₹2,50,000 + accumulated interest ₹38,500.",
    ratioOrRate: "7.75% p.a.",
    estimatedAmount: { amount: "288500.00", currency: "INR" },
    taxable: true,
  },
  {
    id: "ca-003",
    securityId: "sec-sgb",
    symbol: "SGB2028IX",
    securityName: "Sovereign Gold Bond 2028 Series IX",
    actionType: "SGB_INTEREST",
    recordDate: "2026-05-25",
    executionDate: "2026-05-25",
    status: "COMPLETED",
    description: "Semi-annual 2.50% p.a. interest payout credited directly to bank account.",
    ratioOrRate: "2.50% p.a.",
    finalAmount: { amount: "4820.00", currency: "INR" },
    taxable: false,
  },
  {
    id: "ca-004",
    securityId: "sec-infosys",
    symbol: "INFY",
    securityName: "Infosys Limited",
    actionType: "DIVIDEND",
    recordDate: "2026-06-15",
    executionDate: "2026-06-25",
    status: "COMPLETED",
    description: "Final Dividend of ₹20.00 per share paid for FY26.",
    ratioOrRate: "₹20.00 / share",
    finalAmount: { amount: "3000.00", currency: "INR" },
    taxable: true,
  },
];

const MOCK_PERFORMANCE_ANALYTICS: PerformanceAnalytics = {
  portfolioId: "pf-main-001",
  timeframe: "1Y",
  cagr: 16.75,
  xirr: 18.42,
  sharpeRatio: 1.64,
  alpha: 4.22,
  beta: 0.88,
  volatilityPercent: 12.40,
  maxDrawdownPercent: -7.85,
  rollingReturn3YAvg: 17.50,
  benchmarkName: "NIFTY 50 TRI",
  benchmarkCagr: 14.10,
  benchmarkXirr: 14.20,
  growthHistory: [
    { date: "2025-08-01", portfolioValue: 3250000, investedCapital: 3100000, benchmarkValue: 3250000 },
    { date: "2025-10-01", portfolioValue: 3420000, investedCapital: 3150000, benchmarkValue: 3380000 },
    { date: "2025-12-01", portfolioValue: 3650000, investedCapital: 3200000, benchmarkValue: 3520000 },
    { date: "2026-02-01", portfolioValue: 3880000, investedCapital: 3220000, benchmarkValue: 3690000 },
    { date: "2026-04-01", portfolioValue: 4050000, investedCapital: 3240000, benchmarkValue: 3820000 },
    { date: "2026-06-01", portfolioValue: 4190000, investedCapital: 3250000, benchmarkValue: 3940000 },
    { date: "2026-08-01", portfolioValue: 4285400, investedCapital: 3250000, benchmarkValue: 4010000 },
  ],
  topContributors: [
    {
      securityId: "sec-ppfc",
      symbol: "PPFCF",
      securityName: "Parag Parikh Flexi Cap Fund",
      assetClass: "MUTUAL_FUND",
      absoluteReturnAmount: { amount: "+166431.00", currency: "INR" },
      percentageContributionToPortfolio: 16.07,
    },
    {
      securityId: "sec-sgb",
      symbol: "SGB2028IX",
      securityName: "Sovereign Gold Bond 2028 IX",
      assetClass: "SGB",
      absoluteReturnAmount: { amount: "+186400.00", currency: "INR" },
      percentageContributionToPortfolio: 18.00,
    },
    {
      securityId: "sec-rel",
      symbol: "RELIANCE",
      securityName: "Reliance Industries Ltd",
      assetClass: "EQUITY",
      absoluteReturnAmount: { amount: "+100500.00", currency: "INR" },
      percentageContributionToPortfolio: 9.70,
    },
  ],
  topDetractors: [
    {
      securityId: "sec-paytm",
      symbol: "PAYTM",
      securityName: "One97 Communications Ltd",
      assetClass: "EQUITY",
      absoluteReturnAmount: { amount: "-18500.00", currency: "INR" },
      percentageContributionToPortfolio: -1.78,
    },
  ],
  heatmapData: [
    { symbol: "RELIANCE", securityName: "Reliance Industries", assetClass: "EQUITY", marketCap: 2100000, dayChangePercent: 0.74, totalReturnPercent: 27.35 },
    { symbol: "PPFCF", securityName: "Parag Parikh Flexi Cap", assetClass: "MUTUAL_FUND", marketCap: 65000, dayChangePercent: 0.49, totalReturnPercent: 49.24 },
    { symbol: "SGB2028IX", securityName: "Sovereign Gold Bond", assetClass: "SGB", marketCap: 50000, dayChangePercent: 0.21, totalReturnPercent: 48.34 },
    { symbol: "TCS", securityName: "Tata Consultancy Services", assetClass: "EQUITY", marketCap: 1500000, dayChangePercent: -0.42, totalReturnPercent: 18.50 },
    { symbol: "HDFC-FD", securityName: "HDFC Fixed Deposit", assetClass: "FIXED_DEPOSIT", marketCap: 288500, dayChangePercent: 0, totalReturnPercent: 15.40 },
  ],
};

const MOCK_ALLOCATION: AllocationOverview = {
  byAssetClass: [
    { id: "ac-eq", name: "Equity Stocks", value: { amount: "1850000.00", currency: "INR" }, percentage: 43.17, color: "#6366f1" },
    { id: "ac-mf", name: "Mutual Funds", value: { amount: "1285000.00", currency: "INR" }, percentage: 29.99, color: "#10b981" },
    { id: "ac-gold", name: "Gold & SGBs", value: { amount: "673400.00", currency: "INR" }, percentage: 15.71, color: "#f59e0b" },
    { id: "ac-fd", name: "Fixed Deposits & Debt", value: { amount: "292000.00", currency: "INR" }, percentage: 6.81, color: "#3b82f6" },
    { id: "ac-cash", name: "Cash Equivalents", value: { amount: "185000.00", currency: "INR" }, percentage: 4.32, color: "#64748b" },
  ],
  bySector: [
    { id: "sec-tech", name: "Technology & Software", value: { amount: "1220000.00", currency: "INR" }, percentage: 28.47, color: "#8b5cf6" },
    { id: "sec-bank", name: "Financial Services / Banking", value: { amount: "980000.00", currency: "INR" }, percentage: 22.87, color: "#06b6d4" },
    { id: "sec-gold", name: "Precious Metals", value: { amount: "673400.00", currency: "INR" }, percentage: 15.71, color: "#f59e0b" },
    { id: "sec-energy", name: "Energy & Infrastructure", value: { amount: "640000.00", currency: "INR" }, percentage: 14.93, color: "#ec4899" },
    { id: "sec-cg", name: "Consumer Goods & Auto", value: { amount: "587000.00", currency: "INR" }, percentage: 13.70, color: "#84cc16" },
    { id: "sec-cash", name: "Cash & Liquid", value: { amount: "185000.00", currency: "INR" }, percentage: 4.32, color: "#64748b" },
  ],
  byCountry: [
    { id: "ct-in", name: "India (Domestic)", value: { amount: "3856900.00", currency: "INR" }, percentage: 90.00, color: "#10b981" },
    { id: "ct-us", name: "United States (Global)", value: { amount: "428500.00", currency: "INR" }, percentage: 10.00, color: "#3b82f6" },
  ],
  byMarketCap: [
    { id: "mc-large", name: "Large Cap", value: { amount: "2650000.00", currency: "INR" }, percentage: 61.84, color: "#4f46e5" },
    { id: "mc-mid", name: "Mid Cap", value: { amount: "1120000.00", currency: "INR" }, percentage: 26.13, color: "#06b6d4" },
    { id: "mc-small", name: "Small Cap", value: { amount: "515400.00", currency: "INR" }, percentage: 12.03, color: "#f43f5e" },
  ],
  byBroker: [
    { id: "br-zerodha", name: "Zerodha Broking", value: { amount: "2150000.00", currency: "INR" }, percentage: 50.17, color: "#f97316" },
    { id: "br-groww", name: "Groww Direct", value: { amount: "1285000.00", currency: "INR" }, percentage: 29.99, color: "#10b981" },
    { id: "br-rbi", name: "RBI Retail Direct", value: { amount: "572000.00", currency: "INR" }, percentage: 13.35, color: "#eab308" },
    { id: "br-hdfc", name: "HDFC Bank Direct", value: { amount: "278400.00", currency: "INR" }, percentage: 6.49, color: "#3b82f6" },
  ],
  byAccount: [
    { id: "acc-demat", name: "Zerodha Demat (IN300123)", value: { amount: "2150000.00", currency: "INR" }, percentage: 50.17 },
    { id: "acc-mf", name: "Folio Direct Mutual Funds", value: { amount: "1285000.00", currency: "INR" }, percentage: 29.99 },
    { id: "acc-rbisgb", name: "RBI SGB Depository", value: { amount: "572000.00", currency: "INR" }, percentage: 13.35 },
    { id: "acc-fd", name: "HDFC FD Account", value: { amount: "278400.00", currency: "INR" }, percentage: 6.49 },
  ],
  byCurrency: [
    { id: "cur-inr", name: "INR (Indian Rupee)", value: { amount: "4285400.00", currency: "INR" }, percentage: 100.00, color: "#10b981" },
  ],
};

const MOCK_GOALS: InvestmentGoalLink[] = [
  {
    goalId: "goal-retirement",
    goalName: "Early Retirement Corpus (FI/RE)",
    goalCategory: "RETIREMENT",
    targetAmount: { amount: "50000000.00", currency: "INR" },
    currentValue: { amount: "2450000.00", currency: "INR" },
    allocatedPortfolioValue: { amount: "2450000.00", currency: "INR" },
    targetDate: "2038-12-31",
    goalProgressPercent: 4.90,
    requiredMonthlyContribution: { amount: "65000.00", currency: "INR" },
    projectedCompletionDate: "2039-06-15",
    fundingGap: { amount: "47550000.00", currency: "INR" },
    isBehindSchedule: false,
  },
  {
    goalId: "goal-house",
    goalName: "Villa Down Payment",
    goalCategory: "HOUSE",
    targetAmount: { amount: "10000000.00", currency: "INR" },
    currentValue: { amount: "1250000.00", currency: "INR" },
    allocatedPortfolioValue: { amount: "1250000.00", currency: "INR" },
    targetDate: "2029-06-30",
    goalProgressPercent: 12.50,
    requiredMonthlyContribution: { amount: "115000.00", currency: "INR" },
    projectedCompletionDate: "2030-03-31",
    fundingGap: { amount: "8750000.00", currency: "INR" },
    isBehindSchedule: true,
  },
  {
    goalId: "goal-emergency",
    goalName: "Emergency Liquidity Corpus",
    goalCategory: "EMERGENCY_FUND",
    targetAmount: { amount: "600000.00", currency: "INR" },
    currentValue: { amount: "585400.00", currency: "INR" },
    allocatedPortfolioValue: { amount: "585400.00", currency: "INR" },
    targetDate: "2026-12-31",
    goalProgressPercent: 97.57,
    requiredMonthlyContribution: { amount: "5000.00", currency: "INR" },
    projectedCompletionDate: "2026-11-15",
    fundingGap: { amount: "14600.00", currency: "INR" },
    isBehindSchedule: false,
  },
];

const MOCK_INCOME: IncomeDashboardData = {
  totalReceivedThisYear: { amount: "42800.00", currency: "INR" },
  totalUpcomingThisYear: { amount: "18500.00", currency: "INR" },
  averageMonthlyIncome: { amount: "5108.33", currency: "INR" },
  projectedAnnualYieldPercent: 1.43,
  recentEvents: MOCK_CORPORATE_ACTIONS.filter((a) => a.status === "COMPLETED"),
  upcomingEvents: MOCK_CORPORATE_ACTIONS.filter((a) => a.status === "UPCOMING"),
  monthlyBreakdown: [
    { month: "Jan 2026", receivedDividends: { amount: "2400.00", currency: "INR" }, receivedInterest: { amount: "1200.00", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "3600.00", currency: "INR" } },
    { month: "Feb 2026", receivedDividends: { amount: "5200.00", currency: "INR" }, receivedInterest: { amount: "0", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "5200.00", currency: "INR" } },
    { month: "Mar 2026", receivedDividends: { amount: "14500.00", currency: "INR" }, receivedInterest: { amount: "2500.00", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "17000.00", currency: "INR" } },
    { month: "Apr 2026", receivedDividends: { amount: "1800.00", currency: "INR" }, receivedInterest: { amount: "0", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "1800.00", currency: "INR" } },
    { month: "May 2026", receivedDividends: { amount: "0", currency: "INR" }, receivedInterest: { amount: "4820.00", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "4820.00", currency: "INR" } },
    { month: "Jun 2026", receivedDividends: { amount: "3000.00", currency: "INR" }, receivedInterest: { amount: "0", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "3000.00", currency: "INR" } },
    { month: "Jul 2026", receivedDividends: { amount: "7380.00", currency: "INR" }, receivedInterest: { amount: "0", currency: "INR" }, upcomingEstimatedIncome: { amount: "0", currency: "INR" }, totalIncome: { amount: "7380.00", currency: "INR" } },
    { month: "Aug 2026", receivedDividends: { amount: "0", currency: "INR" }, receivedInterest: { amount: "0", currency: "INR" }, upcomingEstimatedIncome: { amount: "4200.00", currency: "INR" }, totalIncome: { amount: "4200.00", currency: "INR" } },
  ],
};

const MOCK_TRANSACTIONS: InvestmentTransaction[] = [
  {
    id: "tx-001",
    portfolioId: "pf-main-001",
    securityId: "sec-rel",
    symbol: "RELIANCE",
    securityName: "Reliance Industries Ltd",
    type: "BUY",
    date: "2024-01-10",
    quantity: 50,
    pricePerUnit: { amount: "2590.00", currency: "INR" },
    totalAmount: { amount: "129500.00", currency: "INR" },
    fees: { amount: "120.00", currency: "INR" },
    brokerName: "Zerodha",
    accountName: "Zerodha Demat",
    lotId: "lot-r2",
  },
  {
    id: "tx-002",
    portfolioId: "pf-main-001",
    securityId: "sec-ppfc",
    symbol: "PPFCF",
    securityName: "Parag Parikh Flexi Cap Fund",
    type: "BUY",
    date: "2023-08-15",
    quantity: 3450.82,
    pricePerUnit: { amount: "57.80", currency: "INR" },
    totalAmount: { amount: "199423.00", currency: "INR" },
    fees: { amount: "0.00", currency: "INR" },
    brokerName: "Groww",
    accountName: "Groww Direct Folio",
    lotId: "lot-p2",
  },
  {
    id: "tx-003",
    portfolioId: "pf-main-001",
    securityId: "sec-tcs",
    symbol: "TCS",
    securityName: "Tata Consultancy Services Ltd",
    type: "DIVIDEND",
    date: "2026-01-20",
    totalAmount: { amount: "3600.00", currency: "INR" },
    taxes: { amount: "360.00", currency: "INR" },
    brokerName: "Zerodha",
    accountName: "HDFC Primary Bank",
  },
  {
    id: "tx-004",
    portfolioId: "pf-main-001",
    securityId: "sec-sgb",
    symbol: "SGB2028IX",
    securityName: "Sovereign Gold Bond 2028 IX",
    type: "INTEREST",
    date: "2026-05-25",
    totalAmount: { amount: "4820.00", currency: "INR" },
    fees: { amount: "0.00", currency: "INR" },
    brokerName: "RBI Retail Direct",
    accountName: "RBI Direct Savings",
  },
];

const MOCK_WATCHLIST: WatchlistItem[] = [
  {
    id: "w-001",
    securityId: "sec-nifty-50",
    symbol: "NIFTYBEES",
    securityName: "Nippon India ETF Nifty BeES",
    assetClass: "MUTUAL_FUND",
    currentPrice: { amount: "268.40", currency: "INR" },
    dayChangePercent: 0.62,
    targetBuyPrice: { amount: "255.00", currency: "INR" },
    alertOnPriceDrop: true,
    notes: "Accumulate on 5% dips for core index allocation",
    addedAt: "2026-07-01",
  },
  {
    id: "w-002",
    securityId: "sec-hcl-tech",
    symbol: "HCLTECH",
    securityName: "HCL Technologies Ltd",
    assetClass: "EQUITY",
    currentPrice: { amount: "1580.00", currency: "INR" },
    dayChangePercent: -0.85,
    targetBuyPrice: { amount: "1480.00", currency: "INR" },
    alertOnPriceDrop: true,
    notes: "High dividend yield tech stock target",
    addedAt: "2026-06-15",
  },
];

export const investmentApi = {
  // 1. Portfolio Summary & Health
  getPortfolioSummary: async (portfolioId?: string): Promise<PortfolioSummary> => {
    try {
      const res = await fetchWithAuth<PortfolioSummary>(`/investments/portfolio/summary${portfolioId ? `?id=${portfolioId}` : ""}`);
      return res || MOCK_PORTFOLIO_SUMMARY;
    } catch {
      return MOCK_PORTFOLIO_SUMMARY;
    }
  },

  // 2. Domain Insights
  getInsights: async (): Promise<InvestmentInsight[]> => {
    try {
      const res = await fetchWithAuth<InvestmentInsight[]>("/investments/insights");
      return Array.isArray(res) && res.length > 0 ? res : MOCK_INSIGHTS;
    } catch {
      return MOCK_INSIGHTS;
    }
  },

  // 3. Holdings & Lot Details
  getHoldings: async (filters?: InvestmentFilterState): Promise<Holding[]> => {
    try {
      const res = await fetchWithAuth<Holding[]>("/investments/holdings");
      let data = Array.isArray(res) && res.length > 0 ? res : MOCK_HOLDINGS;
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        data = data.filter(
          (h) => h.symbol.toLowerCase().includes(q) || h.securityName.toLowerCase().includes(q)
        );
      }
      if (filters?.assetClasses && filters.assetClasses.length > 0) {
        data = data.filter((h) => filters.assetClasses.includes(h.assetClass));
      }
      return data;
    } catch {
      return MOCK_HOLDINGS;
    }
  },

  getHoldingLots: async (holdingId: string): Promise<HoldingLot[]> => {
    try {
      const res = await fetchWithAuth<HoldingLot[]>(`/investments/holdings/${holdingId}/lots`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // ignore error
    }
    const found = MOCK_HOLDINGS.find((h) => h.id === holdingId);
    return found?.lots || [];
  },

  // 4. Asset Details
  getAssetDetails: async (securityId: string): Promise<{ asset: SecurityAsset; holding?: Holding }> => {
    const holding = MOCK_HOLDINGS.find((h) => h.securityId === securityId || h.id === securityId);
    const asset: SecurityAsset = {
      id: securityId,
      symbol: holding?.symbol || "RELIANCE",
      isin: "INE002A01018",
      name: holding?.securityName || "Reliance Industries Ltd",
      assetClass: holding?.assetClass || "EQUITY",
      sector: holding?.sector || "Energy",
      country: "India",
      marketCapCategory: "LARGE_CAP",
      currentPrice: holding?.currentPrice || { amount: "3120.00", currency: "INR" },
      dayChangeAmount: holding?.dayChangeAmount || { amount: "+24.00", currency: "INR" },
      dayChangePercent: holding?.dayChangePercent || 0.74,
      currency: "INR",
      exchange: "NSE",
      riskRating: "MODERATE",
      peRatio: 28.4,
      pbRatio: 2.3,
      dividendYield: 0.35,
      weekHigh52: { amount: "3210.00", currency: "INR" },
      weekLow52: { amount: "2220.00", currency: "INR" },
    };

    return { asset, holding };
  },

  // 5. Corporate Actions
  getCorporateActions: async (): Promise<CorporateAction[]> => {
    try {
      const res = await fetchWithAuth<CorporateAction[]>("/investments/corporate-actions");
      return Array.isArray(res) && res.length > 0 ? res : MOCK_CORPORATE_ACTIONS;
    } catch {
      return MOCK_CORPORATE_ACTIONS;
    }
  },

  // 6. Performance Analytics
  getPerformanceAnalytics: async (timeframe: string = "1Y"): Promise<PerformanceAnalytics> => {
    try {
      const res = await fetchWithAuth<PerformanceAnalytics>(`/investments/performance?timeframe=${timeframe}`);
      return res || MOCK_PERFORMANCE_ANALYTICS;
    } catch {
      return { ...MOCK_PERFORMANCE_ANALYTICS, timeframe: timeframe as PerformanceAnalytics["timeframe"] };
    }
  },

  // 7. Allocation Explorer
  getAllocationOverview: async (): Promise<AllocationOverview> => {
    try {
      const res = await fetchWithAuth<AllocationOverview>("/investments/allocation");
      return res || MOCK_ALLOCATION;
    } catch {
      return MOCK_ALLOCATION;
    }
  },

  // 8. Goal Mapping
  getInvestmentGoals: async (): Promise<InvestmentGoalLink[]> => {
    try {
      const res = await fetchWithAuth<InvestmentGoalLink[]>("/investments/goals");
      return Array.isArray(res) && res.length > 0 ? res : MOCK_GOALS;
    } catch {
      return MOCK_GOALS;
    }
  },

  // 9. Passive Income
  getIncomeDashboard: async (): Promise<IncomeDashboardData> => {
    try {
      const res = await fetchWithAuth<IncomeDashboardData>("/investments/income");
      return res || MOCK_INCOME;
    } catch {
      return MOCK_INCOME;
    }
  },

  // 10. Transactions
  getTransactions: async (filters?: InvestmentFilterState): Promise<InvestmentTransaction[]> => {
    try {
      const res = await fetchWithAuth<InvestmentTransaction[]>("/investments/transactions");
      let txns = Array.isArray(res) && res.length > 0 ? res : MOCK_TRANSACTIONS;
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        txns = txns.filter(
          (t) => t.securityName.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
        );
      }
      return txns;
    } catch {
      return MOCK_TRANSACTIONS;
    }
  },

  // 11. Watchlist
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    try {
      const res = await fetchWithAuth<WatchlistItem[]>("/investments/watchlist");
      return Array.isArray(res) && res.length > 0 ? res : MOCK_WATCHLIST;
    } catch {
      return MOCK_WATCHLIST;
    }
  },

  toggleWatchlist: async (securityId: string): Promise<{ success: boolean }> => {
    try {
      await fetchWithAuth(`/investments/watchlist/toggle`, {
        method: "POST",
        body: JSON.stringify({ securityId }),
      });
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  // 12. Import Wizard Processors
  createImportJob: async (sourceType: string, fileName: string): Promise<ImportJobState> => {
    return {
      jobId: `job-${Date.now()}`,
      sourceType: sourceType as ImportSourceType,
      step: "PREVIEW",
      fileName,
      totalRows: 24,
      validRowsCount: 22,
      errorRowsCount: 2,
      duplicateRowsCount: 0,
      previewRows: [
        { id: "r-1", date: "2026-05-10", symbol: "RELIANCE", description: "Buy 10 Reliance @ 2890.00", type: "BUY", quantity: 10, price: 2890, amount: 28900, isValid: true },
        { id: "r-2", date: "2026-06-12", symbol: "TCS", description: "Buy 5 TCS @ 3850.00", type: "BUY", quantity: 5, price: 3850, amount: 19250, isValid: true },
        { id: "r-3", date: "2026-07-01", symbol: "INVALID_SYM", description: "Unknown Asset Row", type: "BUY", quantity: 0, price: 0, amount: 0, isValid: false, validationError: "Unrecognized Symbol Ticker" },
      ],
      columnMapping: {
        Date: "TxnDate",
        Symbol: "SecurityName",
        Type: "ActionType",
        Quantity: "Units",
        Price: "UnitPrice",
        Amount: "TotalValue",
      },
      isProcessing: false,
      progressPercent: 100,
    };
  },

  // 13. Reports Engine
  generateReport: async (reportType: ReportType, financialYear: string = "2025-2026"): Promise<ReportPayload> => {
    return {
      reportType,
      generatedAt: new Date().toISOString(),
      financialYear,
      portfolioSummary: MOCK_PORTFOLIO_SUMMARY,
      capitalGains: {
        financialYear,
        shortTermGain: { amount: "42500.00", currency: "INR" },
        longTermGain: { amount: "185000.00", currency: "INR" },
        taxableShortTermGain: { amount: "42500.00", currency: "INR" },
        taxableLongTermGain: { amount: "85000.00", currency: "INR" }, // after 1L exemption
        estimatedTaxLiability: { amount: "14875.00", currency: "INR" }, // 20% STCG + 12.5% LTCG
      },
    };
  },

  // 14. Global Investment Search
  searchInvestments: async (query: string): Promise<SearchResultItem[]> => {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase();
    const results: SearchResultItem[] = [];

    MOCK_HOLDINGS.forEach((h) => {
      if (h.symbol.toLowerCase().includes(q) || h.securityName.toLowerCase().includes(q)) {
        results.push({
          id: h.id,
          type: "HOLDING",
          title: h.securityName,
          subtitle: `${h.symbol} • ${h.assetClass} • Value: ${h.currentValue.currency} ${h.currentValue.amount}`,
          badge: h.assetClass,
          targetSubTab: "holdings",
          targetId: h.id,
        });
      }
    });

    MOCK_GOALS.forEach((g) => {
      if (g.goalName.toLowerCase().includes(q)) {
        results.push({
          id: g.goalId,
          type: "GOAL",
          title: g.goalName,
          subtitle: `Goal Progress: ${g.goalProgressPercent}% • Gap: ${g.fundingGap.currency} ${g.fundingGap.amount}`,
          badge: "GOAL",
          targetSubTab: "goals",
          targetId: g.goalId,
        });
      }
    });

    return results;
  },
};
