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
  type?: string;
  countryCode?: string;
  logoUrl?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  currency: string;
  creditLimit: string | number;
  currentBalance?: Money | string;
  statementDay?: number;
  dueDay?: number;
  institutionId?: string;
  institutionName?: string;
  maskedNumber?: string;
  status?: string;
  lastSyncedAt?: string;
  updatedAt?: string;
}

export type TransactionDirection = "INFLOW" | "OUTFLOW" | "TRANSFER";

export interface Transaction {
  id: string;
  accountId: string;
  accountName?: string;
  counterAccountId?: string;
  counterAccountName?: string;
  categoryId: string;
  categoryName?: string;
  categoryIcon?: string;
  merchantId?: string;
  merchantName?: string;
  amount: Money;
  direction: TransactionDirection;
  description: string;
  date: string;
  tags?: string[];
  isSplit?: boolean;
  splitDetails?: Array<{
    categoryId: string;
    categoryName?: string;
    amount: Money;
  }>;
  isRecurring?: boolean;
  source?: string;
  provenance?: {
    importJobId: string;
    sourceRowId: string;
  };
  createdAt: string;
}

export interface CreateTransactionInput {
  accountId: string;
  description: string;
  amount: string | Money;
  direction: TransactionDirection;
  categoryName?: string;
  categoryId?: string;
  merchantName?: string;
  transactionDate?: string;
  date?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  kind?: "INCOME" | "EXPENSE" | "TRANSFER";
  parentCategoryId?: string;
}

export interface Merchant {
  id: string;
  name: string;
  logoUrl?: string;
  defaultCategoryId?: string;
}

export type ImportJobStatus =
  | "UPLOADED"
  | "VALIDATED"
  | "PARSED"
  | "EXTRACTED"
  | "NORMALIZED"
  | "MATCHED"
  | "DUPLICATES_DETECTED"
  | "MAPPED"
  | "NEEDS_REVIEW"
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

export interface ImportRowStaging {
  id: string;
  importJobId: string;
  rawData?: Record<string, unknown>;
  normalizedData?: {
    date: string;
    amount: string;
    direction: TransactionDirection;
    description: string;
  };
  status?: ImportRowStatus;
  confidenceScore?: number;
  duplicateOfId?: string;
  targetCategoryId?: string;
  categoryId?: string;
  direction?: TransactionDirection;
  confirmNotDuplicate?: boolean;
  reject?: boolean;
  targetMerchantId?: string;
  committedEntityType?: string;
  committedEntityId?: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  sourceType: string;
  status: ImportJobStatus;
  totalRows: number;
  processedRows: number;
  mappedRows: number;
  duplicateRows: number;
  reviewRows: number;
  importedRows: number;
  failedRows: number;
  errorLog?: string[];
  createdAt: string;
}

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface BudgetLine {
  id?: string;
  categoryId: string;
  categoryName?: string;
  limitAmount: Money;
  spentAmount?: Money;
}

export interface Budget {
  id: string;
  name: string;
  period: BudgetPeriod;
  startDate: string;
  totalLimit: Money;
  totalSpent?: Money;
  lines: BudgetLine[];
}

export interface Holding {
  id: string;
  securityId: string;
  securityName: string;
  symbol: string;
  assetClass: "MUTUAL_FUND" | "EQUITY" | "GOLD" | "FIXED_DEPOSIT" | "PF" | "CRYPTO";
  quantity: number;
  avgCostPrice: Money;
  currentPrice: Money;
  currentValue: Money;
  unrealizedGain: Money;
  unrealizedGainPercent: number;
}

export interface Trade {
  id: string;
  securityId: string;
  securityName: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: Money;
  totalAmount: Money;
  date: string;
}

export interface Portfolio {
  id: string;
  name: string;
  totalValue: Money;
  totalGain: Money;
  totalGainPercent: number;
  xirr: number;
  holdingsCount: number;
}

export interface Loan {
  id: string;
  name: string;
  lenderName: string;
  principalAmount: Money;
  outstandingBalance: Money;
  interestRate: number;
  emiAmount: Money;
  nextDueDate: string;
  totalTenureMonths: number;
  remainingTenureMonths: number;
}

export interface EmiSchedule {
  id: string;
  loanId: string;
  installmentNo: number;
  dueDate: string;
  emiAmount: Money;
  principalComponent: Money;
  interestComponent: Money;
  status: "PAID" | "UPCOMING" | "OVERDUE";
}

export interface Goal {
  id: string;
  name: string;
  category: "EMERGENCY" | "RETIREMENT" | "VACATION" | "HOUSE" | "EDUCATION" | "OTHER";
  targetAmount: Money;
  currentAmount: Money;
  targetDate: string;
  monthlyContribution: Money;
  isCompleted: boolean;
  forecastCompletionDate: string;
}

export type InsightSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Insight {
  id: string;
  ruleCode: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: string;
  actionableLink?: string;
  isDismissed: boolean;
  createdAt: string;
}

export interface FinancialHealthScore {
  overallScore: number;
  componentScores: {
    emergencyFund: number;
    savingsRate: number;
    debtToIncome: number;
    creditUtilization: number;
    goalProgress: number;
  };
  emergencyFundMonths: number;
  savingsRatePercent: number;
  debtToIncomeRatio: number;
  avgCreditUtilization: number;
  updatedAt: string;
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: Money;
  totalLiabilities: Money;
  netWorth: Money;
  breakdown: {
    liquidCash: Money;
    investments: Money;
    realEstate: Money;
    loans: Money;
    creditCards: Money;
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

export interface BootstrapOnboardingPayload {
  cashAccounts?: Array<{
    bank: string;
    name: string;
    type: string;
    currentBalance: number;
    balanceAsOfDate?: string;
  }>;
  creditCards?: Array<{
    issuer: string;
    name: string;
    creditLimit: number;
    currentOutstanding: number;
    statementDay: number;
    dueDay: number;
    autoPay?: boolean;
  }>;
  loans?: Array<{
    name: string;
    lender: string;
    type: string;
    originalAmount: number;
    currentBalance: number;
    interestRate: number;
    emiAmount: number;
    emiFrequency: string;
    nextEmiDate: string;
    startDate?: string;
    remainingTenure?: number;
    notes?: string;
  }>;
  investments?: Array<{
    type: string;
    name: string;
    quantity?: number;
    currentValue: number;
  }>;
  physicalAssets?: Array<{
    name: string;
    type: string;
    estimatedValue: number;
    purchaseYear?: number;
    notes?: string;
  }>;
  insurancePolicies?: Array<{
    provider: string;
    policyName: string;
    policyType: string;
    coverageAmount: number;
    premiumAmount: number;
    renewalDate: string;
    notes?: string;
  }>;
  income?: {
    primaryIncome: number;
    salaryFrequency: string;
    otherIncomeSources?: Array<{ name: string; amount: number; frequency: string }>;
  };
  monthlyExpenses?: Array<{
    category: string;
    estimatedAmount: number;
  }>;
  goals?: Array<{
    name: string;
    category: string;
    targetAmount: number;
    targetDate: string;
    currentSavedAmount?: number;
  }>;
  dataImportChoice?: string;
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

export interface InvestmentReturnsResponse {
  totalInvested?: Money;
  totalValue?: Money;
  unrealizedGain?: Money;
  returnsPercentage?: number;
  holdings?: Array<{ id: string; name: string; returns: number; value: Money }>;
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


