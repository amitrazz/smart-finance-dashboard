export type CurrencyCode = string;

export interface Money {
  amount: string;
  currency: CurrencyCode;
}

export type AccountType =
  | "SAVINGS"
  | "CURRENT"
  | "CASH"
  | "WALLET"
  | "BROKERAGE_CASH"
  | "FIXED_DEPOSIT"
  | "RECURRING_DEPOSIT"
  | "OTHER"
  | "CHECKING"
  | "CREDIT_CARD"
  | "LOAN"
  | "INVESTMENT";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "CLOSED" | "FROZEN";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  institutionId?: string;
  currentBalance: Money;
  status: AccountStatus;
  isManual: boolean;
  maskedNumber?: string;
  openingBalance?: string;
  currency: CurrencyCode;
  updatedAt?: string;
  lastSyncedAt?: string;
}

export interface FinancialInstitution {
  id: string;
  name: string;
  code?: string;
  status?: string;
  type?: string;
  countryCode?: string;
  logoUrl?: string;
}

export type CardNetwork = "VISA" | "MASTERCARD" | "RUPAY" | "AMEX" | "DINERS" | "DISCOVER" | "OTHER";
export type CreditCardCategory = "CREDIT_CARD" | "CORPORATE_CARD" | "CHARGE_CARD" | "SECURED_CARD" | "VIRTUAL_CARD";
export type CardStatus = "ACTIVE" | "BLOCKED" | "CLOSED" | "EXPIRED";

export interface CreditCard {
  id: string;
  issuer: string;
  nickname: string;
  network?: CardNetwork | string;
  category?: CreditCardCategory | string;
  currency: string;
  creditLimit: Money | string | number;
  currentOutstanding?: Money | string | number;
  availableCredit?: Money | string | number;
  statementBalance?: Money | string | number;
  minimumDue?: Money | string | number;
  utilization?: string;
  billingCycleDay?: number;
  statementGenerationDay?: number;
  paymentDueDay?: number;
  nextStatementDate?: string;
  nextDueDate?: string;
  interestRate?: string | number;
  cashAdvanceRate?: string | number;
  annualFee?: Money | string | number;
  joiningFee?: Money | string | number;
  openedDate?: string;
  closedDate?: string;
  expiryDate?: string;
  rewardProgram?: string;
  rewardPoints?: number;
  cashbackRatePercent?: string | number;
  cashbackBalance?: Money | string | number;
  paymentAccountId?: string;
  paymentAccountName?: string;
  autoPayEnabled?: boolean;
  institutionId?: string;
  institutionName?: string;
  lastFourDigits?: string;
  status: CardStatus | string;
  notes?: string;
  version?: number;
  lastSyncedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreditCardUpcomingDue {
  statementId: string;
  creditCardId: string;
  cardNickname: string;
  dueDate: string;
  statementBalance: string;
  minimumDue: string;
  status: string;
}

export interface CreditCardDashboardData {
  totalOutstanding: Money;
  totalCreditLimit: Money;
  totalAvailableCredit: Money;
  utilization: string;
  totalStatementBalance: Money;
  totalMinimumDue: Money;
  totalRewardPoints: number;
  activeEmiCount: number;
  activeEmiTotalRemaining: Money;
  interestThisMonth: Money;
  feesThisMonth: Money;
  upcomingDue: CreditCardUpcomingDue[];
  nextDue: CreditCardUpcomingDue | null;
  cardsByStatus: Record<string, number>;
  recentlyPaid: Array<{
    paymentId: string;
    creditCardId: string;
    cardNickname: string;
    paidAmount: string;
    paidDate: string;
  }>;
}

export interface CreditCardStatement {
  id: string;
  cardId: string;
  statementDate: string;
  dueDate: string;
  openingBalance: Money | string;
  closingBalance: Money | string;
  statementBalance: Money | string;
  minimumDue: Money | string;
  totalAmountDue?: Money | string;
  interest: Money | string;
  fees: Money | string;
  cashAdvance?: Money | string;
  status: "OPEN" | "PAID" | "UNPAID" | "PARTIALLY_PAID" | "OVERDUE" | "ARCHIVED" | string;
  version?: number;
  downloadUrl?: string;
  createdAt?: string;
}

export interface CreditCardPayment {
  id: string;
  cardId: string;
  statementId?: string;
  paymentDate: string;
  amount: Money | string;
  paymentAccountId?: string;
  paymentAccountName?: string;
  method?: string;
  reference?: string;
  status: "SUCCEEDED" | "COMPLETED" | "PENDING" | "FAILED" | "BOUNCED" | "REVERSED" | string;
  failureReason?: string;
  failedAt?: string;
  statementPeriod?: string;
  createdBy?: string;
  notes?: string;
  createdAt?: string;
}

export interface CreditCardEmi {
  id: string;
  cardId: string;
  merchant: string;
  merchantName?: string;
  purchaseAmount: Money | string;
  originalPrincipal?: Money | string;
  outstandingPrincipal: Money | string;
  remainingPrincipal?: Money | string;
  monthlyEmi: Money | string;
  monthlyEmiAmount?: Money | string;
  remainingInstallments: number;
  remainingTenureMonths?: number;
  completedInstallments?: number;
  totalInstallments: number;
  totalTenureMonths?: number;
  interestRate: number;
  annualInterestRatePercent?: number;
  nextDueDate: string;
  startDate?: string;
  expectedEndDate?: string;
  originalTransactionDescription?: string;
  status: "ACTIVE" | "COMPLETED" | "CLOSED" | "CANCELLED" | "FORECLOSED" | string;
  version?: number;
  category?: string;
  createdAt?: string;
}

export interface CreditCardRewardHistoryItem {
  id: string;
  date: string;
  description: string;
  points: number;
  type: "EARNED" | "REDEEMED" | "EXPIRED";
}

export type CreditCardRewardHistory = CreditCardRewardHistoryItem;

export interface CreditCardRewards {
  rewardBalance: number;
  lifetimeEarned: number;
  redeemed: number;
  expiringSoon: number;
  expiringDate?: string;
  history: CreditCardRewardHistoryItem[];
}

export interface CreditCardDocument {
  id: string;
  cardId: string;
  fileName: string;
  category: "STATEMENT" | "AGREEMENT" | "TAX" | "OTHER";
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface CreateCreditCardInput {
  issuer: string;
  nickname: string;
  lastFourDigits: string;
  creditLimit: string;
  currentOutstanding: string;
  availableCredit: string;
  statementBalance: string;
  minimumDue: string;
  billingCycleDay: number;
  paymentDueDay: number;
  nextDueDate: string;
  network?: CardNetwork | string;
  category?: CreditCardCategory | string;
  currency?: string;
  paymentAccountId?: string;
  autoPayEnabled?: boolean;
  institutionId?: string;
  statementGenerationDay?: number;
  nextStatementDate?: string;
  interestRate?: string;
  cashAdvanceRate?: string;
  annualFee?: string;
  joiningFee?: string;
  rewardProgram?: string;
  rewardRatePoints?: string;
  notes?: string;
  openedDate?: string;
  expiryDate?: string;
}

export interface UpdateCreditCardInput {
  nickname?: string;
  issuer?: string;
  lastFourDigits?: string;
  institutionId?: string;
  network?: CardNetwork | string;
  category?: CreditCardCategory | string;
  paymentAccountId?: string;
  autoPayEnabled?: boolean;
  interestRate?: string;
  cashAdvanceRate?: string;
  annualFee?: string;
  joiningFee?: string;
  rewardProgram?: string;
  rewardRatePoints?: string;
  notes?: string;
  openedDate?: string;
  expiryDate?: string;
  status?: CardStatus | string;
}

export interface RecordCreditCardPaymentInput {
  cardId: string;
  statementId?: string;
  paymentType?: "FULL" | "MINIMUM" | "PARTIAL" | "CUSTOM";
  paymentDate: string;
  amount: string;
  paymentAccountId?: string;
  reference?: string;
  notes?: string;
}


// TRANSFER is a legacy single-leg tag kept for backward compatibility with
// manually-tagged rows via POST /finance/transactions. Transfer Center
// (POST /finance/transfers) produces the two-leg TRANSFER_OUT/TRANSFER_IN
// pair instead — both excluded from income/expense analytics same as TRANSFER.
export type TransactionDirection = "INFLOW" | "OUTFLOW" | "TRANSFER" | "TRANSFER_OUT" | "TRANSFER_IN";

// Matches TransactionResponseDto (GET /finance/transactions, /:id). The
// backend nests category/merchant as `{id, name}` objects and never returns
// `version` — the mapper in useFinanceQueries.ts flattens category/merchant
// into categoryId/categoryName/merchantId/merchantName for convenience, and
// `version` defaults to 1 for optimistic-concurrency writes since the
// backend doesn't expose the real value on read.
export interface Transaction {
  id: string;
  accountId?: string | null;
  accountName?: string; // joined client-side against the accounts list — not returned by the API
  creditCardId?: string | null;
  emiId?: string | null;
  counterAccountId?: string | null;
  categoryId?: string;
  categoryName?: string;
  merchantId?: string;
  merchantName?: string;
  amount: Money;
  direction: TransactionDirection;
  description: string;
  date: string;
  notes?: string | null;
  source?: string;
  isPending?: boolean;
  importRowId?: string | null;
  version: number;
}

// Matches CreateTransactionDto (POST /finance/transactions).
export interface CreateTransactionInput {
  accountId?: string;
  creditCardId?: string;
  counterAccountId?: string;
  categoryId?: string;
  merchantName?: string;
  amount: string;
  direction: TransactionDirection;
  transactionDate: string;
  description: string;
  notes?: string;
}

// Matches UpdateTransactionDto (PATCH /finance/transactions/:id).
export interface UpdateTransactionInput {
  categoryId?: string;
  notes?: string;
}

// Transfer Center (`/finance/transfers`). This codebase's transfer execution
// is synchronous/atomic (no queue) — a Transfer only ever becomes durable as
// COMPLETED or REVERSED; PENDING/PROCESSING/FAILED are reserved server-side
// for a future async path and are not actually produced today.
export type TransferStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
export type TransferType =
  | "INTERNAL"
  | "BANK"
  | "CASH"
  | "INVESTMENT"
  | "CREDIT_CARD_PAYMENT"
  | "LOAN_PAYMENT";

// Matches TransferResponseDto (GET/POST /finance/transfers, /:id). The
// backend only returns account ids, not names — fromAccountName/
// toAccountName are joined client-side against the accounts list, same
// pattern as Transaction.accountName.
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromAccountName?: string;
  toAccountName?: string;
  amount: Money;
  status: TransferStatus;
  type: TransferType;
  description: string | null;
  notes: string | null;
  reference: string | null;
  executedAt: string;
  reversalOfTransferId: string | null;
  reversedByTransferId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Matches CreateTransferDto (POST /finance/transfers).
export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  currencyCode?: CurrencyCode;
  type?: TransferType;
  transferDate?: string;
  description?: string;
  notes?: string;
  reference?: string;
  idempotencyKey?: string;
}

// Matches ReverseTransferHandler's response (POST /finance/transfers/:id/reverse).
export interface ReverseTransferResult {
  original: Transfer;
  reversal: Transfer;
}

// Matches CategoryResponseDto (GET/POST /finance/categories). The backend
// field is `kind`, not `type` — `type` is kept as an optional alias since
// several call sites read it defensively via `c.type ?? c.kind`.
export interface Category {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE" | "TRANSFER";
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  icon?: string;
  isSystem?: boolean;
  parentId?: string;
}

export interface Merchant {
  id: string;
  name: string;
  displayName?: string;
  merchantType?: string | null;
  logoUrl?: string;
  defaultCategoryId?: string;
}

// Counterparty Intelligence — merchant-intelligence's Unknown Counterparty
// Workflow. Mirrors packages/finance/src/merchant-intelligence's
// FuzzyScoreBreakdown/ReviewClusterResponseDto exactly.
export interface FuzzyScoreBreakdown {
  levenshtein: number;
  jaroWinkler: number;
  phonetic: number;
  historical: number | null;
  final: number;
}

export type ReviewClusterStatus = "PENDING" | "RESOLVED" | "IGNORED";

export interface ReviewClusterMember {
  id: string;
  rawDescription: string;
  normalizedDescription: string;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface MerchantReviewCluster {
  id: string;
  representativeName: string;
  memberCount: number;
  status: ReviewClusterStatus;
  suggestedMerchantId: string | null;
  suggestedConfidence: number | null;
  suggestionBreakdown: FuzzyScoreBreakdown | null;
  aiSuggestedMerchantId: string | null;
  aiSuggestedName: string | null;
  aiSuggestedCategoryId: string | null;
  aiConfidence: number | null;
  aiReason: string | null;
  resolvedMerchantId: string | null;
  resolvedAt: string | null;
  members?: ReviewClusterMember[];
}

export interface ResolveReviewClusterInput {
  status: "RESOLVED" | "IGNORED";
  merchantId?: string;
  newMerchantName?: string;
  merchantType?: string;
  categoryId?: string;
  subcategoryId?: string;
  backfillTransactions?: boolean;
  reason?: string;
}

// Matches the ImportJobStatus enum in packages/finance/prisma/schema.prisma exactly.
export type ImportJobStatus =
  | "UPLOADED"
  | "VALIDATING"
  | "PARSING"
  | "OCR_PROCESSING"
  | "AI_EXTRACTING"
  | "NORMALIZING"
  | "DETECTING_DUPLICATES"
  | "AWAITING_REVIEW"
  | "COMMITTING"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "FAILED"
  | "ROLLED_BACK";

export type ImportRowStatus =
  | "PENDING"
  | "MAPPED"
  | "DUPLICATE"
  | "NEEDS_REVIEW"
  | "COMMITTED"
  | "REJECTED"
  | "ERRORED";

// Matches ImportRowResponseDto.normalizedData for non-trade rows (bank/CSV/Excel imports) —
// backend field is `transactionDate`, not `date`.
export interface NormalizedTransactionRowData {
  transactionDate: string;
  description: string;
  amount: string;
  direction: "INFLOW" | "OUTFLOW";
  merchantId?: string;
  merchantName?: string;
  categoryId?: string;
  loanScheduleId?: string;
  loanId?: string;
  balanceAfterTransaction?: string;
}

// Matches ImportRowResponseDto.normalizedData for CAS/broker PDF imports (Trade rows).
export interface NormalizedTradeRowData {
  securityId: string;
  schemeName: string;
  isin: string | null;
  tradeType: string;
  quantity: string;
  price: string;
  amount: string;
  tradeDate: string;
}

// Matches GET /finance/imports/:id/preview and /finance/imports/review-queue
// (ImportRowResponseDto) exactly.
export interface ImportRowStaging {
  id: string;
  importJobId: string;
  rowNumber: number;
  rawData: string[];
  normalizedData: NormalizedTransactionRowData | NormalizedTradeRowData | null;
  status: ImportRowStatus;
  confidenceScore: string | null;
  duplicateOfTransactionId: string | null;
  rejectionReason: string | null;
}

// Body for POST /finance/imports/:id/rows/:rowId (UpdateImportRowDto) — a
// request payload, not part of the row's response shape above.
export interface UpdateImportRowInput {
  categoryId?: string;
  direction?: "INFLOW" | "OUTFLOW";
  confirmNotDuplicate?: boolean;
  reject?: boolean;
}

export interface ColumnMappingFields {
  transactionDate: number;
  description: number;
  amount?: number;
  withdrawal?: number;
  deposit?: number;
  balance?: number;
}

// The auto column-mapper's own guess, returned on the job as soon as a
// CSV/Excel upload is parsed — `headers` are the file's actual column names
// (for rendering a picker), `fields` are the resolved/guessed indices, see
// packages/finance/src/import/application/services/csv-column-mapper.ts.
export interface ColumnMappingData {
  headers: string[];
  fields: ColumnMappingFields;
  confidence: number;
}

// Matches GET/POST /finance/imports responses (ImportJobResponseDto) exactly.
export interface ImportJob {
  id: string;
  fileName: string;
  sourceType: string;
  status: ImportJobStatus;
  targetAccountId: string | null;
  totalRows: number;
  mappedRows: number;
  duplicateRows: number;
  importedRows: number;
  failedRows: number;
  columnMapping: ColumnMappingData | null;
  errorLog: Array<{ rowNumber: number; message: string }> | null;
  createdAt: string;
  completedAt: string | null;
}

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
export type BudgetHealthGrade = "EXCELLENT" | "GOOD" | "FAIR" | "WARNING" | "CRITICAL";
export type BudgetStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

// Matches GET /finance/budgets/:id/categories (BudgetCategoryProgressDto) —
// the backend does not include categoryName/icon here, those are joined
// client-side against the master category list for display.
export interface BudgetCategoryLine {
  id?: string;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string;
  allocatedAmount: Money;
  spentAmount: Money;
  remainingAmount: Money;
  utilizationPercent: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  healthStatus: "HEALTHY" | "NEAR_LIMIT" | "EXCEEDED";
  healthGrade: BudgetHealthGrade;
}

// Matches BudgetResponseDto. Computed spend/health/forecast figures are not
// part of this resource — those only exist on GET /:id/summary (see
// useBudget(id), which fetches both and merges them).
export interface Budget {
  id: string;
  name: string;
  description?: string;
  budgetType: string;
  currency: string;
  status: BudgetStatus;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  totalLimit: Money;
  totalSpent?: Money;
  remainingAmount?: Money;
  availableAmount?: Money;
  utilizationPercent?: number;
  safeDailySpend?: Money;
  forecastMonthEndSpend?: Money;
  budgetHealthScore?: number;
  budgetHealthGrade?: BudgetHealthGrade;
  daysRemaining?: number;
  carryForwardEnabled: boolean;
  autoAdjustEnabled: boolean;
  rolloverPolicy: string;
  notificationEnabled: boolean;
  notes?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

// Matches BudgetDashboardDto exactly — a flat aggregate across all of the
// user's budgets. There is no per-user currency on this DTO; amounts are
// formatted with the app's default display currency.
export interface BudgetDashboardData {
  totalBudget: string;
  totalSpent: string;
  remainingBudget: string;
  availableBudget: string;
  overallUtilization: string;
  activeBudgets: Budget[];
  exceededBudgets: Budget[];
  nearLimitBudgets: Budget[];
  topSpendingCategories: Array<{ categoryId: string; spentAmount: string }>;
  budgetHealthScore: number;
}

// Matches GET /finance/budgets/:id/analytics (per-budget only, no aggregate route).
// Matches BudgetAnalyticsDto (GET /finance/budgets/:id/analytics) exactly —
// scalar spend/variance/forecast figures for the current period, a real
// per-category breakdown, and a top-5 largest-expenses list. There is no
// time-series data on this endpoint (no daily/weekly trend arrays, no
// rolling-average history, no health trend) — those were previously
// fabricated frontend fields with no backend source.
export interface BudgetAnalytics {
  budgetId: string;
  dailySpend: Money;
  weeklySpend: Money;
  monthlySpend: Money;
  rollingAverageDailySpend: Money;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName?: string;
    allocatedAmount: Money;
    spentAmount: Money;
    utilizationPercent: number;
  }>;
  largestExpenses: Array<{
    transactionId: string;
    categoryId: string | null;
    categoryName?: string;
    amount: Money;
    description: string;
    date: string;
  }>;
  trend: "ACCELERATING" | "STEADY" | "DECELERATING";
  variance: Money;
  forecastExpectedMonthEndSpend: Money;
  forecastProjectedOverspend: Money;
  forecastConfidence: number;
}

// Matches BudgetAlertResponseDto. Backend has no `title` field — the frontend
// derives a display title from `type`. `categoryName` is joined client-side
// from the master category list (backend only returns `categoryId`).
export interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetPeriodId: string;
  categoryId?: string;
  categoryName?: string;
  type: string;
  title: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  triggeredAt: string;
  version: number;
}

// Matches BudgetTemplateResponseDto.
export interface BudgetTemplateAllocation {
  categoryId: string;
  categoryName?: string;
  percentage?: number;
  fixedAmount?: Money;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: string;
  isSystem: boolean;
  allocations: BudgetTemplateAllocation[];
  version: number;
}


// Matches AssetClass enum (packages/finance/prisma/schema.prisma). LOT_BASED
// (tradable via the investments ledger): STOCK/ETF/MUTUAL_FUND/BOND/GOLD/
// SILVER/CRYPTO/REIT/INVIT. ACCRUAL_UNSUPPORTED (enum exists, no trade flow
// yet): FIXED_DEPOSIT/PPF/EPF/NPS/REAL_ESTATE/VEHICLE/CASH/OTHER.
export type InvestmentAssetClass =
  | "STOCK"
  | "ETF"
  | "MUTUAL_FUND"
  | "BOND"
  | "FIXED_DEPOSIT"
  | "GOLD"
  | "SILVER"
  | "CRYPTO"
  | "REAL_ESTATE"
  | "VEHICLE"
  | "PPF"
  | "EPF"
  | "NPS"
  | "CASH"
  | "REIT"
  | "INVIT"
  | "OTHER";

// Matches TradeType enum.
export type InvestmentTradeType = "BUY" | "SELL" | "BONUS" | "SPLIT" | "DIVIDEND_REINVEST" | "SIP_INSTALLMENT";

export type LotStatus = "OPEN" | "CLOSED";

// Matches RecurrenceFrequency enum.
export type InvestmentRecurrenceFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "IRREGULAR";

// Matches AssetResponseDto — the traded instrument. Global (no userId), so
// symbol/ISIN are shared across users. latestPrice/latestPriceAt update from
// trade recording AND from the daily/on-demand market-price refresh below
// (Yahoo Finance-backed) — whichever last wrote a newer tradingDate.
export interface Asset {
  id: string;
  symbol: string;
  isin: string | null;
  name: string;
  assetClass: InvestmentAssetClass;
  exchangeCode: string | null;
  sector: string | null;
  currency: CurrencyCode;
  latestPrice: string | null;
  latestPriceAt: string | null;
}

// Matches AssetPriceRefreshService's AssetRefreshResult — one entry per
// asset in a refresh call. Never a raw provider error: `reason` (when
// present) is always a safe, generic string.
export type AssetRefreshStatus =
  | "REFRESHED"
  | "ALREADY_FRESH"
  | "MARKET_CLOSED"
  | "UNSUPPORTED"
  | "PROVIDER_ERROR"
  | "INVALID_DATA"
  | "FAILED";

export interface AssetRefreshResult {
  assetId: string;
  status: AssetRefreshStatus;
  tradingDate: string | null;
  price: string | null;
  currency: string | null;
  provider: string | null;
  refreshedAt: string | null;
  reason?: string;
}

// Matches POST /finance/investments/prices/refresh's response.
export interface RefreshPricesResponse {
  total: number;
  refreshed: number;
  alreadyFresh: number;
  marketClosed: number;
  unsupported: number;
  providerErrors: number;
  invalidData: number;
  failed: number;
  runId: string;
  results: AssetRefreshResult[];
}

// Matches GET /finance/investments/prices/status's response.
export interface PriceRefreshStatus {
  activeAssetCount: number;
  assetsWithNoPriceCount: number;
  staleAssetCount: number;
  lastCompletedRun: {
    runId: string;
    triggeredBy: string;
    completedAt: string | null;
    succeeded: number;
    failed: number;
  } | null;
  myRecentRuns: Array<{
    runId: string;
    triggeredBy: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    succeeded: number;
    failed: number;
  }>;
}

// Matches HoldingResponseDto. A cached rollup of a portfolio's open Lots for
// one asset — a pure projection, recomputed after every trade, never written
// directly. NOTE: the wire field for the embedded instrument is "security",
// not "asset" — kept stable for backend API compatibility.
export interface Holding {
  id: string;
  portfolioId: string;
  security: Asset | null;
  quantity: string;
  averageCost: string;
  costBasis: Money;
  marketValue: Money;
  unrealizedGain: Money;
  unrealizedGainPercent: string;
  lastValuedAt: string;
}

// Matches LotResponseDto — a single tax lot in the FIFO cost-basis ledger a
// Holding's market value/cost basis is derived from.
export interface Lot {
  id: string;
  holdingId: string;
  originalQuantity: string;
  remainingQuantity: string;
  unitCost: string;
  status: LotStatus;
  openedTradeId: string;
  openDate: string;
}

// Matches RealizedGainResponseDto — one row per Lot consumed by a SELL.
export interface RealizedGain {
  id: string;
  portfolioId: string;
  holdingId: string;
  assetId: string;
  tradeId: string;
  quantity: string;
  costBasis: Money;
  proceeds: Money;
  gain: Money;
  holdingPeriodDays: number;
  realizedDate: string;
}

// Matches TradeResponseDto — the immutable trade ledger. Same "security"
// wire-name quirk as Holding.
export interface Trade {
  id: string;
  holdingId: string;
  security: Asset | null;
  type: InvestmentTradeType;
  quantity: string;
  price: string;
  amount: Money;
  fees: Money;
  tradeDate: string;
}

// Matches CreateTradeDto exactly (POST /finance/investments/trades body).
export interface CreateTradeInput {
  portfolioId?: string;
  symbol: string;
  isin?: string;
  securityName: string;
  assetClass: InvestmentAssetClass;
  exchangeCode?: string;
  sector?: string;
  currency: CurrencyCode;
  type: InvestmentTradeType;
  quantity: string;
  price: string;
  amount: string;
  fees?: string;
  tradeDate: string;
}

// Matches SipPlanResponseDto. Read-only this phase — SIPs are only created
// as a byproduct of CAS/mutual-fund import, there is no create/update route.
export interface SipPlan {
  id: string;
  security: Asset | null;
  amount: Money;
  frequency: InvestmentRecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

// Matches PortfolioResponseDto (GET /finance/portfolio).
export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;
  isDefault: boolean;
}

// Matches PortfolioSnapshotResponseDto — computed by
// PortfolioSnapshotComputationService, refreshed on every trade plus a daily
// cron sweep. xirr is null when it can't be computed (not fabricated).
/**
 * The snapshot's own guidance on which return figure to lead with.
 *
 * XIRR is annualised, so over a short holding period it extrapolates noise into
 * a headline: this portfolio's real 12-day gain of 0.51% annualises to 16.79%.
 * Rather than leave every client to invent its own threshold, the backend
 * publishes the period it measured, whether that period is too short to
 * annualise responsibly, and which metric it wants headlined.
 *
 * Optional because it post-dates earlier snapshots — treat its absence as "no
 * guidance", not as `isShortPeriod: false`.
 */
export interface PortfolioPerformance {
  gainLossAmount: Money;
  /** The return actually realised over `periodDays`, as whole percent. */
  actualPeriodReturnPercentage: string;
  /** XIRR as whole percent — the same figure as `xirr`, pre-scaled. */
  annualizedMoneyWeightedReturnPercentage: string;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  /** True when `periodDays` is too short for the annualised figure to be meaningful. */
  isShortPeriod: boolean;
  headlineMetric: "ACTUAL_PERIOD_RETURN" | "ANNUALIZED_MONEY_WEIGHTED_RETURN";
}

export interface PortfolioSnapshot {
  snapshotDate: string;
  totalMarketValue: Money;
  totalCostBasis: Money;
  totalUnrealizedGain: Money;
  totalRealizedGain: Money;
  allocationByAssetClass: Record<string, number>;
  /** Money-weighted annualised return as a *fraction* ("0.1679" = 16.79%). */
  xirr: string | null;
  performance?: PortfolioPerformance;
}

// Matches PortfolioDetailResponseDto (GET /finance/portfolio/:id).
export interface PortfolioDetail extends Portfolio {
  holdings: Holding[];
  latestSnapshot: PortfolioSnapshot;
}

// Matches InvestmentReturnsPortfolioDto (GET /finance/analytics/investment-returns).
// The endpoint returns an array of these directly, not wrapped in an envelope.
export interface InvestmentReturnsPortfolio {
  portfolioId: string;
  name: string;
  xirr: string | null;
  totalMarketValue: string;
  totalCostBasis: string;
  totalUnrealizedGain: string;
  holdings: Array<{
    securityId: string;
    symbol: string | null;
    name: string | null;
    marketValue: string;
    costBasis: string;
    unrealizedGain: string;
    unrealizedGainPercent: string;
  }>;
}

export type LoanType =
  | "HOME"
  | "VEHICLE"
  | "EDUCATION"
  | "PERSONAL"
  | "GOLD"
  | "MORTGAGE"
  | "BUSINESS"
  | "OTHER";

export type LoanStatus =
  | "ACTIVE"
  | "PAUSED"
  | "CLOSED"
  | "DEFAULTED"
  | "SETTLED"
  | "RESTRUCTURED"
  | "CANCELLED";

export type LoanInterestType = "FIXED" | "FLOATING" | "MIXED";

export type LoanPaymentFrequency =
  | "WEEKLY"
  | "BI_WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUALLY"
  | "ANNUALLY";

export interface Loan {
  id: string;
  name: string;
  loanNumber?: string;
  type: LoanType;
  lenderName?: string;
  institutionId?: string;
  institutionName?: string;
  accountId?: string;
  accountName?: string;
  currency: CurrencyCode;
  principalAmount?: Money | string;
  outstandingPrincipal?: Money | string;
  outstandingBalance?: Money | string;
  interestRate: number;
  interestType?: LoanInterestType;
  monthlyEmi?: Money | string;
  emiAmount?: Money | string;
  installmentAmount?: Money | string;
  tenureMonths?: number;
  remainingTenureMonths?: number;
  installmentCount?: number;
  paymentFrequency?: LoanPaymentFrequency;
  startDate?: string;
  nextDueDate?: string;
  autoDebit?: boolean;
  status: LoanStatus;
  notes?: string;
  purpose?: string;
  disbursementDate?: string;
  openedDate?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoanInstallmentSummary {
  scheduleId: string;
  loanId: string;
  loanName: string;
  dueDate: string;
  installmentAmount: Money | string;
  status: string;
}

export interface LoanDashboardData {
  totalOutstanding: Money;
  totalMonthlyEmi: Money;
  averageInterestRate: number;
  highestInstallment: LoanInstallmentSummary;
  nextDue?: LoanInstallmentSummary | null;
  debtRatio?: number;
  activeCount: number;
  closedCount: number;
  loansByType: Array<{ type: string; count: number; totalOutstanding: Money }>;
  loansByStatus: Array<{ status: string; count: number; totalOutstanding: Money }>;
  upcomingInstallments: Array<LoanInstallmentSummary & { installmentNo?: number }>;
  recentlyPaid: Array<{
    id: string;
    loanId: string;
    loanName: string;
    amount: Money;
    paidDate: string;
  }>;
}

export interface LoanScheduleItem {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string;
  installmentAmount?: Money | string;
  emiAmount?: Money | string;
  amount?: Money | string;
  totalAmount?: Money | string;
  principalComponent?: Money | string;
  principalPortion?: Money | string;
  principal?: Money | string;
  principalAmount?: Money | string;
  interestComponent?: Money | string;
  interestPortion?: Money | string;
  interest?: Money | string;
  interestAmount?: Money | string;
  remainingBalance?: Money | string;
  status: "UPCOMING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  paidAmount?: Money | string;
  paidDate?: string;
}

export type EmiSchedule = LoanScheduleItem;

export interface LoanPayment {
  id: string;
  loanId: string;
  scheduleId?: string;
  transactionId?: string;
  paidAmount?: Money | string;
  amount?: Money | string;
  principalPortion?: Money | string;
  interestPortion?: Money | string;
  penaltyPortion?: Money | string;
  paidDate?: string;
  paymentDate?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  isExtraPayment?: boolean;
  type: "REGULAR_EMI" | "PREPAYMENT";
  status: "COMPLETED" | "REVERSED";
  createdAt?: string;
}

export interface LoanDocument {
  id: string;
  loanId: string;
  category: "SANCTION_LETTER" | "LOAN_AGREEMENT" | "REPAYMENT_SCHEDULE" | "NOC" | "TAX_CERTIFICATE" | "OTHER";
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface LoanInterestRateHistory {
  id: string;
  loanId: string;
  oldRate: number;
  newRate: number;
  effectiveDate: string;
  reason?: string;
  createdAt: string;
}

export interface CreateLoanInput {
  name: string;
  type: LoanType;
  currency: string;
  outstandingPrincipal: string;
  monthlyEmi: string;
  /** Maps to the backend's `installmentAmount` — the user's real/fixed EMI, kept stable across rate changes and regenerates instead of being recomputed. */
  installmentAmount?: string;
  remainingTenureMonths: number;
  nextDueDate: string;
  interestRate: string;
  lenderName?: string;
  institutionId?: string;
  accountId?: string;
  interestType?: LoanInterestType;
  paymentFrequency?: LoanPaymentFrequency;
  autoDebit?: boolean;
  principalAmount?: string;
  tenureMonths?: number;
  loanNumber?: string;
  startDate?: string;
  disbursementDate?: string;
  purpose?: string;
  notes?: string;
}

export interface UpdateLoanInput {
  name?: string;
  lenderName?: string;
  institutionId?: string;
  loanNumber?: string;
  purpose?: string;
  notes?: string;
  autoDebit?: boolean;
  accountId?: string;
  status?: LoanStatus;
}

export type GoalType =
  | "EMERGENCY_FUND"
  | "RETIREMENT"
  | "HOUSE"
  | "CAR"
  | "VACATION"
  | "WEDDING"
  | "EDUCATION"
  | "CHILD_EDUCATION"
  | "BUSINESS"
  | "INVESTMENT_CORPUS"
  | "PASSIVE_INCOME"
  | "DEBT_FREE"
  | "INSURANCE_CORPUS"
  | "MEDICAL_FUND"
  | "CUSTOM"
  | "EMERGENCY"
  | "VEHICLE"
  | "OTHER";

export type GoalPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type GoalStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ARCHIVED";

export type RiskProfile = "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";

export type GoalHealthStatus = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export type RiskLevel = "ON_TRACK" | "NEEDS_ATTENTION" | "BEHIND_SCHEDULE" | "CRITICAL" | "COMPLETED";

export interface GoalContribution {
  id: string;
  goalId: string;
  goalName?: string;
  date: string;
  amount: Money;
  sourceAccountId?: string;
  sourceName?: string;
  type: "MANUAL" | "TRANSACTION_LINKED" | string;
  reference?: string;
  notes?: string;
  version: number;
  createdAt?: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  goalName?: string;
  name: string;
  thresholdPercent?: string | null;
  targetAmount: Money | null;
  targetDate: string | null;
  status: "PENDING" | "ACHIEVED";
  isStandard?: boolean;
  achievedDate?: string | null;
  version: number;
  createdAt?: string;
}

// Note: the backend forecast endpoint is a deterministic linear projection —
// it does not compute a success probability or recommendations, so those
// fields are intentionally not part of this contract (see GoalDetailsView /
// ForecastSubmenuView, which hide the corresponding UI when absent).
// The subset of forecast fields available everywhere (standalone endpoint
// and embedded in GoalAnalytics). Amounts are plain decimal strings on the
// wire; the mapper in useGoalQueries.ts wraps them as Money.
export interface GoalForecastSummary {
  monthlyContributionRate: Money;
  fundingGap: Money;
  expectedCompletionDate: string | null;
  monthsRemaining: number | null;
  isBehindSchedule: boolean;
}

// Matches GoalForecastDto (GET /finance/goals/:id/forecast) — a deterministic
// linear projection with a few extra fields layered on top of the summary.
export interface GoalForecast extends GoalForecastSummary {
  goalId: string;
  goalName: string;
  targetDate: string | null;
  projectedFutureValue: Money;
  monthlyRequiredContribution: Money | null;
  inflationAdjustedTarget: Money | null;
}

// Matches GoalProjectionDto (GET /finance/goals/:id/projection) — a risk
// classification, not a time-series projection curve. `goalId` is absent
// when this shape is embedded inside GoalAnalytics.
export interface GoalProjection {
  goalId?: string;
  expectedProgressPercent: number;
  actualProgressPercent: number;
  delayMonths: number | null;
  contributionTrend: "INCREASING" | "STABLE" | "DECREASING";
  riskLevel: RiskLevel;
}

// Matches GoalHealthResult, embedded inside GoalAnalyticsDto.health.
export interface GoalHealthData {
  score: number;
  band: GoalHealthStatus;
  contributionConsistency: number;
  progressAlignment: number;
  fundingGap: number;
}

// Matches GoalAnalyticsDto (GET /finance/goals/:id/analytics) — bundles
// corpus, forecast, projection risk, and health into one composite response.
export interface GoalAnalytics {
  goalId: string;
  corpus: { corpusValue: Money; contributionValue: Money; investmentValue: Money };
  forecast: GoalForecastSummary;
  projection: GoalProjection;
  health: GoalHealthData;
  contributionTrend: Array<{ month: string; amount: Money }>;
  corpusGrowth: Array<{ date: string; corpusValue: Money }>;
  milestoneProgress: { achieved: number; total: number };
  investmentAllocation: { linkedHoldingCount: number; investmentValue: Money };
}

// Matches GoalTemplateResponseDto.
export interface GoalTemplate {
  id: string;
  name: string;
  goalType: GoalType;
  description?: string;
  suggestedTargetAmount?: Money;
  suggestedDurationMonths?: number;
  suggestedMonthlyContribution?: Money;
  icon?: string;
  color?: string;
  isPlatformCurated: boolean;
}

// Matches GoalDocumentResponseDto. `storageKey` is never returned by the
// backend (write-only, on AddGoalDocumentDto) — only `category` is required
// on read.
export interface GoalDocument {
  id: string;
  goalId: string;
  category: "PLAN" | "STATEMENT" | "RECEIPT" | "CERTIFICATE" | "OTHER";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  notes?: string;
  uploadedAt: string;
}

// Matches GoalBeneficiaryResponseDto — allocationPercentage is a decimal
// string on the wire (mapper in useGoalQueries.ts converts to number).
export interface GoalBeneficiary {
  id: string;
  goalId: string;
  name: string;
  relationship: "SPOUSE" | "CHILD" | "PARENT" | "SIBLING" | "FAMILY_MEMBER" | "TRUST" | "OTHER";
  allocationPercentage: number;
  email?: string;
  phone?: string;
  notes?: string;
  version: number;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  category?: GoalType; // Backwards compatibility
  priority: GoalPriority;
  linkedAccountIds: string[];
  linkedInvestmentIds: string[];
  targetAmount: Money;
  currentCorpus?: Money; // Not returned by GET /goals/:id — use currentAmount
  currentAmount?: Money; // Backwards compatibility
  remainingCorpus?: Money; // Not returned by GET /goals/:id
  progressPercent: number;
  currency: CurrencyCode;
  targetDate: string;
  estimatedCompletionDate?: string; // Not returned by GET /goals/:id — derive from /forecast
  forecastCompletionDate?: string; // Backwards compatibility
  monthlyContribution?: Money; // Not returned by GET /goals/:id
  expectedReturnRate: number;
  inflationRate: number;
  riskProfile: RiskProfile;
  goalHealthScore?: number; // Only available via GET /goals/:id/analytics, not on the goal itself
  goalHealth?: GoalHealthStatus;
  riskLevel?: RiskLevel;
  status: GoalStatus;
  isCompleted?: boolean; // Backwards compatibility
  autoContributionEnabled: boolean;
  autoContributionAmount?: Money;
  milestones?: GoalMilestone[];
  recentContributions?: GoalContribution[];
  // Not embedded in GET /goals/:id — fetch separately via useGoalForecast(id).
  forecast?: GoalForecast;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type FinancialGoal = Goal;

// Matches GoalsDashboardDto (GET /finance/goals/dashboard) exactly — a flat
// aggregate across all of the user's goals. Amounts are plain decimal
// strings on the wire; no currency field exists on this DTO.
export interface GoalDashboardData {
  activeGoalsCount: number;
  completedGoalsCount: number;
  totalCorpus: string;
  targetCorpus: string;
  remainingCorpus: string;
  overallProgressPercent: string;
  monthlyContributionTotal: string;
  goalsAtRisk: Array<{ goalId: string; name: string; riskLevel: string }>;
  nearestCompletion: { goalId: string; name: string; projectedCompletionDate: string } | null;
  upcomingMilestones: Array<{ goalId: string; goalName: string; milestoneId: string; title: string; targetDate: string }>;
}

export interface CreateGoalInput {
  name: string;
  type: GoalType;
  priority?: GoalPriority;
  targetAmount: string;
  currency?: string;
  targetDate: string;
  currentCorpus?: string;
  monthlyContribution?: string;
  expectedReturnRate?: string;
  inflationRate?: string;
  riskProfile?: RiskProfile;
  autoContributionEnabled?: boolean;
  linkedAssetIds?: string[];
  milestones?: Array<{ name: string; targetAmount: string; targetDate: string }>;
}

export interface UpdateGoalInput {
  name?: string;
  type?: GoalType;
  priority?: GoalPriority;
  targetAmount?: string;
  targetDate?: string;
  monthlyContribution?: string;
  expectedReturnRate?: string;
  inflationRate?: string;
  riskProfile?: RiskProfile;
  status?: GoalStatus;
  autoContributionEnabled?: boolean;
}

export interface CreateContributionInput {
  amount: string;
  date?: string;
  sourceAccountId?: string;
  type?: string;
  reference?: string;
  notes?: string;
}

export interface CreateMilestoneInput {
  name: string;
  targetAmount: string;
  targetDate: string;
}

// `Insight` / `InsightSeverity` removed 2026-08-11 with the backend context.
// Worth recording why the shape is not worth resurrecting: it described fields
// (`description`, `category`, `isDismissed`, `actionableLink`) that the API
// never actually returned — it served `body`, `severity`, `status`, `metadata`.
// Use `SmartActionItem` and its `evidence`, which are checked against the real
// contract.

export interface FinancialHealthScore {
  snapshotDate?: string;
  overallScore: number;
  rating: FinancialHealthRating;
  monthlyTrend?: number;
  lastCalculatedAt?: string;
  componentScores: Record<HealthDimensionKey, HealthDimensionDetail>;
  topRecommendations: HealthRecommendation[];
  // Compatibility fallbacks
  components?: Record<HealthDimensionKey, HealthDimensionDetail>;
  updatedAt?: string;
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: Money;
  totalLiabilities: Money;
  netWorth: Money;
  // Plain decimal strings sharing `netWorth.currency` — the backend's
  // NetWorthBreakdown does not carry a currency per line item.
  breakdown: {
    liquidCash: string;
    investments: string;
    realEstate: string;
    loans: string;
    creditCards: string;
  };
}

export interface CashFlowSnapshot {
  period: string;
  totalIncome: Money;
  totalExpense: Money;
  netSavings: Money;
  savingsRate: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: Money;
    percentage: number;
  }>;
}

export interface UserSettings {
  baseCurrency: CurrencyCode;
  locale: string;
  emergencyFundMonthsTarget: number;
  theme: "light" | "dark" | "system";
  notificationPreferences: Record<string, boolean>;
}

export type BackendCalendarEventType =
  | "EMI_DUE"
  | "CREDIT_CARD_DUE"
  | "SIP_DUE"
  | "SUBSCRIPTION_RENEWAL"
  | "GOAL_TARGET_DATE"
  | (string & {});

export interface CalendarEventItem {
  date: string;
  type: BackendCalendarEventType;
  title: string;
  amount: string | null;
  sourceEntityType: "EmiSchedule" | "CreditCardStatement" | "SipPlan" | "Subscription" | "Goal" | string;
  sourceEntityId: string;
}

export interface CalendarItem {
  id: string;
  title: string;
  type: "BILL" | "EMI" | "SIP" | "GOAL" | "MATURITY";
  date: string;
  amount: Money;
  status: "PENDING" | "PAID" | "OVERDUE";
  sourceId?: string;
}

export interface SearchResultItem {
  id: string;
  type: "account" | "transaction" | "merchant" | "category" | "goal" | "investment" | "loan" | "document";
  title: string;
  subtitle: string;
  link: string;
  metadata?: Record<string, string>;
}

export interface PhysicalAsset {
  id?: string;
  name: string;
  type: "REAL_ESTATE" | "VEHICLE" | "JEWELRY" | "ELECTRONICS" | "OTHER";
  estimatedValue: number;
  purchaseYear?: number;
  notes?: string;
}

export interface InsurancePolicy {
  id?: string;
  provider: string;
  policyName: string;
  policyType: "HEALTH" | "LIFE" | "VEHICLE" | "PROPERTY" | "TRAVEL";
  coverageAmount: number;
  premiumAmount: number;
  renewalDate: string;
  notes?: string;
}

export interface OnboardingStepCatalogItem {
  key: string;
  title: string;
  subtitle: string;
  category: "WELCOME" | "PROFILE" | "PREFERENCES" | "ACCOUNT" | "CREDIT_CARD" | "LOAN" | "INVESTMENT" | "GOAL" | "COMPLETE";
  isOptional: boolean;
  order: number;
}

export interface OnboardingStatus {
  status?: string;
  workflowVersion?: number;
  currentStep?: string | null;
  currentStepKey?: string;
  completedSteps?: string[];
  completedStepKeys?: string[];
  skippedSteps?: string[];
  skippedStepKeys?: string[];
  remainingSteps?: string[];
  completionPercentage?: number;
  progressPercent?: number;
  isCompleted?: boolean;
  completedCount?: number;
  totalCount?: number;
  steps?: OnboardingStep[];
  profile?: OnboardingProfileInput;
  preferences?: OnboardingPreferencesInput;
  account?: OnboardingAccountInput;
  creditCards?: OnboardingCreditCardInput[];
  loans?: OnboardingLoanInput[];
  investments?: OnboardingInvestmentInput[];
  goals?: OnboardingGoalInput[];
}

export interface OnboardingProfileInput {
  displayName: string;
  country: string;
  timezone: string;
  locale?: string;
  baseCurrency: string;
}

export interface OnboardingPreferencesInput {
  fiscalYearStartMonth: number;
  primaryIncomeSourceName?: string;
  payFrequency: "MONTHLY" | "WEEKLY" | "BI_WEEKLY" | "CUSTOM";
  payDay?: number;
  monthlyAmount: string;
  currency: string;
}

export interface OnboardingAccountInput {
  name: string;
  type: "SAVINGS" | "CURRENT" | "CASH" | "WALLET" | "CHECKING";
  currency: string;
  openingBalance: string;
  institutionId?: string;
}

export interface OnboardingCreditCardInput {
  issuer: string;
  nickname: string;
  lastFourDigits: string;
  currency: string;
  creditLimit: string;
  currentOutstanding: string;
  availableCredit: string;
  statementBalance: string;
  minimumDue: string;
  billingCycleDay: number;
  paymentDueDay: number;
  nextDueDate: string;
  institutionId?: string;
}

export interface OnboardingLoanInput {
  name: string;
  type: "HOME" | "VEHICLE" | "EDUCATION" | "PERSONAL" | "GOLD" | "OTHER";
  currency: string;
  principalAmount: string;
  interestRate: string;
  tenureMonths: number;
  startDate: string;
}

export interface OnboardingInvestmentInput {
  symbol?: string;
  securityName: string;
  assetClass: "MUTUAL_FUND" | "STOCK" | "ETF" | "PPF" | "NPS" | "EPF" | "FD" | "GOLD" | "CRYPTO";
  currency: string;
  units?: string;
  costBasis: string;
  currentValue: string;
  purchaseDate?: string;
}

export interface OnboardingGoalInput {
  name: string;
  type: "EMERGENCY_FUND" | "VACATION" | "HOUSE" | "RETIREMENT" | "EDUCATION" | "CAR" | "CUSTOM";
  priority: "HIGH" | "MEDIUM" | "LOW";
  targetAmount: string;
  currency: string;
  targetDate: string;
}

export interface OnboardingState {
  status?: string;
  workflowVersion?: number;
  currentStep?: string | null;
  currentStepKey?: string;
  completedSteps?: string[];
  completedStepKeys?: string[];
  skippedSteps?: string[];
  skippedStepKeys?: string[];
  remainingSteps?: string[];
  completionPercentage?: number;
  progressPercent?: number;
  isCompleted?: boolean;
  profile?: OnboardingProfileInput;
  preferences?: OnboardingPreferencesInput;
  account?: OnboardingAccountInput;
  creditCards?: OnboardingCreditCardInput[];
  loans?: OnboardingLoanInput[];
  investments?: OnboardingInvestmentInput[];
  goals?: OnboardingGoalInput[];
  steps?: OnboardingStep[];
  completedCount?: number;
  totalCount?: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionTab: string;
}

export interface OnboardingProgress {
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  steps: OnboardingStep[];
}

export interface AssetAllocationResponse {
  allocations?: Array<{ assetClass: string; amount: Money; percentage: number }>;
}

export interface DebtBreakdownResponse {
  totalDebt?: Money;
  items?: Array<{ id: string; name: string; type: string; amount: Money; interestRate?: number }>;
}

export interface IncomeTrendResponse {
  points?: Array<{ date: string; amount: Money }>;
}

export interface RetirementForecastResponse {
  currentAge?: number;
  retirementAge?: number;
  expectedReturnPercent?: number;
  projectedCorpus?: Money;
  monthlySavingsNeeded?: Money;
}

export type FinancialHealthRating =
  | "EXCEPTIONAL"
  | "EXCELLENT"
  | "GOOD"
  | "NEEDS_ATTENTION"
  | "POOR"
  | "CRITICAL";

export type HealthDimensionKey =
  | "CASH_FLOW"
  | "SAVINGS_RATE"
  | "EMERGENCY_FUND"
  | "DEBT_HEALTH"
  | "CREDIT_UTILIZATION"
  | "INVESTMENT_DIVERSIFICATION"
  | "BILL_DISCIPLINE"
  | "SPENDING_DISCIPLINE";

export interface MetricDetail {
  label: string;
  target: string;
  actual: string;
}

export interface HealthComponentRecommendation {
  text: string;
  estimatedImpact: number;
  component?: HealthDimensionKey;
  deepLink?: string;
}

export interface HealthDimensionDetail {
  code: HealthDimensionKey;
  label?: string;
  score: number;
  stars: number;
  why: string;
  metrics?: Record<string, MetricDetail>;
  recommendations?: HealthComponentRecommendation[];
  // Compatibility fields
  key?: HealthDimensionKey;
  weight?: number;
  rating?: string;
  reason?: string;
  target?: string;
  currentValue?: string;
  gapAmount?: string;
  scoreImpact?: number;
  recommendationText?: string;
  deepLink?: string;
}

export interface HealthRecommendation {
  text: string;
  estimatedImpact: number;
  component?: HealthDimensionKey;
  deepLink?: string;
  // Compatibility fields
  id?: string;
  title?: string;
  description?: string;
  scoreImpact?: number;
}

export type TopRecommendation = HealthRecommendation;

export type DetailedFinancialHealthScore = FinancialHealthScore;

export interface FinancialHealthHistoryPoint {
  snapshotDate?: string;
  date?: string;
  overallScore: number;
  score?: number;
  rating: FinancialHealthRating;
  delta: number | null;
  reasons: string[];
  componentScores?: Record<HealthDimensionKey, HealthDimensionDetail>;
  components?: Record<HealthDimensionKey, HealthDimensionDetail>;
  topRecommendations?: HealthRecommendation[];
}

export interface CreditCardLimitHistory {
  id: string;
  creditCardId: string;
  oldLimit: Money | string;
  newLimit: Money | string;
  effectiveDate: string;
  reason?: string;
  revertsAt?: string;
  revertedAt?: string;
  createdAt?: string;
}

export interface ChangeCreditCardLimitInput {
  newLimit: string;
  reason?: string;
  revertsAt?: string;
}

export interface CreateCreditCardStatementInput {
  statementDate: string;
  dueDate: string;
  statementBalance: string;
  minimumDue: string;
}

export interface UpdateCreditCardStatementInput {
  statementDate?: string;
  dueDate?: string;
  openingBalance?: string;
  closingBalance?: string;
  statementBalance?: string;
  minimumDue?: string;
  interestCharged?: string;
  fees?: string;
  cashAdvance?: string;
}

export interface BounceCreditCardPaymentInput {
  status: "BOUNCED" | "FAILED";
  reason: string;
}

export interface ConvertTransactionToEmiInput {
  transactionId: string;
  tenureMonths: number;
  interestRate: string;
  knownMonthlyEmi?: string;
}

export interface UpdateCreditCardEmiInput {
  monthlyEmi?: string;
  remainingInstallments?: number;
  interestRate?: string;
  nextDueDate?: string;
}

export interface RedeemCreditCardRewardsInput {
  points: number;
  reference?: string;
}

export type CreditCardDisputeStatus = "OPEN" | "RESOLVED_UPHELD" | "RESOLVED_REVERSED";

export interface CreditCardDispute {
  id: string;
  creditCardId: string;
  disputedTransactionId: string;
  provisionalCreditTransactionId?: string;
  reversalTransactionId?: string;
  reason: string;
  amount: Money | string;
  status: CreditCardDisputeStatus | string;
  raisedDate: string;
  resolvedDate?: string;
  resolutionNotes?: string;
  version?: number;
  createdAt?: string;
}

export interface RaiseCreditCardDisputeInput {
  transactionId: string;
  reason: string;
  amount?: string;
}

export interface ResolveCreditCardDisputeInput {
  status: "RESOLVED_UPHELD" | "RESOLVED_REVERSED";
  resolutionNotes?: string;
}

export type CreditCardBalanceTransferStatus = "ACTIVE" | "CLOSED";

export interface CreditCardBalanceTransfer {
  id: string;
  sourceCreditCardId: string;
  destinationCreditCardId: string;
  sourceCardNickname?: string;
  destinationCardNickname?: string;
  principal: Money | string;
  remainingPrincipal: Money | string;
  promoRatePercent: string | number;
  promoRateExpiresAt: string;
  transferFeeRate?: string | number;
  status: CreditCardBalanceTransferStatus | string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBalanceTransferInput {
  sourceCreditCardId: string;
  amount: string;
  promoRatePercent: string;
  promoRateExpiresAt: string;
}

export interface PrepayBalanceTransferInput {
  extraPrincipal: string;
}

export interface CreditCardCashback {
  id?: string;
  creditCardId: string;
  cashbackBalance: Money | string | number;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreditCardCashbackTransactionType = "EARNED" | "REDEEMED" | "ADJUSTED";

export interface CreditCardCashbackTransaction {
  id: string;
  creditCardCashbackId: string;
  type: CreditCardCashbackTransactionType | string;
  amount: Money | string;
  transactionId?: string;
  reference?: string;
  createdAt?: string;
}

export interface RedeemCreditCardCashbackInput {
  amount: string;
  reference?: string;
}

export type ActionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type ActionCategory =
  | "PAYMENT"
  | "INCOME"
  | "SPENDING"
  | "SAVINGS"
  | "INVESTMENT"
  | "CREDIT"
  | "GOALS"
  | "DATA_QUALITY"
  | "IMPORT"
  | "ACCOUNT"
  | "OPPORTUNITY"
  | "SYSTEM"
  | (string & {});

export type ActionStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "DISMISSED"
  | "SNOOZED"
  | "EXPIRED"
  // Auto-resolved: the condition cleared without the user acting. Deliberately
  // distinct from COMPLETED, which is user-driven.
  | "ARCHIVED";

/** How to format an evidence `value` — don't infer it from the metric name. */
export type EvidenceUnit =
  | "CURRENCY"
  | "PERCENT"
  | "RATIO"
  | "MONTHS"
  | "DAYS"
  | "COUNT"
  | "SCORE_POINTS";

/** A typed reference back to the row a figure came from. */
export interface EvidenceEntityRef {
  type: string;
  id: string;
}

/**
 * The machine-readable form of an action's `explanation` — the deterministic
 * metrics the backend rule actually fired on.
 *
 * Build "vs. your 3-month average" chips from `baseline` + `comparison` rather
 * than parsing numbers back out of `explanation`, and use `sourceEntityIds` for
 * a "show me the rows behind this" affordance without inventing a lookup.
 *
 * `source` is always a deterministic producer — there is no AI source, by
 * design. AI may narrate these numbers, never author them.
 */
export interface ActionEvidence {
  metric: string;
  value: number;
  unit: EvidenceUnit;
  period: string | null;
  baseline: { value: number; period: string | null; label: string } | null;
  comparison: {
    kind: "ABOVE" | "BELOW" | "EQUAL";
    changePercent: number | null;
    changeAbsolute: number | null;
  } | null;
  source: string;
  sourceEntityIds: EvidenceEntityRef[];
  /** 0–1. Below 1 means the rule projected or inferred the figure. */
  confidence: number;
}

export interface SmartActionItem {
  id: string;
  type: string;
  category: ActionCategory;
  priority: ActionPriority;
  status: ActionStatus;
  title: string;
  description: string;
  explanation: string;
  recommendation?: string | null;
  deepLink?: string | null;
  icon?: string | null;
  color?: string | null;
  financialImpact?: string | null;
  healthScoreImpact?: number | null;
  scoreImpact?: number | null; // Compatibility fallback for healthScoreImpact
  dismissible: boolean;
  actionable: boolean;
  metadata?: Record<string, unknown>;
  /**
   * Structured metrics behind this action, or `null` when the rule makes no
   * numeric claim (UNCATEGORIZED_TRANSACTION, TRANSFER_REVIEW, …) and for rows
   * created before 2026-08-11. Render the text-only layout when null — don't
   * show an empty evidence panel.
   */
  evidence?: ActionEvidence[] | null;
  version: number;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string | null;
  completedAt?: string | null;
  dismissedAt?: string | null;
  snoozedUntil?: string | null;
  dueInDays?: number;
  amount?: Money | string;
}

/**
 * Outcome of a grounded financial question (`POST /finance/ai/query`).
 *
 * `status` is the field that matters, and it is not decorative:
 * - `ANSWERED`   — every figure was verified present in the deterministic
 *                  context, every cited metric exists, and every declared claim
 *                  binds a figure to that metric's real value. It does **not**
 *                  mean "correct" — it means "asserts nothing unsupported".
 * - `UNGROUNDED` — the model asserted something unsupported, so the backend
 *                  discarded the answer. `answer` is fallback copy, never the
 *                  fabricated claim.
 * - `UNAVAILABLE`— no financial context to ground against, or every provider
 *                  failed. In the former case no provider was called at all.
 */
export type AnswerStatus = "ANSWERED" | "UNGROUNDED" | "UNAVAILABLE";

export interface UsedMetric {
  metric: string;
  source: string;
  period?: {
    start: string;
    end: string;
  };
}

export interface FinancialAnswer {
  status: AnswerStatus;
  intent: string;
  answer: string;
  usedMetrics: (string | UsedMetric)[];
  confidence: number;
  /** Snapshot date the figures describe — answers never implicitly mean "now". */
  asOf: string;
}

export interface ActionCategoryCount {
  category: string;
  count: number;
}

export interface ActionPreferences {
  mutedCategories: string[];
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  notifyMinPriority: ActionPriority;
}

// ==========================================
// Accounts & Cash Management Module Interfaces
// ==========================================

export interface CashPositionData {
  totalCash: Money;
  currencyBreakdown: Array<{ currency: string; amount: Money; percentage: number }>;
  institutionBreakdown: Array<{ institutionId: string; institutionName: string; logoUrl?: string; amount: Money; percentage: number }>;
}

export interface WalletAccount extends Account {
  provider: "Paytm" | "PhonePe" | "Google Pay" | "Amazon Pay" | "PayPal" | "Other";
  recentTransactions?: Transaction[];
}

export interface FixedDeposit {
  id: string;
  accountNumber: string;
  accountName: string;
  institutionId: string;
  institutionName: string;
  logoUrl?: string;
  principal: Money;
  currentValue: Money;
  interestEarned: Money;
  interestRate: number;
  maturityDate: string;
  startDate: string;
  tenureMonths: number;
  status: "ACTIVE" | "MATURED" | "CLOSED" | "LOCKED";
  currency: string;
}

export interface InvestmentCashPosition {
  brokerId: string;
  brokerName: string;
  logoUrl?: string;
  totalCash: Money;
  availableToTrade: Money;
  pendingSettlement: Money;
  withdrawable: Money;
  recentTradesCount: number;
  currency: string;
}

// Statement Reconciliation — mirrors the backend's StatementLineResponseDto /
// ReconciliationResponseDto exactly (packages/finance/src/reconciliation on
// the backend-platform repo). Every imported bank-statement row becomes a
// StatementLine; the matching engine (or a manual match/confirm) links it to
// a ledger Transaction via a Reconciliation decision record.

export type StatementLineStatus = "UNMATCHED" | "SUGGESTED" | "MATCHED" | "DUPLICATE" | "IGNORED";

export type ReconciliationDecisionStatus = "SUGGESTED" | "CONFIRMED" | "REJECTED" | "SUPERSEDED";

export type ReconciliationMatchedBy = "SYSTEM_AUTO" | "USER";

export type IgnoreReason =
  | "DUPLICATE_IMPORT"
  | "BANK_INFORMATIONAL"
  | "ALREADY_RECONCILED"
  | "BANK_CHARGES"
  | "INTEREST_ADJUSTMENT"
  | "OTHER";

export interface StatementLine {
  id: string;
  importJobId: string;
  importRowId: string;
  accountId: string;
  transactionDate: string;
  description: string;
  amount: Money;
  direction: "INFLOW" | "OUTFLOW" | "TRANSFER" | "TRANSFER_OUT" | "TRANSFER_IN";
  referenceNumber: string | null;
  externalReference: string | null;
  merchantId: string | null;
  status: StatementLineStatus;
  matchedTransactionId: string | null;
  duplicateOfTransactionId: string | null;
  confidenceScore: number | null;
  isDuplicate: boolean;
  reviewRequired: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  reconciledAt: string | null;
  ignoredAt: string | null;
}

/** Component scores (0-100) behind a Reconciliation row's confidenceScore — null for import-linked (no scoring ran) rows. */
export interface ReconciliationScoreBreakdown {
  amount: number;
  date: number;
  merchant: number;
  reference: number;
  account: number;
}

/** One in-window candidate Transaction for a statement line, ranked by weighted confidence score. Read-only. */
export interface StatementLineCandidate {
  transactionId: string;
  score: number;
  breakdown: ReconciliationScoreBreakdown;
}

export interface ReconciliationRecord {
  id: string;
  statementLineId: string;
  transactionId: string;
  status: ReconciliationDecisionStatus;
  confidenceScore: number;
  matchedBy: ReconciliationMatchedBy;
  reason: string;
  scoreBreakdown: ReconciliationScoreBreakdown | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationSummary {
  importedLines: number;
  matched: number;
  suggested: number;
  needsReview: number;
  ignored: number;
  duplicates: number;
  unmatched: number;
  /** matched / importedLines * 100, rounded to 2 decimal places. 100 when there are no lines at all. */
  reconciliationPercent: number;
  /** Signed sum of still-UNMATCHED statement-line amounts (INFLOW positive, OUTFLOW negative), as a decimal string. */
  totalDifference: string;
}

export interface RunAutoMatchResult {
  accountsScanned: number;
  processed: number;
  autoMatched: number;
  suggested: number;
}

export type StatementType = "BANK" | "CREDIT_CARD" | "WALLET" | "INVESTMENT" | "IMPORTED";

export interface AccountStatementItem {
  id: string;
  accountId: string;
  accountName: string;
  type: StatementType;
  periodStart: string;
  periodEnd: string;
  openingBalance: Money;
  closingBalance: Money;
  downloadUrl?: string;
  status: "READY" | "PROCESSING" | "FAILED";
  importedAt?: string;
}

export interface AccountSettingsConfig {
  autoSyncFrequencyMinutes: number;
  lowBalanceThreshold: Money;
  highBalanceAlertThreshold?: Money;
  defaultCurrency: string;
  autoReconcileThreshold: number;
  hideInDashboardAccounts: string[];
}




