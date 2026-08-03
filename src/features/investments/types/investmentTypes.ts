export type AssetClass =
  | "EQUITY"
  | "MUTUAL_FUND"
  | "DEBT"
  | "GOLD"
  | "SGB"
  | "FIXED_DEPOSIT"
  | "REAL_ESTATE"
  | "CRYPTO"
  | "CASH_EQUIVALENT";

export type RiskLevel = "VERY_LOW" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export interface Money {
  amount: string;
  currency: string;
}

// 1. Investment Catalog
export interface SecurityAsset {
  id: string;
  symbol: string;
  isin?: string;
  name: string;
  assetClass: AssetClass;
  sector?: string;
  country?: string;
  marketCapCategory?: "LARGE_CAP" | "MID_CAP" | "SMALL_CAP" | "MICRO_CAP";
  currentPrice: Money;
  dayChangeAmount: Money;
  dayChangePercent: number;
  currency: string;
  exchange?: string;
  riskRating: RiskLevel;
  expenseRatio?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  weekHigh52?: Money;
  weekLow52?: Money;
}

// 2. Lot Management
export type FIFOStatus = "UNTOUCHED" | "PARTIALLY_SOLD" | "FULLY_EXHAUSTED";

export interface HoldingLot {
  id: string;
  holdingId: string;
  purchaseDate: string;
  purchaseQuantity: number;
  remainingQuantity: number;
  purchaseCostPerUnit: Money;
  totalCost: Money;
  currentValue: Money;
  unrealizedGain: Money;
  unrealizedGainPercent: number;
  realizedGainToDate: Money;
  holdingPeriodDays: number;
  taxTerm: "SHORT_TERM" | "LONG_TERM";
  fifoStatus: FIFOStatus;
  brokerAccount: string;
  notes?: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  securityId: string;
  symbol: string;
  securityName: string;
  assetClass: AssetClass;
  sector?: string;
  quantity: number;
  averageCostPrice: Money;
  totalCost: Money;
  currentPrice: Money;
  currentValue: Money;
  unrealizedGain: Money;
  unrealizedGainPercent: number;
  realizedGain: Money;
  dayChangeAmount: Money;
  dayChangePercent: number;
  allocationPercent: number;
  lots: HoldingLot[];
  brokerName?: string;
  lastUpdated: string;
  mappedGoalIds?: string[];
}

// 3. Portfolio Management & Health
export interface RiskMetric {
  overallScore: number; // 0 - 100
  riskCategory: "CONSERVATIVE" | "MODERATE" | "BALANCED" | "GROWTH" | "AGGRESSIVE";
  concentrationRiskScore: number;
  sectorRiskScore: number;
  volatilityRating: string;
  largestHoldingWeight: number;
  largestSectorWeight: number;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  currency: string;
  currentValue: Money;
  investedAmount: Money;
  availableCash: Money;
  todayGainLoss: Money;
  todayGainLossPercent: number;
  lifetimeReturn: Money;
  lifetimeReturnPercent: number;
  xirr: number;
  cagr: number;
  riskMetrics: RiskMetric;
  totalHoldingsCount: number;
  benchmarkName: string;
  benchmarkReturnPercent: number;
  outperformingBenchmark: boolean;
  lastCalculatedAt: string;
}

// 4. Quick Domain Insights
export type InsightSeverity = "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

export interface InvestmentInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: "RISK" | "INCOME" | "MATURITY" | "BENCHMARK" | "GOAL" | "ALLOCATION" | "SIP";
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// 5. Corporate Actions
export type CorporateActionType =
  | "DIVIDEND"
  | "SPLIT"
  | "BONUS"
  | "RIGHTS_ISSUE"
  | "MERGER"
  | "SPIN_OFF"
  | "FD_MATURITY"
  | "SGB_INTEREST";

export type CorporateActionStatus = "ANNOUNCED" | "UPCOMING" | "COMPLETED" | "CANCELLED";

export interface CorporateAction {
  id: string;
  securityId: string;
  symbol: string;
  securityName: string;
  actionType: CorporateActionType;
  recordDate: string;
  exDate?: string;
  executionDate: string;
  status: CorporateActionStatus;
  description: string;
  ratioOrRate?: string;
  estimatedAmount?: Money;
  finalAmount?: Money;
  taxable: boolean;
  notes?: string;
}

// 6. Performance Analytics
export interface PerformancePoint {
  date: string;
  portfolioValue: number;
  investedCapital: number;
  benchmarkValue: number;
}

export interface ContributionItem {
  securityId: string;
  symbol: string;
  securityName: string;
  assetClass: AssetClass;
  absoluteReturnAmount: Money;
  percentageContributionToPortfolio: number;
}

export interface HeatmapItem {
  symbol: string;
  securityName: string;
  assetClass: AssetClass;
  marketCap: number;
  dayChangePercent: number;
  totalReturnPercent: number;
}

export interface PerformanceAnalytics {
  portfolioId: string;
  timeframe: "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "5Y" | "ALL";
  cagr: number;
  xirr: number;
  sharpeRatio: number;
  alpha: number;
  beta: number;
  volatilityPercent: number;
  maxDrawdownPercent: number;
  rollingReturn3YAvg: number;
  growthHistory: PerformancePoint[];
  topContributors: ContributionItem[];
  topDetractors: ContributionItem[];
  heatmapData: HeatmapItem[];
  benchmarkName: string;
  benchmarkCagr: number;
  benchmarkXirr: number;
}

// 7. Allocation Explorer
export interface AllocationBreakdownItem {
  id: string;
  name: string;
  value: Money;
  percentage: number;
  color?: string;
  subItems?: { name: string; percentage: number; value: Money }[];
}

export interface AllocationOverview {
  byAssetClass: AllocationBreakdownItem[];
  bySector: AllocationBreakdownItem[];
  byCountry: AllocationBreakdownItem[];
  byMarketCap: AllocationBreakdownItem[];
  byBroker: AllocationBreakdownItem[];
  byAccount: AllocationBreakdownItem[];
  byCurrency: AllocationBreakdownItem[];
}

// 8. Goal Mapping
export interface InvestmentGoalLink {
  goalId: string;
  goalName: string;
  goalCategory: string;
  targetAmount: Money;
  currentValue: Money;
  allocatedPortfolioValue: Money;
  targetDate: string;
  goalProgressPercent: number;
  requiredMonthlyContribution: Money;
  projectedCompletionDate: string;
  fundingGap: Money;
  isBehindSchedule: boolean;
}

// 9. Passive Income Engine
export interface MonthlyIncomeItem {
  month: string;
  receivedDividends: Money;
  receivedInterest: Money;
  upcomingEstimatedIncome: Money;
  totalIncome: Money;
}

export interface IncomeDashboardData {
  totalReceivedThisYear: Money;
  totalUpcomingThisYear: Money;
  averageMonthlyIncome: Money;
  projectedAnnualYieldPercent: number;
  monthlyBreakdown: MonthlyIncomeItem[];
  recentEvents: CorporateAction[];
  upcomingEvents: CorporateAction[];
}

// 10. Transactions & Trades
export type TransactionType =
  | "BUY"
  | "SELL"
  | "DIVIDEND"
  | "INTEREST"
  | "BONUS"
  | "SPLIT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "TAX_DEDUCTION"
  | "FEE";

export interface InvestmentTransaction {
  id: string;
  portfolioId: string;
  securityId: string;
  symbol: string;
  securityName: string;
  type: TransactionType;
  date: string;
  quantity?: number;
  pricePerUnit?: Money;
  totalAmount: Money;
  fees?: Money;
  taxes?: Money;
  brokerName?: string;
  accountName?: string;
  notes?: string;
  lotId?: string;
}

// 11. Watchlist
export interface WatchlistItem {
  id: string;
  securityId: string;
  symbol: string;
  securityName: string;
  assetClass: AssetClass;
  currentPrice: Money;
  dayChangePercent: number;
  targetBuyPrice?: Money;
  alertOnPriceDrop: boolean;
  notes?: string;
  addedAt: string;
}

// 12. Import Wizard
export type ImportSourceType = "CAS_PDF" | "ZERODHA_CSV" | "GROWW_CSV" | "INDMONEY_CSV" | "CUSTOM_EXCEL" | "BANK_STATEMENT";
export type ImportStep = "SELECT_SOURCE" | "UPLOAD" | "PREVIEW" | "MAPPING" | "REVIEW" | "IMPORTING" | "RESULTS";

export interface ImportPreviewRow {
  id: string;
  date: string;
  symbol: string;
  description: string;
  type: string;
  quantity: number;
  price: number;
  amount: number;
  isValid: boolean;
  validationError?: string;
  isDuplicate?: boolean;
}

export interface ImportJobState {
  jobId: string;
  sourceType: ImportSourceType;
  step: ImportStep;
  fileName?: string;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  duplicateRowsCount: number;
  previewRows: ImportPreviewRow[];
  columnMapping: Record<string, string>;
  isProcessing: boolean;
  progressPercent: number;
}

// 13. Reports Engine
export type ReportType = "PORTFOLIO_SUMMARY" | "PERFORMANCE" | "TAX_CAPITAL_GAINS" | "DIVIDEND_INCOME" | "ALLOCATION_RISK" | "GOAL_PROGRESS";

export interface CapitalGainsSummary {
  financialYear: string;
  shortTermGain: Money;
  longTermGain: Money;
  taxableShortTermGain: Money;
  taxableLongTermGain: Money;
  estimatedTaxLiability: Money;
}

export interface ReportPayload {
  reportType: ReportType;
  generatedAt: string;
  financialYear: string;
  portfolioSummary: PortfolioSummary;
  capitalGains?: CapitalGainsSummary;
  downloadUrlPdf?: string;
  downloadUrlExcel?: string;
}

// 14. Search & Filters
export interface SearchResultItem {
  id: string;
  type: "HOLDING" | "SECURITY" | "TRANSACTION" | "GOAL" | "WATCHLIST";
  title: string;
  subtitle: string;
  badge?: string;
  targetSubTab: string;
  targetId?: string;
}

export interface InvestmentFilterState {
  searchQuery: string;
  portfolioId?: string;
  assetClasses: AssetClass[];
  brokers: string[];
  sectors: string[];
  gainLossFilter: "ALL" | "GAINERS" | "LOSERS";
  dateRangeFrom?: string;
  dateRangeTo?: string;
  mappedGoalId?: string;
}
