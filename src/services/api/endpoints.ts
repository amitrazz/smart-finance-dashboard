import {
  Account,
  ActionCategoryCount,
  ActionPreferences,
  AssetAllocationResponse,
  AssetRefreshResult,
  Budget,
  BudgetAlert,
  BudgetAnalytics,
  BudgetDashboardData,
  BudgetTemplate,
  CalendarEventItem,
  CashFlowSnapshot,
  Category,
  ChangeCreditCardLimitInput,
  BounceCreditCardPaymentInput,
  ConvertTransactionToEmiInput,
  CreateBalanceTransferInput,
  CreateCreditCardInput,
  CreateCreditCardStatementInput,
  CreateGoalInput,
  CreateLoanInput,
  CreateTradeInput,
  CreateTransactionInput,
  CreditCard,
  CreditCardBalanceTransfer,
  CreditCardCashback,
  CreditCardCashbackTransaction,
  CreditCardDashboardData,
  CreditCardDispute,
  CreditCardDocument,
  CreditCardEmi,
  CreditCardLimitHistory,
  CreditCardPayment,
  CreditCardRewardHistoryItem,
  CreditCardRewards,
  CreditCardStatement,
  CloseRetirementAccountInput,
  CreateRetirementAccountInput,
  DebtBreakdownResponse,
  FinancialHealthHistoryPoint,
  FinancialAnswer,
  FinancialHealthScore,
  FinancialInstitution,
  Goal,
  GoalAnalytics,
  GoalBeneficiary,
  GoalContribution,
  GoalDashboardData,
  GoalDocument,
  GoalForecast,
  GoalMilestone,
  GoalProjection,
  GoalTemplate,
  HealthDimensionDetail,
  HealthRecommendation,
  Holding,
  IgnoreReason,
  ImportJob,
  ImportRowStaging,
  UpdateImportRowInput,
  InvestmentReturnsPortfolio,
  Loan,
  LoanDashboardData,
  LoanDocument,
  LoanInterestRateHistory,
  LoanPayment,
  LoanScheduleItem,
  Lot,
  Merchant,
  MerchantReviewCluster,
  Money,
  NetWorthSnapshot,
  OnboardingAccountInput,
  OnboardingCreditCardInput,
  OnboardingGoalInput,
  OnboardingInvestmentInput,
  OnboardingLoanInput,
  OnboardingPreferencesInput,
  OnboardingProfileInput,
  OnboardingProgress,
  OnboardingState,
  OnboardingStatus,
  OnboardingStepCatalogItem,
  Portfolio,
  PortfolioDetail,
  PortfolioSnapshot,
  PrepayBalanceTransferInput,
  PriceRefreshStatus,
  RaiseCreditCardDisputeInput,
  RealizedGain,
  ReconciliationRecord,
  ReconciliationSummary,
  RecordCreditCardPaymentInput,
  RedeemCreditCardCashbackInput,
  RedeemCreditCardRewardsInput,
  RefreshPricesResponse,
  RecordRetirementTransactionInput,
  ResolveCreditCardDisputeInput,
  ResolveReviewClusterInput,
  RecurringContributionRule,
  CreateRecurringContributionRuleInput,
  RecurringContributionExecution,
  RetirementAccount,
  RetirementForecastResponse,
  RetirementSummary,
  RetirementTransaction,
  ReviewClusterStatus,
  RunAutoMatchResult,
  SearchResultItem,
  SipPlan,
  SmartActionItem,
  StatementLine,
  StatementLineCandidate,
  Trade,
  Transaction,
  Transfer,
  CreateTransferInput,
  ReverseTransferResult,
  UpdateCreditCardEmiInput,
  UpdateCreditCardInput,
  UpdateCreditCardStatementInput,
  UpdateGoalInput,
  UpdateLoanInput,
  UpdateRetirementAccountInput,
  UpdateTransactionInput,
  UserSelfIdentifier,
  CreateUserSelfIdentifierInput,
  UserSettings,
  AnalyticsTrendPoint,
} from '../../types';
import { fetchWithAuth } from './client';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
  hasMore?: boolean;
  totalCount?: number;
  total?: number;
  limit?: number;
}

// Mirrors the backend's DashboardResponseDto exactly (GET /finance/dashboard).
// There is no `monthlyIncome`, `savingsRate`, or `recentTransactions` field on
// that DTO — the dashboard view sources those from useCashFlowAnalytics() and
// useTransactions() instead of fabricating them here.
export interface DashboardResponse {
  netWorth: Money;
  cashPosition: Money;
  thisMonthSpend: Money;
  financialHealthScore: number;
  financialHealthRating: string;
  financialHealthComponents?: Record<string, HealthDimensionDetail>;
  topRecommendations?: HealthRecommendation[];
  upcomingBills?: Array<{ title: string; dueDate: string; amount: Money; deepLink: string | null }>;
  topActions?: SmartActionItem[];
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

const GOAL_TYPE_MAP: Record<string, string> = {
  EMERGENCY: 'EMERGENCY_FUND',
  VEHICLE: 'CAR',
  OTHER: 'CUSTOM',
};

const RISK_PROFILE_MAP: Record<string, string> = {
  BALANCED: 'MODERATE',
  GROWTH: 'AGGRESSIVE',
};

const VALID_GOAL_TYPES = new Set([
  'EMERGENCY_FUND',
  'RETIREMENT',
  'HOUSE',
  'CAR',
  'VACATION',
  'WEDDING',
  'EDUCATION',
  'CHILD_EDUCATION',
  'BUSINESS',
  'INVESTMENT_CORPUS',
  'PASSIVE_INCOME',
  'DEBT_FREE',
  'INSURANCE_CORPUS',
  'MEDICAL_FUND',
  'CUSTOM',
]);

const VALID_RISK_PROFILES = new Set(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']);

function normalizeGoalInput<T extends Record<string, unknown>>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const payload: Record<string, unknown> = { ...data };

  if (payload.type) {
    const rawType = String(payload.type).toUpperCase();
    if (GOAL_TYPE_MAP[rawType]) {
      payload.type = GOAL_TYPE_MAP[rawType];
    } else if (!VALID_GOAL_TYPES.has(rawType)) {
      payload.type = 'CUSTOM';
    } else {
      payload.type = rawType;
    }
  }

  if (payload.riskProfile) {
    const rawRisk = String(payload.riskProfile).toUpperCase();
    if (RISK_PROFILE_MAP[rawRisk]) {
      payload.riskProfile = RISK_PROFILE_MAP[rawRisk];
    } else if (!VALID_RISK_PROFILES.has(rawRisk)) {
      payload.riskProfile = 'MODERATE';
    } else {
      payload.riskProfile = rawRisk;
    }
  }

  if (payload.defaultRiskProfile) {
    const rawRisk = String(payload.defaultRiskProfile).toUpperCase();
    if (RISK_PROFILE_MAP[rawRisk]) {
      payload.defaultRiskProfile = RISK_PROFILE_MAP[rawRisk];
    } else if (!VALID_RISK_PROFILES.has(rawRisk)) {
      payload.defaultRiskProfile = 'MODERATE';
    } else {
      payload.defaultRiskProfile = rawRisk;
    }
  }

  if (
    payload.expectedReturnRate !== undefined &&
    payload.expectedReturnRate !== null &&
    payload.expectedReturnRate !== ''
  ) {
    const isString = typeof payload.expectedReturnRate === 'string';
    const num =
      typeof payload.expectedReturnRate === 'number'
        ? payload.expectedReturnRate
        : parseFloat(payload.expectedReturnRate as string);
    if (!isNaN(num)) {
      let decimalVal = num;
      if (num > 1) {
        decimalVal = num / 100;
      }
      decimalVal = Math.min(Math.max(0, decimalVal), 9.9999);
      payload.expectedReturnRate = isString ? decimalVal.toString() : decimalVal;
    }
  }

  if (
    payload.defaultExpectedReturnRate !== undefined &&
    payload.defaultExpectedReturnRate !== null &&
    payload.defaultExpectedReturnRate !== ''
  ) {
    const isString = typeof payload.defaultExpectedReturnRate === 'string';
    const num =
      typeof payload.defaultExpectedReturnRate === 'number'
        ? payload.defaultExpectedReturnRate
        : parseFloat(payload.defaultExpectedReturnRate as string);
    if (!isNaN(num)) {
      let decimalVal = num;
      if (num > 1) {
        decimalVal = num / 100;
      }
      decimalVal = Math.min(Math.max(0, decimalVal), 9.9999);
      payload.defaultExpectedReturnRate = isString ? decimalVal.toString() : decimalVal;
    }
  }

  return payload as T;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    fetchWithAuth<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; name?: string }) =>
    fetchWithAuth<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => fetchWithAuth<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  // Settings
  getSettings: () => fetchWithAuth<UserSettings>('/finance/settings'),
  updateSettings: (data: Partial<UserSettings>) =>
    fetchWithAuth<UserSettings>('/finance/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Onboarding (API-Driven)
  getOnboardingState: () => fetchWithAuth<OnboardingState>('/finance/onboarding'),
  getOnboardingStatus: () => fetchWithAuth<OnboardingStatus>('/finance/onboarding/status'),
  getOnboardingSteps: () => fetchWithAuth<OnboardingStepCatalogItem[]>('/finance/onboarding/steps'),
  getOnboardingCurrent: () =>
    fetchWithAuth<{ currentStepKey: string }>('/finance/onboarding/current'),

  postOnboardingProfile: (data: OnboardingProfileInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingPreferences: (data: OnboardingPreferencesInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingAccount: (data: OnboardingAccountInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/account', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingCreditCard: (data: OnboardingCreditCardInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/credit-card', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingLoan: (data: OnboardingLoanInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/loan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingInvestment: (data: OnboardingInvestmentInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/investment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingGoal: (data: OnboardingGoalInput) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/goal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  postOnboardingSkip: (stepKey: string) =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/skip', {
      method: 'POST',
      body: JSON.stringify({ stepKey }),
    }),
  postOnboardingComplete: () =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/complete', {
      method: 'POST',
    }),
  postOnboardingReset: () =>
    fetchWithAuth<OnboardingState>('/finance/onboarding/reset', {
      method: 'POST',
    }),

  // Fallback compatibility (same backend route as getOnboardingState, tolerant of an older response shape)
  getOnboardingProgress: () => fetchWithAuth<OnboardingProgress>('/finance/onboarding'),

  // Institutions
  getInstitutions: (params?: { search?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<FinancialInstitution>>(
      `/finance/institutions${buildQuery(params)}`,
    ),
  getInstitution: (id: string) =>
    fetchWithAuth<FinancialInstitution>(`/finance/institutions/${encodeURIComponent(id)}`),
  createInstitution: (data: Partial<FinancialInstitution>) =>
    fetchWithAuth<FinancialInstitution>('/finance/institutions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteInstitution: (id: string) =>
    fetchWithAuth<void>(`/finance/institutions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Accounts
  getAccounts: (params?: { limit?: number; search?: string; type?: string; status?: string }) =>
    fetchWithAuth<PaginatedResponse<Account>>(`/finance/accounts${buildQuery(params)}`),
  createAccount: (data: Partial<Account>) =>
    fetchWithAuth<Account>('/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAccount: (id: string) => fetchWithAuth<Account>(`/finance/accounts/${encodeURIComponent(id)}`),
  updateAccount: (id: string, data: Partial<Account>, version = 1) =>
    fetchWithAuth<Account>(
      `/finance/accounts/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteAccount: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/accounts/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'DELETE',
      },
    ),
  getAccountBalanceHistory: (id: string, params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ date: string; balance: Money }>>(
      `/finance/accounts/${encodeURIComponent(id)}/balance-history${buildQuery(params)}`,
    ),

  // Transactions
  getTransactions: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<Transaction>>(`/finance/transactions${buildQuery(params)}`),
  createTransaction: (data: CreateTransactionInput) =>
    fetchWithAuth<Transaction>('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTransaction: (id: string) =>
    fetchWithAuth<Transaction>(`/finance/transactions/${encodeURIComponent(id)}`),
  updateTransaction: (id: string, data: UpdateTransactionInput, version = 1) =>
    fetchWithAuth<Transaction>(
      `/finance/transactions/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteTransaction: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/transactions/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'DELETE',
      },
    ),
  bulkCategorizeTransactions: (data: { transactionIds: string[]; categoryId: string }) =>
    fetchWithAuth<{ updatedCount: number }>('/finance/transactions/bulk-categorize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Transfers (Transfer Center)
  getTransfers: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<Transfer>>(`/finance/transfers${buildQuery(params)}`),
  createTransfer: (data: CreateTransferInput) =>
    fetchWithAuth<Transfer>('/finance/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTransfer: (id: string) =>
    fetchWithAuth<Transfer>(`/finance/transfers/${encodeURIComponent(id)}`),
  reverseTransfer: (id: string) =>
    fetchWithAuth<ReverseTransferResult>(`/finance/transfers/${encodeURIComponent(id)}/reverse`, {
      method: 'POST',
    }),

  // Statement Reconciliation
  getStatementLines: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<StatementLine>>(
      `/finance/statement-lines${buildQuery(params)}`,
    ),
  getUnmatchedStatementLines: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<StatementLine>>(
      `/finance/statement-lines/unmatched${buildQuery(params)}`,
    ),
  getSuggestedStatementLines: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<StatementLine>>(
      `/finance/statement-lines/suggestions${buildQuery(params)}`,
    ),
  getStatementLine: (id: string) =>
    fetchWithAuth<StatementLine>(`/finance/statement-lines/${encodeURIComponent(id)}`),
  getStatementLineCandidates: (id: string) =>
    fetchWithAuth<StatementLineCandidate[]>(
      `/finance/statement-lines/${encodeURIComponent(id)}/candidates`,
    ),
  matchStatementLine: (id: string, transactionId: string, version: number) =>
    fetchWithAuth<StatementLine>(
      `/finance/statement-lines/${encodeURIComponent(id)}/match${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      },
    ),
  unmatchStatementLine: (id: string, version: number) =>
    fetchWithAuth<StatementLine>(
      `/finance/statement-lines/${encodeURIComponent(id)}/unmatch${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  ignoreStatementLine: (id: string, reason: IgnoreReason, version: number) =>
    fetchWithAuth<StatementLine>(
      `/finance/statement-lines/${encodeURIComponent(id)}/ignore${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    ),
  createMissingTransactionFromStatementLine: (
    id: string,
    data: { categoryId?: string; notes?: string },
    version: number,
  ) =>
    fetchWithAuth<StatementLine>(
      `/finance/statement-lines/${encodeURIComponent(id)}/create-transaction${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  runReconciliationAutoMatch: (params?: { accountId?: string; importJobId?: string }) =>
    fetchWithAuth<RunAutoMatchResult>(`/finance/reconciliation/auto-match${buildQuery(params)}`, {
      method: 'POST',
    }),
  completeReconciliation: (params?: { accountId?: string; dateFrom?: string; dateTo?: string }) =>
    fetchWithAuth<ReconciliationSummary>(`/finance/reconciliation/complete${buildQuery(params)}`, {
      method: 'POST',
    }),
  getReconciliations: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<ReconciliationRecord>>(
      `/finance/reconciliation${buildQuery(params)}`,
    ),
  getReconciliationSummary: (params?: { accountId?: string; dateFrom?: string; dateTo?: string }) =>
    fetchWithAuth<ReconciliationSummary>(`/finance/reconciliation/summary${buildQuery(params)}`),
  getReconciliationRecord: (id: string) =>
    fetchWithAuth<ReconciliationRecord>(`/finance/reconciliation/${encodeURIComponent(id)}`),
  confirmReconciliation: (id: string, version: number) =>
    fetchWithAuth<StatementLine>(
      `/finance/reconciliation/${encodeURIComponent(id)}/confirm${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  rejectReconciliation: (id: string, version: number) =>
    fetchWithAuth<StatementLine>(
      `/finance/reconciliation/${encodeURIComponent(id)}/reject${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),

  // Categories
  getCategories: (params?: { search?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Category> | Category[]>(`/finance/categories${buildQuery(params)}`),
  createCategory: (data: Partial<Category>) =>
    fetchWithAuth<Category>('/finance/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Imports
  getImportJobs: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<ImportJob>>(`/finance/imports${buildQuery(params)}`, {
      timeoutMs: 300000,
    }),
  getReviewQueue: (params?: { limit?: number; cursor?: string }) =>
    fetchWithAuth<PaginatedResponse<ImportRowStaging>>(
      `/finance/imports/review-queue${buildQuery(params)}`,
      {
        timeoutMs: 300000,
      },
    ),
  getImportJob: (id: string) =>
    fetchWithAuth<ImportJob>(`/finance/imports/${encodeURIComponent(id)}`, {
      timeoutMs: 300000,
    }),
  getImportPreview: (id: string, params?: { limit?: number; cursor?: string }) =>
    fetchWithAuth<PaginatedResponse<ImportRowStaging>>(
      `/finance/imports/${encodeURIComponent(id)}/preview${buildQuery(params)}`,
      {
        timeoutMs: 300000,
      },
    ),
  uploadImportFile: (formData: FormData) =>
    fetchWithAuth<ImportJob>('/finance/imports', {
      method: 'POST',
      body: formData,
      timeoutMs: 300000,
    }),
  confirmColumnMapping: (id: string, mapping: Record<string, string>) =>
    fetchWithAuth<ImportJob>(`/finance/imports/${encodeURIComponent(id)}/column-mapping`, {
      method: 'POST',
      body: JSON.stringify(mapping),
      timeoutMs: 300000,
    }),
  updateImportRow: (jobId: string, rowId: string, data: UpdateImportRowInput) =>
    fetchWithAuth<ImportRowStaging>(
      `/finance/imports/${encodeURIComponent(jobId)}/rows/${encodeURIComponent(rowId)}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: 300000,
      },
    ),
  commitImport: (id: string) =>
    fetchWithAuth<{ success: boolean; importedCount: number }>(
      `/finance/imports/${encodeURIComponent(id)}/commit`,
      {
        method: 'POST',
        timeoutMs: 300000,
      },
    ),
  retryImport: (id: string) =>
    fetchWithAuth<ImportJob>(`/finance/imports/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
      timeoutMs: 300000,
    }),
  rollbackImport: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/finance/imports/${encodeURIComponent(id)}/rollback`, {
      method: 'POST',
      timeoutMs: 300000,
    }),

  // Merchant Intelligence — Counterparty review clusters (Unknown
  // Counterparty Workflow: fuzzy-similar review-queue misses grouped for
  // one-action resolution) and the merchant directory search backing the
  // "resolve to existing merchant" picker.
  getMerchants: (params?: { search?: string; merchantType?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Merchant>>(`/finance/merchants${buildQuery(params)}`),
  getMerchant: (id: string) =>
    fetchWithAuth<Merchant>(`/finance/merchants/${encodeURIComponent(id)}`),
  getReviewClusters: (params?: { status?: ReviewClusterStatus; cursor?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<MerchantReviewCluster>>(
      `/finance/merchant/review-clusters${buildQuery(params)}`,
    ),
  getReviewCluster: (id: string) =>
    fetchWithAuth<MerchantReviewCluster>(
      `/finance/merchant/review-clusters/${encodeURIComponent(id)}`,
    ),
  resolveReviewCluster: (id: string, data: ResolveReviewClusterInput) =>
    fetchWithAuth<MerchantReviewCluster>(
      `/finance/merchant/review-clusters/${encodeURIComponent(id)}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  // Self-transfer identifiers — the user's own UPI VPAs. An imported
  // transaction whose counterparty VPA matches one of these is
  // auto-categorized Transfer during CSV/PDF import, so it's excluded from
  // cash-flow income/expense the same way any other transfer is.
  getSelfIdentifiers: (params?: { enabled?: boolean; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<UserSelfIdentifier>>(
      `/finance/self-identifiers${buildQuery(params)}`,
    ),
  createSelfIdentifier: (data: CreateUserSelfIdentifierInput) =>
    fetchWithAuth<UserSelfIdentifier>('/finance/self-identifiers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleSelfIdentifier: (id: string, enabled: boolean) =>
    fetchWithAuth<UserSelfIdentifier>(
      `/finance/self-identifiers/${encodeURIComponent(id)}/toggle`,
      {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      },
    ),

  // Documents
  getDocuments: (params?: { limit?: number }) =>
    fetchWithAuth<
      PaginatedResponse<{ id: string; name: string; size: number; uploadedAt: string }>
    >(`/finance/documents${buildQuery(params)}`),
  getDocument: (id: string) =>
    fetchWithAuth<{ id: string; name: string; size: number; contentUrl?: string }>(
      `/finance/documents/${encodeURIComponent(id)}`,
    ),
  downloadDocument: (id: string) =>
    fetchWithAuth<Blob>(`/finance/documents/${encodeURIComponent(id)}/download`),

  // Investments
  getHoldings: (params?: { cursor?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Holding>>(`/finance/investments/holdings${buildQuery(params)}`),
  getHoldingLots: (holdingId: string) =>
    fetchWithAuth<Lot[]>(`/finance/investments/holdings/${encodeURIComponent(holdingId)}/lots`),
  getTrades: (params?: {
    assetId?: string;
    portfolioId?: string;
    cursor?: string;
    limit?: number;
  }) => fetchWithAuth<PaginatedResponse<Trade>>(`/finance/investments/trades${buildQuery(params)}`),
  createTrade: (data: CreateTradeInput) =>
    fetchWithAuth<Trade>('/finance/investments/trades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSIPs: (params?: { cursor?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<SipPlan>>(`/finance/investments/sips${buildQuery(params)}`),
  getRealizedGains: (params?: {
    dateFrom?: string;
    dateTo?: string;
    cursor?: string;
    limit?: number;
  }) =>
    fetchWithAuth<PaginatedResponse<RealizedGain>>(
      `/finance/investments/realized-gains${buildQuery(params)}`,
    ),

  // Asset price refresh (Yahoo Finance-backed). Manual refresh always calls
  // the same AssetPriceRefreshService the daily scheduled job uses — never
  // a symbol or a price, only internal asset ids resolved server-side.
  refreshHoldingPrices: (assetIds?: string[]) =>
    fetchWithAuth<RefreshPricesResponse>('/finance/investments/prices/refresh', {
      method: 'POST',
      body: JSON.stringify(assetIds ? { assetIds } : {}),
    }),
  refreshAssetPrice: (assetId: string) =>
    fetchWithAuth<AssetRefreshResult>(
      `/finance/investments/assets/${encodeURIComponent(assetId)}/prices/refresh`,
      { method: 'POST' },
    ),
  getPriceRefreshStatus: () =>
    fetchWithAuth<PriceRefreshStatus>('/finance/investments/prices/status'),

  // Portfolio
  getPortfolios: () =>
    fetchWithAuth<PaginatedResponse<Portfolio> | Portfolio[]>('/finance/portfolio'),
  getPortfolio: (id: string) =>
    fetchWithAuth<PortfolioDetail>(`/finance/portfolio/${encodeURIComponent(id)}`),
  getPortfolioHistory: (
    id: string,
    params?: { dateFrom?: string; dateTo?: string; cursor?: string; limit?: number },
  ) =>
    fetchWithAuth<PaginatedResponse<PortfolioSnapshot>>(
      `/finance/portfolio/${encodeURIComponent(id)}/history${buildQuery(params)}`,
    ),

  // Retirement (EPF / VPF / PPF / NPS) — balance/contribution-tracked
  // accounts, structurally separate from Investments/Portfolio (no lots, no
  // trades). See packages/finance/src/retirement on the backend.
  getRetirementAccounts: (params?: {
    productType?: string;
    status?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }) =>
    fetchWithAuth<PaginatedResponse<RetirementAccount>>(
      `/finance/retirement/accounts${buildQuery(params)}`,
    ),
  getRetirementAccount: (id: string) =>
    fetchWithAuth<RetirementAccount>(`/finance/retirement/accounts/${encodeURIComponent(id)}`),
  createRetirementAccount: (data: CreateRetirementAccountInput) =>
    fetchWithAuth<RetirementAccount>('/finance/retirement/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRetirementAccount: (id: string, data: UpdateRetirementAccountInput, version = 1) =>
    fetchWithAuth<RetirementAccount>(
      `/finance/retirement/accounts/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  closeRetirementAccount: (id: string, data: CloseRetirementAccountInput, version = 1) =>
    fetchWithAuth<RetirementAccount>(
      `/finance/retirement/accounts/${encodeURIComponent(id)}/close${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getRetirementTransactions: (params?: {
    retirementAccountId?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    cursor?: string;
    limit?: number;
  }) =>
    fetchWithAuth<PaginatedResponse<RetirementTransaction>>(
      `/finance/retirement/transactions${buildQuery(params)}`,
    ),
  recordRetirementTransaction: (data: RecordRetirementTransactionInput) =>
    fetchWithAuth<RetirementTransaction>('/finance/retirement/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reverseRetirementTransaction: (id: string, version = 1) =>
    fetchWithAuth<RetirementTransaction>(
      `/finance/retirement/transactions/${encodeURIComponent(id)}/reverse${buildQuery({ version })}`,
      { method: 'POST' },
    ),
  getRetirementSummary: () => fetchWithAuth<RetirementSummary>('/finance/retirement/summary'),

  // Recurring Contributions (currently: RETIREMENT_CONTRIBUTION only)
  createRecurringContributionRule: (data: CreateRecurringContributionRuleInput) =>
    fetchWithAuth<RecurringContributionRule>('/finance/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRecurringContributionRules: (params?: {
    retirementAccountId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }) => fetchWithAuth<PaginatedResponse<RecurringContributionRule>>(`/finance/recurring${buildQuery(params)}`),
  getRecurringContributionRule: (id: string) =>
    fetchWithAuth<RecurringContributionRule>(`/finance/recurring/${encodeURIComponent(id)}`),
  pauseRecurringContributionRule: (id: string, version = 1) =>
    fetchWithAuth<RecurringContributionRule>(
      `/finance/recurring/${encodeURIComponent(id)}/pause${buildQuery({ version })}`,
      { method: 'PATCH' },
    ),
  resumeRecurringContributionRule: (id: string, version = 1) =>
    fetchWithAuth<RecurringContributionRule>(
      `/finance/recurring/${encodeURIComponent(id)}/resume${buildQuery({ version })}`,
      { method: 'PATCH' },
    ),
  cancelRecurringContributionRule: (id: string, version = 1) =>
    fetchWithAuth<RecurringContributionRule>(
      `/finance/recurring/${encodeURIComponent(id)}/cancel${buildQuery({ version })}`,
      { method: 'PATCH' },
    ),
  getRecurringContributionExecutions: (ruleId: string, params?: { cursor?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<RecurringContributionExecution>>(
      `/finance/recurring/${encodeURIComponent(ruleId)}/executions${buildQuery(params)}`,
    ),

  // Loans
  getLoans: (params?: {
    status?: string;
    type?: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }) => fetchWithAuth<PaginatedResponse<Loan> | Loan[]>(`/finance/loans${buildQuery(params)}`),
  getLoanDashboard: () => fetchWithAuth<LoanDashboardData>('/finance/loans/dashboard'),
  createLoan: (data: CreateLoanInput) =>
    fetchWithAuth<Loan>('/finance/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLoan: (id: string) => fetchWithAuth<Loan>(`/finance/loans/${encodeURIComponent(id)}`),
  updateLoan: (id: string, data: UpdateLoanInput, version = 1) =>
    fetchWithAuth<Loan>(`/finance/loans/${encodeURIComponent(id)}${buildQuery({ version })}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  closeLoan: (id: string, version = 1) =>
    fetchWithAuth<Loan>(
      `/finance/loans/${encodeURIComponent(id)}/close${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  pauseLoan: (id: string, version = 1) =>
    fetchWithAuth<Loan>(
      `/finance/loans/${encodeURIComponent(id)}/pause${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  resumeLoan: (id: string, version = 1) =>
    fetchWithAuth<Loan>(
      `/finance/loans/${encodeURIComponent(id)}/resume${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  cancelLoan: (id: string, version = 1) =>
    fetchWithAuth<Loan>(
      `/finance/loans/${encodeURIComponent(id)}/cancel${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  getLoanSchedule: (id: string) =>
    fetchWithAuth<PaginatedResponse<LoanScheduleItem> | LoanScheduleItem[]>(
      `/finance/loans/${encodeURIComponent(id)}/schedule`,
    ),
  getEmiSchedule: (id: string) =>
    fetchWithAuth<PaginatedResponse<LoanScheduleItem> | LoanScheduleItem[]>(
      `/finance/loans/${encodeURIComponent(id)}/schedule`,
    ),
  regenerateLoanSchedule: (id: string, version = 1) =>
    fetchWithAuth<LoanScheduleItem[]>(
      `/finance/loans/${encodeURIComponent(id)}/schedule/regenerate${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  payLoanInstallment: (
    loanId: string,
    scheduleId: string,
    data?: {
      paidAmount?: string;
      paidDate?: string;
      paymentMethod?: string;
      reference?: string;
      principalPortion?: string;
      interestPortion?: string;
      penaltyPortion?: string;
    },
  ) =>
    fetchWithAuth<LoanScheduleItem>(
      `/finance/loans/${encodeURIComponent(loanId)}/schedule/${encodeURIComponent(scheduleId)}/pay`,
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      },
    ),
  markEmiPaid: (loanId: string, emiId: string, data?: Record<string, unknown>) =>
    fetchWithAuth<LoanScheduleItem>(
      `/finance/loans/${encodeURIComponent(loanId)}/schedule/${encodeURIComponent(emiId)}/pay`,
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      },
    ),
  recordExtraLoanPayment: (
    loanId: string,
    data: {
      paidAmount: string;
      paidDate?: string;
      paymentMethod?: string;
      reference?: string;
      principalPortion?: string;
      interestPortion?: string;
      penaltyPortion?: string;
      notes?: string;
    },
  ) =>
    fetchWithAuth<LoanPayment>(`/finance/loans/${encodeURIComponent(loanId)}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLoanPayments: (id: string, params?: { limit?: number; cursor?: string }) =>
    fetchWithAuth<PaginatedResponse<LoanPayment> | LoanPayment[]>(
      `/finance/loans/${encodeURIComponent(id)}/payments${buildQuery(params)}`,
    ),
  reverseLoanPayment: (loanId: string, paymentId: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/loans/${encodeURIComponent(loanId)}/payments/${encodeURIComponent(paymentId)}/reverse`,
      { method: 'POST' },
    ),
  getLoanInterestRateHistory: (id: string) =>
    fetchWithAuth<LoanInterestRateHistory[]>(
      `/finance/loans/${encodeURIComponent(id)}/interest-rate-history`,
    ),
  changeLoanInterestRate: (
    loanId: string,
    data: { newRate: string; effectiveDate: string; reason?: string },
    version = 1,
  ) =>
    fetchWithAuth<Loan>(
      `/finance/loans/${encodeURIComponent(loanId)}/interest-rate${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getLoanDocuments: (id: string) =>
    fetchWithAuth<LoanDocument[]>(`/finance/loans/${encodeURIComponent(id)}/documents`),
  addLoanDocument: (
    loanId: string,
    data: {
      category: string;
      fileName: string;
      storageKey: string;
      mimeType: string;
      sizeBytes: number;
    },
  ) =>
    fetchWithAuth<LoanDocument>(`/finance/loans/${encodeURIComponent(loanId)}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteLoanDocument: (loanId: string, documentId: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/loans/${encodeURIComponent(loanId)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'DELETE' },
    ),

  // Credit Cards
  getCreditCards: (params?: {
    limit?: number;
    status?: string;
    issuer?: string;
    search?: string;
  }) =>
    fetchWithAuth<PaginatedResponse<CreditCard> | CreditCard[]>(
      `/finance/credit-cards${buildQuery(params)}`,
    ),
  getCreditCard: (id: string) =>
    fetchWithAuth<CreditCard>(`/finance/credit-cards/${encodeURIComponent(id)}`),
  getCreditCardDashboard: () =>
    fetchWithAuth<CreditCardDashboardData>('/finance/credit-cards/dashboard'),
  createCreditCard: (data: CreateCreditCardInput | Partial<CreditCard>) =>
    fetchWithAuth<CreditCard>('/finance/credit-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCreditCard: (id: string, data: UpdateCreditCardInput | Partial<CreditCard>, version = 1) =>
    fetchWithAuth<CreditCard>(
      `/finance/credit-cards/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteCreditCard: (id: string, version = 1) =>
    fetchWithAuth<void>(
      `/finance/credit-cards/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'DELETE',
      },
    ),
  changeCreditCardLimit: (cardId: string, data: ChangeCreditCardLimitInput, version = 1) =>
    fetchWithAuth<CreditCard>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/limit${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getCreditCardLimitHistory: (cardId: string) =>
    fetchWithAuth<PaginatedResponse<CreditCardLimitHistory> | CreditCardLimitHistory[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/limit-history`,
    ),
  closeCreditCard: (cardId: string, version = 1) =>
    fetchWithAuth<CreditCard>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/close${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  getCardStatements: (cardId: string, params?: { limit?: number; status?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardStatement> | CreditCardStatement[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/statements${buildQuery(params)}`,
    ),
  getCardStatementDetails: (cardId: string, statementId: string) =>
    fetchWithAuth<CreditCardStatement>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/statements/${encodeURIComponent(statementId)}`,
    ),
  createCardStatement: (cardId: string, data: CreateCreditCardStatementInput) =>
    fetchWithAuth<CreditCardStatement>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/statements`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  updateCardStatement: (cardId: string, statementId: string, data: UpdateCreditCardStatementInput) =>
    fetchWithAuth<CreditCardStatement>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/statements/${encodeURIComponent(statementId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  getCardPayments: (cardId: string, params?: { limit?: number; cursor?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardPayment> | CreditCardPayment[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/payments${buildQuery(params)}`,
    ),
  recordCardPayment: (cardId: string, data: RecordCreditCardPaymentInput) =>
    fetchWithAuth<CreditCardPayment>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  reverseCardPayment: (cardId: string, paymentId: string) =>
    fetchWithAuth<CreditCardPayment>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/payments/${encodeURIComponent(paymentId)}/reverse`,
      {
        method: 'POST',
      },
    ),
  bounceCardPayment: (cardId: string, paymentId: string, data: BounceCreditCardPaymentInput) =>
    fetchWithAuth<CreditCardPayment>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/payments/${encodeURIComponent(paymentId)}/bounce`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getCardTransactions: (
    cardId: string,
    params?: { limit?: number; category?: string; merchant?: string; search?: string; cursor?: string },
  ) =>
    fetchWithAuth<PaginatedResponse<Transaction> | Transaction[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/transactions${buildQuery(params)}`,
    ),
  getCardEmis: (cardId: string, params?: { limit?: number; status?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardEmi> | CreditCardEmi[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/emis${buildQuery(params)}`,
    ),
  convertTransactionToEmi: (cardId: string, data: ConvertTransactionToEmiInput) =>
    fetchWithAuth<CreditCardEmi>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/emis`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  updateCardEmi: (cardId: string, emiId: string, data: UpdateCreditCardEmiInput, version = 1) =>
    fetchWithAuth<CreditCardEmi>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/emis/${encodeURIComponent(emiId)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  closeCardEmi: (cardId: string, emiId: string, version = 1) =>
    fetchWithAuth<CreditCardEmi>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/emis/${encodeURIComponent(emiId)}/close${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  getCardRewards: (cardId: string) =>
    fetchWithAuth<CreditCardRewards>(`/finance/credit-cards/${encodeURIComponent(cardId)}/rewards`),
  redeemCardRewards: (cardId: string, data: RedeemCreditCardRewardsInput) =>
    fetchWithAuth<CreditCardRewards>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/rewards/redeem`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getCardRewardsHistory: (cardId: string, params?: { limit?: number; cursor?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardRewardHistoryItem> | CreditCardRewardHistoryItem[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/rewards/history${buildQuery(params)}`,
    ),
  raiseCardDispute: (cardId: string, data: RaiseCreditCardDisputeInput) =>
    fetchWithAuth<CreditCardDispute>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/disputes`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getCardDisputes: (cardId: string, params?: { limit?: number; cursor?: string; status?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardDispute> | CreditCardDispute[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/disputes${buildQuery(params)}`,
    ),
  getCardDispute: (cardId: string, disputeId: string) =>
    fetchWithAuth<CreditCardDispute>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/disputes/${encodeURIComponent(disputeId)}`,
    ),
  resolveCardDispute: (cardId: string, disputeId: string, data: ResolveCreditCardDisputeInput) =>
    fetchWithAuth<CreditCardDispute>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/disputes/${encodeURIComponent(disputeId)}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  createBalanceTransfer: (cardId: string, data: CreateBalanceTransferInput) =>
    fetchWithAuth<CreditCardBalanceTransfer>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/balance-transfers`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getBalanceTransfers: (cardId: string, params?: { limit?: number; cursor?: string; status?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardBalanceTransfer> | CreditCardBalanceTransfer[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/balance-transfers${buildQuery(params)}`,
    ),
  getBalanceTransfer: (cardId: string, balanceTransferId: string) =>
    fetchWithAuth<CreditCardBalanceTransfer>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/balance-transfers/${encodeURIComponent(balanceTransferId)}`,
    ),
  prepayBalanceTransfer: (cardId: string, balanceTransferId: string, data: PrepayBalanceTransferInput, version = 1) =>
    fetchWithAuth<CreditCardBalanceTransfer>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/balance-transfers/${encodeURIComponent(balanceTransferId)}/prepay${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  closeBalanceTransfer: (cardId: string, balanceTransferId: string, version = 1) =>
    fetchWithAuth<CreditCardBalanceTransfer>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/balance-transfers/${encodeURIComponent(balanceTransferId)}/close${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  getCardCashback: (cardId: string) =>
    fetchWithAuth<CreditCardCashback>(`/finance/credit-cards/${encodeURIComponent(cardId)}/cashback`),
  redeemCardCashback: (cardId: string, data: RedeemCreditCardCashbackInput) =>
    fetchWithAuth<CreditCardCashback>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/cashback/redeem`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getCardCashbackHistory: (cardId: string, params?: { limit?: number; cursor?: string }) =>
    fetchWithAuth<PaginatedResponse<CreditCardCashbackTransaction> | CreditCardCashbackTransaction[]>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/cashback/history${buildQuery(params)}`,
    ),
  getCardDocuments: (cardId: string) =>
    fetchWithAuth<CreditCardDocument[] | PaginatedResponse<CreditCardDocument>>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/documents`,
    ),
  uploadCardDocument: (cardId: string, formData: FormData) =>
    fetchWithAuth<CreditCardDocument>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/documents`,
      {
        method: 'POST',
        body: formData,
      },
    ),
  deleteCardDocument: (cardId: string, documentId: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'DELETE' },
    ),

  // Liabilities
  getLiabilities: () =>
    fetchWithAuth<PaginatedResponse<{ id: string; name: string; type: string; amount: Money }>>(
      '/finance/liabilities',
    ),
  // Mirrors the backend's LiabilitiesSummaryDto — all plain decimal strings,
  // not Money objects, and no `totalLiabilities`/`loansTotal`/`creditCardsTotal`
  // fields exist on it.
  getLiabilitiesSummary: () =>
    fetchWithAuth<{
      totalDebt: string;
      totalLoanPrincipal: string;
      totalCreditCardDebt: string;
      blendedInterestRate: string;
      debtToIncomeRatio: string;
    }>('/finance/liabilities/summary'),

  // Analytics
  getNetWorth: () => fetchWithAuth<NetWorthSnapshot>('/finance/net-worth'),
  getNetWorthHistory: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<NetWorthSnapshot>>(
      `/finance/net-worth/history${buildQuery(params)}`,
    ),
  getCashFlow: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<CashFlowSnapshot>>(
      `/finance/analytics/cash-flow${buildQuery(params)}`,
    ),
  getInvestmentReturns: () =>
    fetchWithAuth<InvestmentReturnsPortfolio[]>('/finance/analytics/investment-returns'),
  getAssetAllocation: () =>
    fetchWithAuth<AssetAllocationResponse>('/finance/analytics/asset-allocation'),
  getDebtBreakdown: () => fetchWithAuth<DebtBreakdownResponse>('/finance/analytics/debt-breakdown'),
  getIncomeTrend: (params?: { limit?: number; dateFrom?: string; dateTo?: string }) =>
    fetchWithAuth<PaginatedResponse<AnalyticsTrendPoint>>(
      `/finance/analytics/income-trend${buildQuery(params)}`,
    ),
  getExpenseTrendAnalytics: (params?: { limit?: number; dateFrom?: string; dateTo?: string }) =>
    fetchWithAuth<PaginatedResponse<AnalyticsTrendPoint>>(
      `/finance/analytics/expense-trend${buildQuery(params)}`,
    ),
  getRetirementForecast: (params?: {
    currentAge?: number;
    retirementAge?: number;
    expectedReturnPercent?: string;
  }) =>
    fetchWithAuth<RetirementForecastResponse>(
      `/finance/analytics/retirement-forecast${buildQuery(params)}`,
    ),

  // Insights — removed 2026-08-11 with the backend context that served them.
  // The Smart Action Center below is the live replacement; `getRiskMatrix` was
  // the last caller and now reads from it.

  // Financial Health & Dashboard
  getFinancialHealth: () => fetchWithAuth<FinancialHealthScore>('/finance/financial-health'),
  getFinancialHealthHistory: (params?: { window?: string; limit?: number }) =>
    fetchWithAuth<FinancialHealthHistoryPoint[] | PaginatedResponse<FinancialHealthHistoryPoint>>(
      `/finance/financial-health/history${buildQuery(params)}`,
    ),
  getDashboard: () => fetchWithAuth<DashboardResponse>('/finance/dashboard'),

  // Detailed Financial Health Score (Centerpiece Engine)
  getHealthScore: () => fetchWithAuth<FinancialHealthScore>('/finance/financial-health'),
  getHealthHistory: (params?: { window?: string; period?: string; limit?: number }) =>
    fetchWithAuth<FinancialHealthHistoryPoint[] | PaginatedResponse<FinancialHealthHistoryPoint>>(
      `/finance/financial-health/history${buildQuery(params)}`,
    ),
  getHealthComponents: () =>
    fetchWithAuth<HealthDimensionDetail[]>('/finance/financial-health/components'),
  getHealthRecommendations: () =>
    fetchWithAuth<HealthRecommendation[]>('/finance/financial-health/recommendations'),
  recalculateHealthScore: () =>
    fetchWithAuth<FinancialHealthScore>('/finance/financial-health/recalculate', {
      method: 'POST',
    }),

  // Smart Action Center (Daily Command Center)
  getSmartActions: (params?: {
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }) => fetchWithAuth<PaginatedResponse<SmartActionItem>>(`/finance/actions${buildQuery(params)}`),
  getTodayActions: () => fetchWithAuth<SmartActionItem[]>('/finance/actions/today'),
  getHighPriorityActions: () => fetchWithAuth<SmartActionItem[]>('/finance/actions/high-priority'),
  getActionCategories: () =>
    fetchWithAuth<ActionCategoryCount[] | PaginatedResponse<ActionCategoryCount>>(
      '/finance/actions/categories',
    ),
  getActionPreferences: () => fetchWithAuth<ActionPreferences>('/finance/actions/preferences'),
  updateActionPreferences: (data: Partial<ActionPreferences>) =>
    fetchWithAuth<ActionPreferences>('/finance/actions/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getActionById: (id: string) =>
    fetchWithAuth<SmartActionItem>(`/finance/actions/${encodeURIComponent(id)}`),
  // `GET /finance/actions/category/:category` does not exist on the backend —
  // the controller has no such route, so it 404s. Filtering is a query param on
  // the list endpoint.
  getActionsByCategory: (category: string) =>
    fetchWithAuth<PaginatedResponse<SmartActionItem>>(
      `/finance/actions${buildQuery({ category, status: 'ACTIVE' })}`,
    ),
  dismissSmartAction: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean; status?: string }>(
      `/finance/actions/${encodeURIComponent(id)}/dismiss${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  completeSmartAction: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean; status?: string }>(
      `/finance/actions/${encodeURIComponent(id)}/complete${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  snoozeSmartAction: (id: string, snoozedUntil: string, version = 1) =>
    fetchWithAuth<{ success: boolean; status?: string }>(
      `/finance/actions/${encodeURIComponent(id)}/snooze${buildQuery({ version })}`,
      {
        method: 'POST',
        body: JSON.stringify({ snoozedUntil }),
      },
    ),
  refreshSmartActions: () =>
    fetchWithAuth<{ status: string; refreshedCount?: number }>('/finance/actions/refresh', {
      method: 'POST',
    }),

  // AI — grounded question answering over the caller's own finances.
  // The backend rejects any answer asserting a figure absent from the
  // deterministic context it assembled, so `status` must be handled: an
  // UNGROUNDED response carries fallback text, not the model's claim.
  askFinancialQuestion: (question: string) =>
    fetchWithAuth<FinancialAnswer>('/finance/ai/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  // Expenses
  getExpensesByCategory: () =>
    fetchWithAuth<
      Array<{ categoryId: string; categoryName: string; amount: Money; percentage: number }>
    >('/finance/expenses/by-category'),
  getExpensesByMerchant: () =>
    fetchWithAuth<Array<{ merchantId: string; merchantName: string; amount: Money }>>(
      '/finance/expenses/by-merchant',
    ),
  getExpenseTrend: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ month: string; amount: Money }>>(
      `/finance/expenses/trend${buildQuery(params)}`,
    ),

  // Income
  getIncomeSources: (params?: { limit?: number }) =>
    fetchWithAuth<
      PaginatedResponse<{ id: string; name: string; expectedAmount: Money; frequency: string }>
    >(`/finance/income/sources${buildQuery(params)}`),
  createIncomeSource: (
    data: Partial<{ name: string; expectedAmount: string | Money; frequency: string }>,
  ) =>
    fetchWithAuth<{ id: string; name: string }>('/finance/income/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getIncomeRecords: (params?: { limit?: number }) =>
    fetchWithAuth<
      PaginatedResponse<{ id: string; sourceName: string; amount: Money; date: string }>
    >(`/finance/income/records${buildQuery(params)}`),
  recordIncome: (data: Partial<{ sourceId: string; amount: string | Money; date: string }>) =>
    fetchWithAuth<{ id: string; success: boolean }>('/finance/income/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Budgets & Spend Platform APIs
  getBudgetDashboard: () => fetchWithAuth<BudgetDashboardData>('/finance/budgets/dashboard'),

  getBudgets: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<Budget> | Budget[]>(`/finance/budgets${buildQuery(params)}`),

  getBudget: (id: string) => fetchWithAuth<Budget>(`/finance/budgets/${encodeURIComponent(id)}`),

  createBudget: (data: Partial<Budget>) =>
    fetchWithAuth<Budget>('/finance/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBudget: (id: string, data: Partial<Budget>, version = 1) =>
    fetchWithAuth<Budget>(`/finance/budgets/${encodeURIComponent(id)}${buildQuery({ version })}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteBudget: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/budgets/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'DELETE',
      },
    ),

  getBudgetCategories: (budgetId: string) =>
    fetchWithAuth<unknown[] | PaginatedResponse<unknown>>(
      `/finance/budgets/${encodeURIComponent(budgetId)}/categories`,
    ),

  // No update-in-place endpoint for a single existing category allocation —
  // only creation. POSTing an allocation for a category that's already
  // allocated returns a 422 (DUPLICATE_ALLOCATION_CATEGORY). To edit an
  // existing allocation's limit, use replaceBudgetCategories instead.
  updateCategoryAllocation: (
    budgetId: string,
    categoryId: string,
    data: { limitAmount: string | Money },
  ) =>
    fetchWithAuth<unknown>(`/finance/budgets/${encodeURIComponent(budgetId)}/categories`, {
      method: 'POST',
      body: JSON.stringify({
        categoryId,
        allocatedAmount:
          typeof data.limitAmount === 'object' ? data.limitAmount.amount : data.limitAmount,
      }),
    }),

  // Replaces the whole current period's allocation set in one call.
  replaceBudgetCategories: (
    budgetId: string,
    allocations: Array<{
      categoryId: string;
      allocatedAmount: string;
      warningThreshold?: string;
      criticalThreshold?: string;
    }>,
  ) =>
    fetchWithAuth<unknown>(`/finance/budgets/${encodeURIComponent(budgetId)}/categories`, {
      method: 'PATCH',
      body: JSON.stringify({ allocations }),
    }),

  getBudgetSummary: (budgetId: string) =>
    fetchWithAuth<{
      budgetId?: string;
      allocated?: string;
      spent?: string;
      remaining?: string;
      available?: string;
      dailyBudget?: string;
      forecastExpectedMonthEndSpend?: string;
      utilization?: string;
      daysRemaining?: number;
      healthScore?: number;
      riskLevel?: string;
    }>(`/finance/budgets/${encodeURIComponent(budgetId)}/summary`),

  // Analytics is per-budget only — there is no cross-budget aggregate route.
  getBudgetAnalytics: (id: string) =>
    fetchWithAuth<BudgetAnalytics>(`/finance/budgets/${encodeURIComponent(id)}/analytics`),

  getBudgetHistory: (id: string, params?: { cursor?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<unknown>>(
      `/finance/budgets/${encodeURIComponent(id)}/history${buildQuery(params)}`,
    ),

  updateBudgetAlertSettings: (id: string, notificationEnabled: boolean, version: number) =>
    fetchWithAuth<Budget>(
      `/finance/budgets/${encodeURIComponent(id)}/alerts/settings${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ notificationEnabled }),
      },
    ),

  carryForwardBudget: (id: string) =>
    fetchWithAuth<unknown>(`/finance/budgets/${encodeURIComponent(id)}/carry-forward`, {
      method: 'POST',
    }),

  duplicateBudget: (
    id: string,
    data: {
      source: 'PREVIOUS_MONTH' | 'PREVIOUS_YEAR' | 'TEMPLATE';
      name: string;
      startDate: string;
      templateId?: string;
    },
  ) =>
    fetchWithAuth<Budget>(`/finance/budgets/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetBudget: (id: string) =>
    fetchWithAuth<Budget>(`/finance/budgets/${encodeURIComponent(id)}/reset`, { method: 'POST' }),

  getBudgetTemplates: () =>
    fetchWithAuth<BudgetTemplate[] | PaginatedResponse<BudgetTemplate>>(
      '/finance/budgets/templates',
    ),

  createBudgetTemplate: (data: {
    name: string;
    description?: string;
    templateType: string;
    allocations: Array<{ categoryId: string; percentage?: string; fixedAmount?: string }>;
  }) =>
    fetchWithAuth<BudgetTemplate>('/finance/budgets/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBudgetTemplate: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      templateType: string;
      allocations: Array<{ categoryId: string; percentage?: string; fixedAmount?: string }>;
    }>,
    version: number,
  ) =>
    fetchWithAuth<BudgetTemplate>(
      `/finance/budgets/templates/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),

  deleteBudgetTemplate: (id: string, version: number) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/budgets/templates/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'DELETE',
      },
    ),

  // Applies the template's allocations onto an *existing* budget's current
  // period — it does not create a new budget. Returns the resulting
  // allocation lines, not a Budget.
  applyBudgetTemplate: (templateId: string, budgetId: string) =>
    fetchWithAuth<unknown[]>(`/finance/budgets/templates/${encodeURIComponent(templateId)}/apply`, {
      method: 'POST',
      body: JSON.stringify({ budgetId }),
    }),

  getBudgetAlerts: (params?: {
    budgetId?: string;
    isRead?: boolean;
    isDismissed?: boolean;
    type?: string;
    cursor?: string;
    limit?: number;
  }) =>
    fetchWithAuth<BudgetAlert[] | PaginatedResponse<BudgetAlert>>(
      `/finance/budgets/alerts${buildQuery(params)}`,
    ),

  dismissBudgetAlert: (alertId: string, version: number) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/budgets/alerts/${encodeURIComponent(alertId)}/dismiss${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),

  markBudgetAlertRead: (alertId: string, version: number) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/budgets/alerts/${encodeURIComponent(alertId)}/read${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),

  // Goals Platform APIs
  getGoals: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<Goal> | Goal[]>(`/finance/goals${buildQuery(params)}`),

  getGoalDashboard: () => fetchWithAuth<GoalDashboardData>('/finance/goals/dashboard'),

  getGoal: (id: string) => fetchWithAuth<Goal>(`/finance/goals/${encodeURIComponent(id)}`),

  createGoal: (data: CreateGoalInput | Partial<Goal>) => {
    const normalized = normalizeGoalInput(data as Record<string, unknown>);
    return fetchWithAuth<Goal>('/finance/goals', {
      method: 'POST',
      body: JSON.stringify(normalized),
    });
  },

  updateGoal: (id: string, data: UpdateGoalInput | Partial<Goal>, version = 1) => {
    const normalized = normalizeGoalInput(data as Record<string, unknown>);
    return fetchWithAuth<Goal>(
      `/finance/goals/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'PATCH',
        body: JSON.stringify(normalized),
      },
    );
  },

  deleteGoal: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/goals/${encodeURIComponent(id)}${buildQuery({ version })}`,
      {
        method: 'DELETE',
      },
    ),

  // Status transitions
  activateGoal: (id: string, version: number) =>
    fetchWithAuth<Goal>(
      `/finance/goals/${encodeURIComponent(id)}/activate${buildQuery({ version })}`,
      { method: 'POST' },
    ),

  pauseGoal: (id: string, version: number) =>
    fetchWithAuth<Goal>(
      `/finance/goals/${encodeURIComponent(id)}/pause${buildQuery({ version })}`,
      { method: 'POST' },
    ),

  resumeGoal: (id: string, version: number) =>
    fetchWithAuth<Goal>(
      `/finance/goals/${encodeURIComponent(id)}/resume${buildQuery({ version })}`,
      { method: 'POST' },
    ),

  cancelGoal: (id: string, version: number) =>
    fetchWithAuth<Goal>(
      `/finance/goals/${encodeURIComponent(id)}/cancel${buildQuery({ version })}`,
      { method: 'POST' },
    ),

  archiveGoal: (id: string, version: number) =>
    fetchWithAuth<Goal>(
      `/finance/goals/${encodeURIComponent(id)}/archive${buildQuery({ version })}`,
      { method: 'POST' },
    ),

  // Contributions — list/edit/delete are per-goal only, there is no
  // cross-goal aggregate route.
  getGoalContributions: (
    goalId: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) =>
    fetchWithAuth<PaginatedResponse<GoalContribution> | GoalContribution[]>(
      `/finance/goals/${encodeURIComponent(goalId)}/contributions${buildQuery(params)}`,
    ),

  recordGoalContribution: (goalId: string, data: Record<string, unknown>) =>
    fetchWithAuth<GoalContribution>(`/finance/goals/${encodeURIComponent(goalId)}/contributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGoalContribution: (
    goalId: string,
    contributionId: string,
    data: Record<string, unknown>,
    expectedVersion: number,
  ) =>
    fetchWithAuth<GoalContribution>(
      `/finance/goals/${encodeURIComponent(goalId)}/contributions/${encodeURIComponent(contributionId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ ...data, expectedVersion }),
      },
    ),

  deleteGoalContribution: (goalId: string, contributionId: string, version: number) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/goals/${encodeURIComponent(goalId)}/contributions/${encodeURIComponent(contributionId)}${buildQuery({ version })}`,
      { method: 'DELETE' },
    ),

  // Milestones — list/edit/delete are per-goal only, there is no cross-goal
  // aggregate route.
  getGoalMilestones: (goalId: string) =>
    fetchWithAuth<PaginatedResponse<GoalMilestone> | GoalMilestone[]>(
      `/finance/goals/${encodeURIComponent(goalId)}/milestones`,
    ),

  addGoalMilestone: (goalId: string, data: Record<string, unknown>) =>
    fetchWithAuth<GoalMilestone>(`/finance/goals/${encodeURIComponent(goalId)}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGoalMilestone: (
    goalId: string,
    milestoneId: string,
    data: Record<string, unknown>,
    expectedVersion: number,
  ) =>
    fetchWithAuth<GoalMilestone>(
      `/finance/goals/${encodeURIComponent(goalId)}/milestones/${encodeURIComponent(milestoneId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ ...data, expectedVersion }),
      },
    ),

  deleteGoalMilestone: (goalId: string, milestoneId: string, version: number) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/goals/${encodeURIComponent(goalId)}/milestones/${encodeURIComponent(milestoneId)}${buildQuery({ version })}`,
      { method: 'DELETE' },
    ),

  // Forecast, Projection & Analytics — per-goal only, no cross-goal
  // aggregate route exists on the backend.
  getGoalForecast: (goalId: string) =>
    fetchWithAuth<GoalForecast>(`/finance/goals/${encodeURIComponent(goalId)}/forecast`),

  getGoalAnalytics: (goalId: string) =>
    fetchWithAuth<GoalAnalytics>(`/finance/goals/${encodeURIComponent(goalId)}/analytics`),

  getGoalProjection: (goalId: string) =>
    fetchWithAuth<GoalProjection>(`/finance/goals/${encodeURIComponent(goalId)}/projection`),

  // Templates
  getGoalTemplates: () =>
    fetchWithAuth<GoalTemplate[] | PaginatedResponse<GoalTemplate>>('/finance/goals/templates'),

  createGoalTemplate: (data: Partial<GoalTemplate>) =>
    fetchWithAuth<GoalTemplate>('/finance/goals/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGoalTemplate: (templateId: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/goals/templates/${encodeURIComponent(templateId)}`,
      {
        method: 'DELETE',
      },
    ),

  applyGoalTemplate: (templateId: string, data?: Partial<CreateGoalInput>) =>
    fetchWithAuth<Goal>(`/finance/goals/templates/${encodeURIComponent(templateId)}/apply`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  // Documents — list/delete are per-goal only. This registers metadata for
  // an already-uploaded file (storageKey points at wherever the file was
  // actually uploaded via the platform's storage service) — it does not
  // accept raw file bytes.
  getGoalDocuments: (goalId: string) =>
    fetchWithAuth<GoalDocument[] | PaginatedResponse<GoalDocument>>(
      `/finance/goals/${encodeURIComponent(goalId)}/documents`,
    ),

  registerGoalDocument: (
    goalId: string,
    data: {
      category: string;
      fileName: string;
      storageKey: string;
      mimeType: string;
      sizeBytes: number;
      notes?: string;
    },
  ) =>
    fetchWithAuth<GoalDocument>(`/finance/goals/${encodeURIComponent(goalId)}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGoalDocument: (goalId: string, documentId: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/goals/${encodeURIComponent(goalId)}/documents/${encodeURIComponent(documentId)}`,
      { method: 'DELETE' },
    ),

  // Beneficiaries
  getGoalBeneficiaries: (goalId: string) =>
    fetchWithAuth<GoalBeneficiary[] | PaginatedResponse<GoalBeneficiary>>(
      `/finance/goals/${encodeURIComponent(goalId)}/beneficiaries`,
    ),

  addGoalBeneficiary: (goalId: string, data: Partial<GoalBeneficiary>) =>
    fetchWithAuth<GoalBeneficiary>(`/finance/goals/${encodeURIComponent(goalId)}/beneficiaries`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGoalBeneficiary: (
    goalId: string,
    beneficiaryId: string,
    data: Partial<GoalBeneficiary>,
    expectedVersion: number,
  ) =>
    fetchWithAuth<GoalBeneficiary>(
      `/finance/goals/${encodeURIComponent(goalId)}/beneficiaries/${encodeURIComponent(beneficiaryId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ ...data, expectedVersion }),
      },
    ),

  deleteGoalBeneficiary: (goalId: string, beneficiaryId: string, version: number) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/goals/${encodeURIComponent(goalId)}/beneficiaries/${encodeURIComponent(beneficiaryId)}${buildQuery({ version })}`,
      { method: 'DELETE' },
    ),

  // Subscriptions
  getSubscriptions: (params?: { limit?: number }) =>
    fetchWithAuth<
      PaginatedResponse<{
        id: string;
        name: string;
        amount: Money;
        billingCycle: string;
        nextDueDate: string;
        status: string;
      }>
    >(`/finance/subscriptions${buildQuery(params)}`),
  confirmSubscription: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/subscriptions/${encodeURIComponent(id)}/confirm${buildQuery({ version })}`,
      {
        method: 'POST',
      },
    ),
  updateSubscription: (
    id: string,
    data: Partial<{ name: string; amount: Money; status: string }>,
  ) =>
    fetchWithAuth<{ id: string }>(`/finance/subscriptions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Calendar & Financial Events
  getCalendar: (params?: { from?: string; to?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (typeof params?.from === 'string' && params.from.includes('-')) {
      cleanParams.from = params.from;
    }
    if (typeof params?.to === 'string' && params.to.includes('-')) {
      cleanParams.to = params.to;
    }
    return fetchWithAuth<CalendarEventItem[]>(`/finance/calendar${buildQuery(cleanParams)}`);
  },
  getFinancialCalendar: (params?: { from?: string; to?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (typeof params?.from === 'string' && params.from.includes('-')) {
      cleanParams.from = params.from;
    }
    if (typeof params?.to === 'string' && params.to.includes('-')) {
      cleanParams.to = params.to;
    }
    return fetchWithAuth<CalendarEventItem[]>(`/finance/calendar${buildQuery(cleanParams)}`);
  },
  getUpcomingEvents: (params?: { from?: string; to?: string }) => {
    const cleanParams: Record<string, string> = {};
    if (typeof params?.from === 'string' && params.from.includes('-')) {
      cleanParams.from = params.from;
    }
    if (typeof params?.to === 'string' && params.to.includes('-')) {
      cleanParams.to = params.to;
    }
    return fetchWithAuth<CalendarEventItem[]>(`/finance/calendar${buildQuery(cleanParams)}`);
  },

  // Notifications
  getNotifications: (params?: { limit?: number }) =>
    fetchWithAuth<
      PaginatedResponse<{
        id: string;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: string;
      }>
    >(`/finance/notifications${buildQuery(params)}`),
  getUnreadNotifications: () =>
    fetchWithAuth<
      | PaginatedResponse<{
          id: string;
          title: string;
          message: string;
          isRead: boolean;
          createdAt: string;
        }>
      | Array<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>
    >('/finance/notifications/unread'),
  getNotificationPreferences: () =>
    fetchWithAuth<Record<string, boolean>>('/finance/notifications/preferences'),
  updateNotificationPreferences: (preferences: Record<string, boolean>) =>
    fetchWithAuth<Record<string, boolean>>('/finance/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    }),
  markNotificationRead: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/finance/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    }),
  archiveNotification: (id: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/notifications/${encodeURIComponent(id)}/archive`,
      {
        method: 'POST',
      },
    ),
  dismissNotification: (id: string) =>
    fetchWithAuth<{ success: boolean }>(
      `/finance/notifications/${encodeURIComponent(id)}/dismiss`,
      {
        method: 'POST',
      },
    ),

  // Search
  search: (q: string) =>
    fetchWithAuth<PaginatedResponse<SearchResultItem> | SearchResultItem[]>(
      `/finance/search${buildQuery({ q })}`,
    ),
};
