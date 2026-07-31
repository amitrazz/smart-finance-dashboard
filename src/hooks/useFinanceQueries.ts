import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { getAccessToken } from "../services/api/client";
import { Money, UserSettings, Account, Transaction, CreateTransactionInput, Budget, Goal, Loan, Trade, Category, FinancialInstitution, CreditCard, ImportRowStaging, Holding, Portfolio, EmiSchedule, Insight, FinancialHealthScore, NetWorthSnapshot, CashFlowSnapshot, CalendarItem, SearchResultItem, ImportJob, BootstrapOnboardingPayload } from "../types";
import { useUIStore } from "../store/useUIStore";

const getErrorMessage = (err: unknown): string => {
  if (err !== null && typeof err === "object") {
    if ("userMessage" in err) return String((err as { userMessage: unknown }).userMessage);
    if ("message" in err) return String((err as { message: unknown }).message);
  }
  return "An unexpected error occurred. Please try again.";
};

const isAuth = () => Boolean(getAccessToken());

const unwrapList = <T>(res: unknown): T[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (typeof res === "object" && res !== null && "data" in res && Array.isArray((res as { data: unknown }).data)) {
    return (res as { data: T[] }).data;
  }
  return [];
};

export const QUERY_KEYS = {
  settings: ["settings"],
  onboarding: ["onboarding"],
  institutions: (params?: Record<string, unknown>) => ["institutions", params],
  institution: (id: string) => ["institutions", id],
  accounts: (params?: Record<string, unknown>) => ["accounts", params],
  account: (id: string) => ["accounts", id],
  accountHistory: (id: string, params?: Record<string, unknown>) => ["accounts", id, "history", params],
  transactions: (params?: Record<string, unknown>) => ["transactions", params],
  transaction: (id: string) => ["transactions", id],
  categories: ["categories"],
  imports: (params?: Record<string, unknown>) => ["imports", params],
  reviewQueue: (params?: Record<string, unknown>) => ["reviewQueue", params],
  importJob: (id: string) => ["imports", id],
  importPreview: (id: string, params?: Record<string, unknown>) => ["imports", id, "preview", params],
  documents: (params?: Record<string, unknown>) => ["documents", params],
  document: (id: string) => ["documents", id],
  holdings: (params?: Record<string, unknown>) => ["holdings", params],
  trades: (params?: Record<string, unknown>) => ["trades", params],
  sips: (params?: Record<string, unknown>) => ["sips", params],
  portfolios: ["portfolios"],
  portfolioDetail: (id: string) => ["portfolios", id],
  portfolioHistory: (id: string, params?: Record<string, unknown>) => ["portfolios", id, "history", params],
  loans: (params?: Record<string, unknown>) => ["loans", params],
  loanDetail: (id: string) => ["loans", id],
  emiSchedule: (id: string) => ["loans", id, "emiSchedule"],
  creditCards: (params?: Record<string, unknown>) => ["creditCards", params],
  cardStatements: (cardId: string, params?: Record<string, unknown>) => ["creditCards", cardId, "statements", params],
  cardTransactions: (cardId: string, params?: Record<string, unknown>) => ["creditCards", cardId, "transactions", params],
  liabilities: ["liabilities"],
  liabilitiesSummary: ["liabilitiesSummary"],
  netWorth: ["netWorth"],
  netWorthHistory: (params?: Record<string, unknown>) => ["netWorthHistory", params],
  cashFlow: (params?: Record<string, unknown>) => ["cashFlow", params],
  investmentReturns: ["investmentReturns"],
  assetAllocation: ["assetAllocation"],
  debtBreakdown: ["debtBreakdown"],
  incomeTrend: (params?: Record<string, unknown>) => ["incomeTrend", params],
  expenseTrendAnalytics: (params?: Record<string, unknown>) => ["expenseTrendAnalytics", params],
  retirementForecast: (params?: Record<string, unknown>) => ["retirementForecast", params],
  insights: (params?: Record<string, unknown>) => ["insights", params],
  financialHealth: ["financialHealth"],
  financialHealthHistory: (params?: Record<string, unknown>) => ["financialHealthHistory", params],
  dashboard: ["dashboard"],
  expensesByCategory: ["expensesByCategory"],
  expensesByMerchant: ["expensesByMerchant"],
  expenseTrend: (params?: Record<string, unknown>) => ["expenseTrend", params],
  incomeSources: (params?: Record<string, unknown>) => ["incomeSources", params],
  incomeRecords: (params?: Record<string, unknown>) => ["incomeRecords", params],
  budgets: (params?: Record<string, unknown>) => ["budgets", params],
  budgetProgress: (id: string) => ["budgets", id, "progress"],
  goals: (params?: Record<string, unknown>) => ["goals", params],
  goalForecast: (id: string) => ["goals", id, "forecast"],
  subscriptions: (params?: Record<string, unknown>) => ["subscriptions", params],
  calendar: ["calendar"],
  notifications: (params?: Record<string, unknown>) => ["notifications", params],
  notificationPreferences: ["notificationPreferences"],
  search: (q: string) => ["search", q],
};

// Settings
export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => api.getSettings(),
    enabled: isAuth(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
      useUIStore.getState().showToast("Settings updated successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Onboarding
export function useOnboardingProgress() {
  return useQuery({
    queryKey: QUERY_KEYS.onboarding,
    queryFn: () => api.getOnboardingProgress(),
    enabled: isAuth(),
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => api.completeOnboardingStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding });
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useBootstrapOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BootstrapOnboardingPayload) => api.bootstrapOnboarding(payload),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Institutions
export function useInstitutions(params?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.institutions(params),
    queryFn: () => api.getInstitutions(params),
    enabled: isAuth(),
    select: (res) => unwrapList<FinancialInstitution>(res),
  });
}

export function useInstitution(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.institution(id),
    queryFn: () => api.getInstitution(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FinancialInstitution>) => api.createInstitution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      useUIStore.getState().showToast("Institution created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Dashboard & Health
export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => api.getDashboard(),
    enabled: isAuth(),
  });
}

export function useFinancialHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.financialHealth,
    queryFn: () => api.getFinancialHealth(),
    enabled: isAuth(),
  });
}

export function useFinancialHealthHistory(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.financialHealthHistory(params),
    queryFn: () => api.getFinancialHealthHistory(params),
    enabled: isAuth(),
    select: (res) => unwrapList<FinancialHealthScore>(res),
  });
}

// Accounts
export function useAccounts(params?: { limit?: number; search?: string; type?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.accounts(params),
    queryFn: () => api.getAccounts(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Account>(res),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.account(id),
    queryFn: () => api.getAccount(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useAccountBalanceHistory(id: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.accountHistory(id, params),
    queryFn: () => api.getAccountBalanceHistory(id, params),
    enabled: isAuth() && Boolean(id),
    select: (res) => unwrapList<{ date: string; balance: Money }>(res),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Account>) => api.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
      useUIStore.getState().showToast("Account created successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version }: { id: string; data: Partial<Account>; version?: number }) =>
      api.updateAccount(id, data, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Account updated successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) => api.deleteAccount(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Account deleted successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Transactions
export function useTransactions(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(params),
    queryFn: () => api.getTransactions(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Transaction>(res),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.transaction(id),
    queryFn: () => api.getTransaction(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) => api.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Transaction added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version }: { id: string; data: Partial<Transaction>; version?: number }) =>
      api.updateTransaction(id, data, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Transaction updated successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) => api.deleteTransaction(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Transaction deleted successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useBulkCategorizeTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { transactionIds: string[]; categoryId: string }) => api.bulkCategorizeTransactions(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      useUIStore.getState().showToast(`Categorized ${res.updatedCount || "selected"} transactions`, "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export const useBulkCategorize = useBulkCategorizeTransactions;

// Categories
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => api.getCategories(),
    enabled: isAuth(),
    select: (res) => unwrapList<Category>(res),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      useUIStore.getState().showToast("Category created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Imports & Documents
export function useImportJobs(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.imports(params),
    queryFn: () => api.getImportJobs(params),
    enabled: isAuth(),
    select: (res) => unwrapList<ImportJob>(res),
  });
}

export function useReviewQueue(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.reviewQueue(params),
    queryFn: () => api.getReviewQueue(params),
    enabled: isAuth(),
    select: (res) => unwrapList<ImportRowStaging>(res),
  });
}

export function useImportJob(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.importJob(id),
    queryFn: () => api.getImportJob(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useImportPreview(id: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.importPreview(id, params),
    queryFn: () => api.getImportPreview(id, params),
    enabled: isAuth() && Boolean(id),
    select: (res) => unwrapList<ImportRowStaging>(res),
  });
}

export function useUploadImportFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadImportFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      useUIStore.getState().showToast("Statement uploaded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useConfirmColumnMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mapping }: { id: string; mapping: Record<string, string> }) =>
      api.confirmColumnMapping(id, mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      useUIStore.getState().showToast("Mapping confirmed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateImportRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, rowId, data }: { jobId: string; rowId: string; data: Partial<ImportRowStaging> }) =>
      api.updateImportRow(jobId, rowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
      useUIStore.getState().showToast("Row updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCommitImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.commitImport(id),
    onSuccess: () => {
      queryClient.invalidateQueries();
      useUIStore.getState().showToast("Import committed to workspace", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRetryImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.retryImport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      useUIStore.getState().showToast("Retrying import job...", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRollbackImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rollbackImport(id),
    onSuccess: () => {
      queryClient.invalidateQueries();
      useUIStore.getState().showToast("Import job rolled back", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDocuments(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.documents(params),
    queryFn: () => api.getDocuments(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; name: string; size: number; uploadedAt: string }>(res),
  });
}

// Investments & Portfolio
export function useHoldings(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.holdings(params),
    queryFn: () => api.getHoldings(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Holding>(res),
  });
}

export function useTrades(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.trades(params),
    queryFn: () => api.getTrades(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Trade>(res),
  });
}

export function useCreateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Trade>) => api.createTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      useUIStore.getState().showToast("Trade recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useSIPs(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.sips(params),
    queryFn: () => api.getSIPs(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; name: string; amount: Money; frequency: string; status: string }>(res),
  });
}

export function usePortfolios() {
  return useQuery({
    queryKey: QUERY_KEYS.portfolios,
    queryFn: () => api.getPortfolios(),
    enabled: isAuth(),
    select: (res) => unwrapList<Portfolio>(res),
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioDetail(id),
    queryFn: () => api.getPortfolio(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function usePortfolioHistory(id: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioHistory(id, params),
    queryFn: () => api.getPortfolioHistory(id, params),
    enabled: isAuth() && Boolean(id),
    select: (res) => unwrapList<{ date: string; value: Money }>(res),
  });
}

// Loans & Credit Cards & Liabilities
export function useLoans(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.loans(params),
    queryFn: () => api.getLoans(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Loan>(res),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Loan>) => api.createLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["liabilities"] });
      useUIStore.getState().showToast("Loan added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.loanDetail(id),
    queryFn: () => api.getLoan(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useEmiSchedule(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.emiSchedule(id),
    queryFn: () => api.getEmiSchedule(id),
    enabled: isAuth() && Boolean(id),
    select: (res) => unwrapList<EmiSchedule>(res),
  });
}

export function useMarkEmiPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, emiId }: { loanId: string; emiId: string }) => api.markEmiPaid(loanId, emiId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emiSchedule(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      useUIStore.getState().showToast("EMI marked as paid", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCreditCards(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.creditCards(params),
    queryFn: () => api.getCreditCards(params),
    enabled: isAuth(),
    select: (res) => unwrapList<CreditCard>(res),
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreditCard>) => api.createCreditCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditCards"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      useUIStore.getState().showToast("Credit card added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCardStatements(cardId: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.cardStatements(cardId, params),
    queryFn: () => api.getCardStatements(cardId, params),
    enabled: isAuth() && Boolean(cardId),
    select: (res) => unwrapList<{ id: string; statementDate: string; totalAmountDue: Money; dueDate: string }>(res),
  });
}

export function useCardTransactions(cardId: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.cardTransactions(cardId, params),
    queryFn: () => api.getCardTransactions(cardId, params),
    enabled: isAuth() && Boolean(cardId),
    select: (res) => unwrapList<Transaction>(res),
  });
}

export function useLiabilities() {
  return useQuery({
    queryKey: QUERY_KEYS.liabilities,
    queryFn: () => api.getLiabilities(),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; name: string; type: string; amount: Money }>(res),
  });
}

export function useLiabilitiesSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.liabilitiesSummary,
    queryFn: () => api.getLiabilitiesSummary(),
    enabled: isAuth(),
  });
}

// Analytics & Insights
export function useNetWorth() {
  return useQuery({
    queryKey: QUERY_KEYS.netWorth,
    queryFn: () => api.getNetWorth(),
    enabled: isAuth(),
  });
}

export function useNetWorthHistory(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.netWorthHistory(params),
    queryFn: () => api.getNetWorthHistory(params),
    enabled: isAuth(),
    select: (res) => unwrapList<NetWorthSnapshot>(res),
  });
}

export function useCashFlowAnalytics(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.cashFlow(params),
    queryFn: () => api.getCashFlow(params),
    enabled: isAuth(),
    select: (res) => unwrapList<CashFlowSnapshot>(res),
  });
}

export function useInvestmentReturns() {
  return useQuery({
    queryKey: QUERY_KEYS.investmentReturns,
    queryFn: () => api.getInvestmentReturns(),
    enabled: isAuth(),
  });
}

export function useAssetAllocation() {
  return useQuery({
    queryKey: QUERY_KEYS.assetAllocation,
    queryFn: () => api.getAssetAllocation(),
    enabled: isAuth(),
  });
}

export function useDebtBreakdown() {
  return useQuery({
    queryKey: QUERY_KEYS.debtBreakdown,
    queryFn: () => api.getDebtBreakdown(),
    enabled: isAuth(),
  });
}

export function useIncomeTrend(params?: { limit?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeTrend(params),
    queryFn: () => api.getIncomeTrend(params),
    enabled: isAuth(),
  });
}

export function useExpenseTrendAnalytics(params?: { limit?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.expenseTrendAnalytics(params),
    queryFn: () => api.getExpenseTrendAnalytics(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ month: string; amount: Money }>(res),
  });
}

export function useRetirementForecast(params?: { currentAge?: number; retirementAge?: number; expectedReturnPercent?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.retirementForecast(params),
    queryFn: () => api.getRetirementForecast(params),
    enabled: isAuth(),
  });
}

export function useInsights(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.insights(params),
    queryFn: () => api.getInsights(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Insight>(res),
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (param: string | { id: string; version?: number }) => {
      const id = typeof param === "string" ? param : param.id;
      const version = typeof param === "string" ? 1 : param.version;
      return api.dismissInsight(id, version);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      useUIStore.getState().showToast("Insight dismissed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export const useDeleteInsight = useDismissInsight;

// Expenses & Income
export function useExpensesByCategory() {
  return useQuery({
    queryKey: QUERY_KEYS.expensesByCategory,
    queryFn: () => api.getExpensesByCategory(),
    enabled: isAuth(),
  });
}

export function useExpensesByMerchant() {
  return useQuery({
    queryKey: QUERY_KEYS.expensesByMerchant,
    queryFn: () => api.getExpensesByMerchant(),
    enabled: isAuth(),
  });
}

export function useExpenseTrend(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.expenseTrend(params),
    queryFn: () => api.getExpenseTrend(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ month: string; amount: Money }>(res),
  });
}

export function useIncomeSources(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeSources(params),
    queryFn: () => api.getIncomeSources(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; name: string; expectedAmount: Money; frequency: string }>(res),
  });
}

export function useCreateIncomeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ name: string; expectedAmount: string | Money; frequency: string }>) =>
      api.createIncomeSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeSources"] });
      useUIStore.getState().showToast("Income source created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useIncomeRecords(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeRecords(params),
    queryFn: () => api.getIncomeRecords(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; sourceName: string; amount: Money; date: string }>(res),
  });
}

export function useRecordIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ sourceId: string; amount: string | Money; date: string }>) =>
      api.recordIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Income recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Budgets
export function useBudgets(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.budgets(params),
    queryFn: () => api.getBudgets(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Budget>(res),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => api.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      useUIStore.getState().showToast("Budget created successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useBudgetProgress(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.budgetProgress(id),
    queryFn: () => api.getBudgetProgress(id),
    enabled: isAuth() && Boolean(id),
  });
}

// Goals
export function useGoals(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.goals(params),
    queryFn: () => api.getGoals(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Goal>(res),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => api.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      useUIStore.getState().showToast("Financial goal created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRecordGoalContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: { amount: string | Money; date?: string } }) =>
      api.recordGoalContribution(goalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      useUIStore.getState().showToast("Contribution recorded to goal", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useGoalForecast(goalId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.goalForecast(goalId),
    queryFn: () => api.getGoalForecast(goalId),
    enabled: isAuth() && Boolean(goalId),
  });
}

// Subscriptions & Calendar
export function useSubscriptions(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptions(params),
    queryFn: () => api.getSubscriptions(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; name: string; amount: Money; billingCycle: string; nextDueDate: string; status: string }>(res),
  });
}

export function useConfirmSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) => api.confirmSubscription(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      useUIStore.getState().showToast("Subscription confirmed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; amount: Money; status: string }> }) =>
      api.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      useUIStore.getState().showToast("Subscription updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCalendar() {
  return useQuery({
    queryKey: QUERY_KEYS.calendar,
    queryFn: () => api.getCalendar(),
    enabled: isAuth(),
    select: (res) => unwrapList<CalendarItem>(res),
  });
}

// Notifications
export function useNotifications(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(params),
    queryFn: () => api.getNotifications(params),
    enabled: isAuth(),
    select: (res) => unwrapList<{ id: string; title: string; message: string; isRead: boolean; createdAt: string }>(res),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: QUERY_KEYS.notificationPreferences,
    queryFn: () => api.getNotificationPreferences(),
    enabled: isAuth(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: Record<string, boolean>) => api.updateNotificationPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationPreferences });
      useUIStore.getState().showToast("Notification preferences updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Search
export function useSearch(q: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(q),
    queryFn: () => api.search(q),
    enabled: isAuth() && Boolean(q && q.trim().length >= 2),
    select: (res) => unwrapList<SearchResultItem>(res),
  });
}

export const useGlobalSearch = useSearch;
export const useCashFlow = useCashFlowAnalytics;
export const useAddGoalContribution = useRecordGoalContribution;
export const useImports = useImportJobs;
export const useUploadImport = useUploadImportFile;
