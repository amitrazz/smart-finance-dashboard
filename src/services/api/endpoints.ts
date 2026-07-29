import { fetchWithAuth, ApiError } from "./client";
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
  Portfolio,
  SearchResultItem,
  Trade,
  Transaction,
  UserSettings,
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
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface DashboardResponse {
  netWorth: Money;
  cashPosition: Money;
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

  // Onboarding
  getOnboardingProgress: () =>
    fetchWithAuth<OnboardingProgress>("/onboarding/progress").catch(() => ({
      completedCount: 0,
      totalCount: 4,
      isComplete: false,
      steps: [],
    })),

  completeOnboardingStep: (stepId: string) =>
    fetchWithAuth<OnboardingProgress>(`/onboarding/steps/${encodeURIComponent(stepId)}/complete`, {
      method: "POST",
    }),

  // Dashboard & Snapshots
  getDashboard: () => fetchWithAuth<DashboardResponse>("/dashboard"),

  getNetWorth: () => fetchWithAuth<NetWorthSnapshot>("/net-worth"),

  getNetWorthHistory: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<NetWorthSnapshot[] | PaginatedResponse<NetWorthSnapshot>>(`/net-worth/history${query}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []);
  },

  // Accounts
  getAccounts: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<Account[] | PaginatedResponse<Account>>(`/accounts${query}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []);
  },

  createAccount: (accountData: Record<string, unknown>) => {
    const openingBalance =
      accountData.openingBalance ||
      (accountData.currentBalance && typeof accountData.currentBalance === "object"
        ? (accountData.currentBalance as { amount?: string }).amount
        : undefined);

    const payload = {
      name: accountData.name,
      type: accountData.type,
      currency: accountData.currency || "INR",
      openingBalance: openingBalance !== undefined ? String(openingBalance) : undefined,
      institutionId: accountData.institutionId,
      maskedNumber: accountData.maskedNumber,
    };

    return fetchWithAuth<Account>("/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getAccount: (id: string) => fetchWithAuth<Account>(`/accounts/${id}`),

  updateAccount: (id: string, data: Partial<Account>, version = 1) =>
    fetchWithAuth<Account>(`/accounts/${id}?version=${version}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAccount: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(`/accounts/${id}?version=${version}`, {
      method: "DELETE",
    }),

  getAccountBalanceHistory: (id: string) =>
    fetchWithAuth<Array<{ date: string; balance: Money }>>(`/accounts/${id}/balance-history`).catch(() => []),

  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<PaginatedResponse<Transaction> | Transaction[]>(`/transactions${query}`)
      .then((res) => {
        if (Array.isArray(res)) {
          return { data: res, nextCursor: null, hasMore: false, totalCount: res.length };
        }
        return res || { data: [], nextCursor: null, hasMore: false, totalCount: 0 };
      })
      .catch(() => ({ data: [], nextCursor: null, hasMore: false, totalCount: 0 }));
  },

  createTransaction: (txn: Partial<Transaction>) =>
    fetchWithAuth<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(txn),
    }),

  getTransaction: (id: string) => fetchWithAuth<Transaction>(`/transactions/${id}`),

  updateTransaction: (id: string, data: Partial<Transaction>, version = 1) =>
    fetchWithAuth<Transaction>(`/transactions/${id}?version=${version}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: string, version = 1) =>
    fetchWithAuth<{ success: boolean }>(`/transactions/${id}?version=${version}`, {
      method: "DELETE",
    }),

  bulkCategorize: (transactionIds: string[], categoryId: string) =>
    fetchWithAuth<{ success: boolean }>("/transactions/bulk-categorize", {
      method: "POST",
      body: JSON.stringify({ transactionIds, categoryId }),
    }),

  // Imports
  getImports: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<ImportJob[] | PaginatedResponse<ImportJob>>(`/imports${query}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []);
  },

  uploadImportFile: (formData: FormData) =>
    fetchWithAuth<ImportJob>("/imports", {
      method: "POST",
      body: formData,
    }),

  getImportJob: (id: string) => fetchWithAuth<ImportJob>(`/imports/${id}`),

  getImportPreview: (id: string) =>
    fetchWithAuth<{ stagedRows: ImportRowStaging[] } | ImportRowStaging[]>(`/imports/${id}/preview`)
      .then((res) => (Array.isArray(res) ? { stagedRows: res } : res || { stagedRows: [] }))
      .catch(() => ({ stagedRows: [] })),

  confirmColumnMapping: (id: string, mapping: Record<string, number>) =>
    fetchWithAuth<{ success: boolean }>(`/imports/${id}/column-mapping`, {
      method: "POST",
      body: JSON.stringify(mapping),
    }),

  updateImportRow: (importJobId: string, rowId: string, data: Record<string, unknown>) =>
    fetchWithAuth<ImportRowStaging>(`/imports/${importJobId}/rows/${rowId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  commitImport: (id: string) =>
    fetchWithAuth<{ importedCount: number }>(`/imports/${id}/commit`, {
      method: "POST",
    }),

  retryImport: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/imports/${id}/retry`, {
      method: "POST",
    }),

  rollbackImport: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/imports/${id}/rollback`, {
      method: "POST",
    }),

  getReviewQueue: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<ImportRowStaging[] | PaginatedResponse<ImportRowStaging>>(`/imports/review-queue${query}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []);
  },

  // Budgets
  getBudgets: () =>
    fetchWithAuth<Budget[] | PaginatedResponse<Budget>>("/budgets")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  createBudget: (budget: Partial<Budget>) =>
    fetchWithAuth<Budget>("/budgets", {
      method: "POST",
      body: JSON.stringify(budget),
    }),

  getBudgetProgress: (id: string) => fetchWithAuth<Budget>(`/budgets/${id}/progress`),

  // Investments
  getHoldings: () =>
    fetchWithAuth<Holding[] | PaginatedResponse<Holding>>("/investments/holdings")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  getTrades: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<Trade[] | PaginatedResponse<Trade>>(`/investments/trades${query}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []);
  },

  createTrade: (trade: Partial<Trade>) =>
    fetchWithAuth<Trade>("/investments/trades", {
      method: "POST",
      body: JSON.stringify(trade),
    }),

  getPortfolios: () =>
    fetchWithAuth<Portfolio[] | PaginatedResponse<Portfolio>>("/portfolio")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  getPortfolioDetail: (id: string) => fetchWithAuth<Portfolio>(`/portfolio/${id}`),

  getPortfolioHistory: (id: string) =>
    fetchWithAuth<Array<{ date: string; value: Money }>>(`/portfolio/${id}/history`).catch(() => []),

  // Loans & Debt
  getLoans: () =>
    fetchWithAuth<Loan[] | PaginatedResponse<Loan>>("/loans")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  createLoan: (loan: Partial<Loan>) =>
    fetchWithAuth<Loan>("/loans", {
      method: "POST",
      body: JSON.stringify(loan),
    }),

  getLoanDetail: (id: string) => fetchWithAuth<Loan>(`/loans/${id}`),

  getEmiSchedule: (loanId: string) =>
    fetchWithAuth<EmiSchedule[] | PaginatedResponse<EmiSchedule>>(`/loans/${loanId}/emi-schedule`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  markEmiPaid: (loanId: string, emiId: string) =>
    fetchWithAuth<{ success: boolean }>(`/loans/${loanId}/emi-schedule/${emiId}/mark-paid`, {
      method: "POST",
    }),

  // Goals
  getGoals: () =>
    fetchWithAuth<Goal[] | PaginatedResponse<Goal>>("/goals")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  createGoal: (goal: Partial<Goal>) =>
    fetchWithAuth<Goal>("/goals", {
      method: "POST",
      body: JSON.stringify(goal),
    }),

  addGoalContribution: (id: string, amount: Money) =>
    fetchWithAuth<Goal>(`/goals/${id}/contributions`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  getGoalForecast: (id: string) => fetchWithAuth<{ forecastCompletionDate: string }>(`/goals/${id}/forecast`),

  // Analytics & Health
  getCashFlow: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<CashFlowSnapshot | PaginatedResponse<CashFlowSnapshot>>(`/analytics/cash-flow${query}`).then((res) => {
      if (Array.isArray(res)) return res[0] || null;
      if (res && "data" in res && Array.isArray(res.data)) return res.data[0] || null;
      return res as CashFlowSnapshot;
    });
  },

  getFinancialHealth: () => fetchWithAuth<FinancialHealthScore>("/financial-health"),

  getFinancialHealthHistory: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchWithAuth<FinancialHealthScore[] | PaginatedResponse<FinancialHealthScore>>(`/financial-health/history${query}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []);
  },

  getInsights: () =>
    fetchWithAuth<Insight[] | PaginatedResponse<Insight>>("/insights")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch((err) => {
        if (err instanceof ApiError && err.statusCode === 404) {
          return [];
        }
        return [];
      }),

  dismissInsight: (id: string) =>
    fetchWithAuth<{ success: boolean }>(`/insights/${id}/dismiss`, {
      method: "POST",
    }),

  // Calendar, Search & Settings
  getCalendar: () =>
    fetchWithAuth<CalendarItem[] | PaginatedResponse<CalendarItem>>("/calendar")
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  globalSearch: (q: string) =>
    fetchWithAuth<SearchResultItem[] | PaginatedResponse<SearchResultItem>>(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => (Array.isArray(res) ? res : res?.data || []))
      .catch(() => []),

  getSettings: () => fetchWithAuth<UserSettings>("/settings"),

  updateSettings: (settings: Partial<UserSettings>) =>
    fetchWithAuth<UserSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),
};
