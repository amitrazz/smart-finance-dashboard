import { fetchWithAuth } from "./client";
import {
  Account,
  Budget,
  CalendarItem,
  CashFlowSnapshot,
  FinancialHealthScore,
  Goal,
  Holding,
  ImportJob,
  ImportRowStaging,
  Insight,
  Loan,
  EmiSchedule,
  Money,
  NetWorthSnapshot,
  OnboardingProgress,
  BootstrapOnboardingPayload,
  Portfolio,
  SearchResultItem,
  Trade,
  Transaction,
  CreateTransactionInput,
  UserSettings,
  Category,
  FinancialInstitution,
  CreditCard,
  InvestmentReturnsResponse,
  AssetAllocationResponse,
  DebtBreakdownResponse,
  IncomeTrendResponse,
  RetirementForecastResponse,
} from "../../types";

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

export interface DashboardResponse {
  netWorth?: Money;
  cashPosition?: Money;
  thisMonthSpend?: Money;
  monthlySpend?: Money;
  monthlyIncome?: Money;
  financialHealthScore?: number;
  healthScore?: number;
  savingsRate?: number;
  recentTransactions?: Transaction[];
  upcomingBills?: CalendarItem[];
  topInsights?: Insight[];
  insights?: Insight[];
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    fetchWithAuth<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; name?: string }) =>
    fetchWithAuth<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => fetchWithAuth<{ success: boolean }>("/auth/logout", { method: "POST" }),

  // Settings
  getSettings: () => fetchWithAuth<UserSettings>("/finance/settings"),
  updateSettings: (data: Partial<UserSettings>) =>
    fetchWithAuth<UserSettings>("/finance/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Onboarding
  getOnboardingProgress: () => fetchWithAuth<OnboardingProgress>("/finance/onboarding"),
  bootstrapOnboarding: (payload: BootstrapOnboardingPayload) =>
    fetchWithAuth<OnboardingProgress>("/finance/onboarding/bootstrap", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  completeOnboardingStep: (stepId: string) =>
    fetchWithAuth<OnboardingProgress>(`/finance/onboarding/steps/${encodeURIComponent(stepId)}/complete`, {
      method: "POST",
    }),

  // Institutions
  getInstitutions: (params?: { search?: string; limit?: number }) =>
    fetchWithAuth<PaginatedResponse<FinancialInstitution>>(`/finance/institutions${buildQuery(params)}`),
  getInstitution: (id: string) => fetchWithAuth<FinancialInstitution>(`/finance/institutions/${encodeURIComponent(id)}`),
  createInstitution: (data: Partial<FinancialInstitution>) =>
    fetchWithAuth<FinancialInstitution>("/finance/institutions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Accounts
  getAccounts: (params?: { limit?: number; search?: string; type?: string }) =>
    fetchWithAuth<PaginatedResponse<Account>>(`/finance/accounts${buildQuery(params)}`),
  createAccount: (data: Partial<Account>) =>
    fetchWithAuth<Account>("/finance/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAccount: (id: string) => fetchWithAuth<Account>(`/finance/accounts/${encodeURIComponent(id)}`),
  updateAccount: (id: string, data: Partial<Account>, version = 1) =>
    fetchWithAuth<Account>(`/finance/accounts/${encodeURIComponent(id)}${buildQuery({ version })}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAccount: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(`/finance/accounts/${encodeURIComponent(id)}${buildQuery({ version })}`, {
      method: "DELETE",
    }),
  getAccountBalanceHistory: (id: string, params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ date: string; balance: Money }>>(
      `/finance/accounts/${encodeURIComponent(id)}/balance-history${buildQuery(params)}`
    ),

  // Transactions
  getTransactions: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchWithAuth<PaginatedResponse<Transaction>>(`/finance/transactions${buildQuery(params)}`),
  createTransaction: (data: CreateTransactionInput) =>
    fetchWithAuth<Transaction>("/finance/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTransaction: (id: string) => fetchWithAuth<Transaction>(`/finance/transactions/${encodeURIComponent(id)}`),
  updateTransaction: (id: string, data: Partial<Transaction>, version = 1) =>
    fetchWithAuth<Transaction>(`/finance/transactions/${encodeURIComponent(id)}${buildQuery({ version })}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(`/finance/transactions/${encodeURIComponent(id)}${buildQuery({ version })}`, {
      method: "DELETE",
    }),
  bulkCategorizeTransactions: (data: { transactionIds: string[]; categoryId: string }) =>
    fetchWithAuth<{ updatedCount: number }>("/finance/transactions/bulk-categorize", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Categories
  getCategories: () => fetchWithAuth<PaginatedResponse<Category> | Category[]>("/finance/categories"),
  createCategory: (data: Partial<Category>) =>
    fetchWithAuth<Category>("/finance/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Imports
  getImportJobs: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<ImportJob>>(`/finance/imports${buildQuery(params)}`),
  getReviewQueue: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<ImportRowStaging>>(`/finance/imports/review-queue${buildQuery(params)}`),
  getImportJob: (id: string) => fetchWithAuth<ImportJob>(`/finance/imports/${encodeURIComponent(id)}`),
  getImportPreview: (id: string, params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<ImportRowStaging>>(`/finance/imports/${encodeURIComponent(id)}/preview${buildQuery(params)}`),
  uploadImportFile: (formData: FormData) =>
    fetchWithAuth<ImportJob>("/finance/imports", {
      method: "POST",
      body: formData,
    }),
  confirmColumnMapping: (id: string, mapping: Record<string, string>) =>
    fetchWithAuth<ImportJob>(`/finance/imports/${encodeURIComponent(id)}/column-mapping`, {
      method: "POST",
      body: JSON.stringify(mapping),
      timeoutMs: 300000,
    }),
  updateImportRow: (jobId: string, rowId: string, data: Partial<ImportRowStaging>) =>
    fetchWithAuth<ImportRowStaging>(`/finance/imports/${encodeURIComponent(jobId)}/rows/${encodeURIComponent(rowId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  commitImport: (id: string) =>
    fetchWithAuth<{ success: boolean; importedCount: number }>(`/finance/imports/${encodeURIComponent(id)}/commit`, {
      method: "POST",
    }),
  retryImport: (id: string) =>
    fetchWithAuth<ImportJob>(`/finance/imports/${encodeURIComponent(id)}/retry`, {
      method: "POST",
    }),
  rollbackImport: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/finance/imports/${encodeURIComponent(id)}/rollback`, {
      method: "POST",
    }),

  // Documents
  getDocuments: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; name: string; size: number; uploadedAt: string }>>(`/finance/documents${buildQuery(params)}`),
  getDocument: (id: string) => fetchWithAuth<{ id: string; name: string; size: number; contentUrl?: string }>(`/finance/documents/${encodeURIComponent(id)}`),
  downloadDocument: (id: string) => fetchWithAuth<Blob>(`/finance/documents/${encodeURIComponent(id)}/download`),

  // Investments
  getHoldings: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Holding>>(`/finance/investments/holdings${buildQuery(params)}`),
  getTrades: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Trade>>(`/finance/investments/trades${buildQuery(params)}`),
  createTrade: (data: Partial<Trade>) =>
    fetchWithAuth<Trade>("/finance/investments/trades", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSIPs: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; name: string; amount: Money; frequency: string; status: string }>>(
      `/finance/investments/sips${buildQuery(params)}`
    ),

  // Portfolio
  getPortfolios: () => fetchWithAuth<PaginatedResponse<Portfolio> | Portfolio[]>("/finance/portfolio"),
  getPortfolio: (id: string) => fetchWithAuth<Portfolio>(`/finance/portfolio/${encodeURIComponent(id)}`),
  getPortfolioHistory: (id: string, params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ date: string; value: Money }>>(`/finance/portfolio/${encodeURIComponent(id)}/history${buildQuery(params)}`),

  // Loans
  getLoans: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Loan>>(`/finance/loans${buildQuery(params)}`),
  createLoan: (data: Partial<Loan>) =>
    fetchWithAuth<Loan>("/finance/loans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLoan: (id: string) => fetchWithAuth<Loan>(`/finance/loans/${encodeURIComponent(id)}`),
  getEmiSchedule: (id: string) =>
    fetchWithAuth<PaginatedResponse<EmiSchedule> | EmiSchedule[]>(`/finance/loans/${encodeURIComponent(id)}/emi-schedule`),
  markEmiPaid: (loanId: string, emiId: string) =>
    fetchWithAuth<EmiSchedule>(`/finance/loans/${encodeURIComponent(loanId)}/emi-schedule/${encodeURIComponent(emiId)}/mark-paid`, {
      method: "POST",
    }),

  // Credit Cards
  getCreditCards: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<CreditCard>>(`/finance/credit-cards${buildQuery(params)}`),
  createCreditCard: (data: Partial<CreditCard>) =>
    fetchWithAuth<CreditCard>("/finance/credit-cards", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCardStatements: (cardId: string, params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; statementDate: string; totalAmountDue: Money; dueDate: string }>>(
      `/finance/credit-cards/${encodeURIComponent(cardId)}/statements${buildQuery(params)}`
    ),
  getCardTransactions: (cardId: string, params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Transaction>>(`/finance/credit-cards/${encodeURIComponent(cardId)}/transactions${buildQuery(params)}`),

  // Liabilities
  getLiabilities: () => fetchWithAuth<PaginatedResponse<{ id: string; name: string; type: string; amount: Money }>>("/finance/liabilities"),
  getLiabilitiesSummary: () =>
    fetchWithAuth<{ totalLiabilities: Money; loansTotal: Money; creditCardsTotal: Money }>("/finance/liabilities/summary"),

  // Analytics
  getNetWorth: () => fetchWithAuth<NetWorthSnapshot>("/finance/net-worth"),
  getNetWorthHistory: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<NetWorthSnapshot>>(`/finance/net-worth/history${buildQuery(params)}`),
  getCashFlow: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<CashFlowSnapshot>>(`/finance/analytics/cash-flow${buildQuery(params)}`),
  getInvestmentReturns: () => fetchWithAuth<InvestmentReturnsResponse>("/finance/analytics/investment-returns"),
  getAssetAllocation: () => fetchWithAuth<AssetAllocationResponse>("/finance/analytics/asset-allocation"),
  getDebtBreakdown: () => fetchWithAuth<DebtBreakdownResponse>("/finance/analytics/debt-breakdown"),
  getIncomeTrend: (params?: { limit?: number; dateFrom?: string; dateTo?: string }) =>
    fetchWithAuth<IncomeTrendResponse | PaginatedResponse<{ date: string; amount: Money }>>(`/finance/analytics/income-trend${buildQuery(params)}`),
  getExpenseTrendAnalytics: (params?: { limit?: number; dateFrom?: string; dateTo?: string }) =>
    fetchWithAuth<PaginatedResponse<{ month: string; amount: Money }>>(`/finance/analytics/expense-trend${buildQuery(params)}`),
  getRetirementForecast: (params?: { currentAge?: number; retirementAge?: number; expectedReturnPercent?: string }) =>
    fetchWithAuth<RetirementForecastResponse>(`/finance/analytics/retirement-forecast${buildQuery(params)}`),

  // Insights
  getInsights: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Insight>>(`/finance/insights${buildQuery(params)}`),
  dismissInsight: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(`/finance/insights/${encodeURIComponent(id)}/dismiss${buildQuery({ version })}`, {
      method: "POST",
    }),

  // Financial Health & Dashboard
  getFinancialHealth: () => fetchWithAuth<FinancialHealthScore>("/finance/financial-health"),
  getFinancialHealthHistory: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<FinancialHealthScore>>(`/finance/financial-health/history${buildQuery(params)}`),
  getDashboard: () => fetchWithAuth<DashboardResponse>("/finance/dashboard"),

  // Expenses
  getExpensesByCategory: () =>
    fetchWithAuth<Array<{ categoryId: string; categoryName: string; amount: Money; percentage: number }>>("/finance/expenses/by-category"),
  getExpensesByMerchant: () =>
    fetchWithAuth<Array<{ merchantId: string; merchantName: string; amount: Money }>>("/finance/expenses/by-merchant"),
  getExpenseTrend: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ month: string; amount: Money }>>(`/finance/expenses/trend${buildQuery(params)}`),

  // Income
  getIncomeSources: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; name: string; expectedAmount: Money; frequency: string }>>(
      `/finance/income/sources${buildQuery(params)}`
    ),
  createIncomeSource: (data: Partial<{ name: string; expectedAmount: string | Money; frequency: string }>) =>
    fetchWithAuth<{ id: string; name: string }>("/finance/income/sources", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getIncomeRecords: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; sourceName: string; amount: Money; date: string }>>(`/finance/income/records${buildQuery(params)}`),
  recordIncome: (data: Partial<{ sourceId: string; amount: string | Money; date: string }>) =>
    fetchWithAuth<{ id: string; success: boolean }>("/finance/income/records", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Budgets
  getBudgets: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Budget>>(`/finance/budgets${buildQuery(params)}`),
  createBudget: (data: Partial<Budget>) =>
    fetchWithAuth<Budget>("/finance/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getBudgetProgress: (id: string) => fetchWithAuth<{ budgetId: string; spent: Money; remaining: Money; percentSpent: number }>(`/finance/budgets/${encodeURIComponent(id)}/progress`),

  // Goals
  getGoals: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<Goal>>(`/finance/goals${buildQuery(params)}`),
  createGoal: (data: Partial<Goal>) =>
    fetchWithAuth<Goal>("/finance/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  recordGoalContribution: (goalId: string, data: { amount: string | Money; date?: string }) =>
    fetchWithAuth<Goal>(`/finance/goals/${encodeURIComponent(goalId)}/contributions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getGoalForecast: (goalId: string) =>
    fetchWithAuth<{ forecastCompletionDate: string; onTrack: boolean }>(`/finance/goals/${encodeURIComponent(goalId)}/forecast`),

  // Subscriptions
  getSubscriptions: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; name: string; amount: Money; billingCycle: string; nextDueDate: string; status: string }>>(
      `/finance/subscriptions${buildQuery(params)}`
    ),
  confirmSubscription: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(`/finance/subscriptions/${encodeURIComponent(id)}/confirm${buildQuery({ version })}`, {
      method: "POST",
    }),
  updateSubscription: (id: string, data: Partial<{ name: string; amount: Money; status: string }>) =>
    fetchWithAuth<{ id: string }>(`/finance/subscriptions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Calendar
  getCalendar: () => fetchWithAuth<PaginatedResponse<CalendarItem> | CalendarItem[]>("/finance/calendar"),

  // Notifications
  getNotifications: (params?: { limit?: number }) =>
    fetchWithAuth<PaginatedResponse<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>>(
      `/finance/notifications${buildQuery(params)}`
    ),
  getNotificationPreferences: () => fetchWithAuth<Record<string, boolean>>("/finance/notifications/preferences"),
  updateNotificationPreferences: (preferences: Record<string, boolean>) =>
    fetchWithAuth<Record<string, boolean>>("/finance/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    }),
  markNotificationRead: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/finance/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
    }),

  // Search
  search: (q: string) => fetchWithAuth<PaginatedResponse<SearchResultItem> | SearchResultItem[]>(`/finance/search${buildQuery({ q })}`),
};
