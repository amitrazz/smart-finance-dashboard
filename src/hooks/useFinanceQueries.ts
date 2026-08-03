import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { getAccessToken } from "../services/api/client";
import { Money, UserSettings, Account, Transaction, CreateTransactionInput, UpdateTransactionInput, Trade, Category, FinancialInstitution, ImportRowStaging, UpdateImportRowInput, Holding, Portfolio, SipPlan, RealizedGain, CreateTradeInput, PortfolioSnapshot, Insight, NetWorthSnapshot, CashFlowSnapshot, CalendarItem, SearchResultItem, ImportJob, CashPositionData, WalletAccount, FixedDeposit, InvestmentCashPosition, AccountTransfer, ReconciliationItem, AccountStatementItem } from "../types";
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
  if (typeof res === "object" && res !== null) {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.categories)) return obj.categories as T[];
    if (Array.isArray(obj.allocations)) return obj.allocations as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    const firstArray = Object.values(obj).find((v) => Array.isArray(v));
    if (Array.isArray(firstArray)) return firstArray as T[];
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
  holdingLots: (holdingId: string) => ["holdings", holdingId, "lots"],
  trades: (params?: Record<string, unknown>) => ["trades", params],
  sips: (params?: Record<string, unknown>) => ["sips", params],
  realizedGains: (params?: Record<string, unknown>) => ["realizedGains", params],
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
  cashPosition: ["cashPosition"],
  wallets: ["wallets"],
  fixedDeposits: ["fixedDeposits"],
  investmentCash: ["investmentCash"],
  transfers: (params?: Record<string, unknown>) => ["transfers", params],
  reconciliation: (params?: Record<string, unknown>) => ["reconciliation", params],
  accountStatements: (params?: Record<string, unknown>) => ["accountStatements", params],
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

export function useDeleteInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.deleteInstitution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      useUIStore.getState().showToast("Institution deleted successfully", "success");
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

export {
  useFinancialHealth,
  useFinancialHealthHistory,
  useHealthComponents,
  useHealthRecommendations,
  useRecalculateHealthScore,
  usePayCardStatement,
  useReverseCardStatementPayment,
} from "../features/health/hooks/useFinancialHealth";

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

// Cash Position Query
// Derives totals purely from real account balances (`/finance/accounts`) — there is
// no backend endpoint that classifies cash as available/pending/locked/emergency, so
// those distinctions are intentionally not fabricated here.
export function useCashPosition() {
  const { data: accounts = [], isLoading, isError } = useAccounts();

  return useQuery({
    queryKey: QUERY_KEYS.cashPosition,
    queryFn: (): CashPositionData => {
      const liquidAccounts = accounts.filter((a) =>
        ["CHECKING", "SAVINGS", "CASH", "WALLET", "BROKERAGE_CASH"].includes(a.type)
      );

      const totalNum = liquidAccounts.reduce(
        (sum, a) => sum + (parseFloat(a.currentBalance?.amount || "0") || 0),
        0
      );

      const currencyMap: Record<string, number> = {};
      const instMap: Record<string, { name: string; logo?: string; amount: number }> = {};

      liquidAccounts.forEach((acc) => {
        const amt = parseFloat(acc.currentBalance?.amount || "0") || 0;
        const curr = acc.currency || "INR";
        currencyMap[curr] = (currencyMap[curr] || 0) + amt;

        const instId = acc.institutionId || acc.institution?.id || "other";
        const instName = acc.institution?.name || "Independent / Cash";
        if (!instMap[instId]) {
          instMap[instId] = { name: instName, logo: acc.institution?.logoUrl, amount: 0 };
        }
        instMap[instId].amount += amt;
      });

      const currencyBreakdown = Object.entries(currencyMap).map(([curr, amt]) => ({
        currency: curr,
        amount: { amount: amt.toFixed(2), currency: curr },
        percentage: totalNum > 0 ? Math.round((amt / totalNum) * 100) : 0,
      }));

      const institutionBreakdown = Object.entries(instMap).map(([instId, data]) => ({
        institutionId: instId,
        institutionName: data.name,
        logoUrl: data.logo,
        amount: { amount: data.amount.toFixed(2), currency: "INR" },
        percentage: totalNum > 0 ? Math.round((data.amount / totalNum) * 100) : 0,
      }));

      return {
        totalCash: { amount: totalNum.toFixed(2), currency: "INR" },
        currencyBreakdown,
        institutionBreakdown,
      };
    },
    enabled: isAuth() && !isLoading && !isError,
  });
}

// Wallets Query
// Wallet accounts are real `/finance/accounts` records filtered by type; `provider` is
// inferred from the account name for display only. There is no backend endpoint for
// per-wallet spend analytics, so no spend/category figures are fabricated here.
export function useWallets() {
  const { data: accounts = [], isLoading, isError } = useAccounts();
  return useQuery({
    queryKey: QUERY_KEYS.wallets,
    queryFn: (): WalletAccount[] => {
      const walletAccs = accounts.filter((a) => a.type === "WALLET" || a.type === "CASH");
      return walletAccs.map((w) => {
        let provider: WalletAccount["provider"] = "Other";
        const nameLower = w.name.toLowerCase();
        if (nameLower.includes("paytm")) provider = "Paytm";
        else if (nameLower.includes("phonepe")) provider = "PhonePe";
        else if (nameLower.includes("gpay") || nameLower.includes("google")) provider = "Google Pay";
        else if (nameLower.includes("amazon")) provider = "Amazon Pay";
        else if (nameLower.includes("paypal")) provider = "PayPal";

        return { ...w, provider };
      });
    },
    enabled: isAuth() && !isLoading && !isError,
  });
}

// Fixed Deposits Query
// There is no backend endpoint or account field for FD terms (interest rate, maturity
// date, tenure, principal) — `/finance/accounts` only exposes a current balance. Rather
// than inventing those figures, this resolves to an error state like `useAccountTransfers`.
export function useFixedDeposits() {
  return useQuery({
    queryKey: QUERY_KEYS.fixedDeposits,
    queryFn: (): Promise<FixedDeposit[]> =>
      Promise.reject(new Error("Fixed deposit tracking is not available yet — no backend endpoint exists.")),
    enabled: isAuth(),
    retry: false,
  });
}

// Investment Cash Query
// There is no backend endpoint for per-broker cash positions (available to trade,
// pending settlement, withdrawable) — resolves to an error state instead of
// fabricating broker balances.
export function useInvestmentCash() {
  return useQuery({
    queryKey: QUERY_KEYS.investmentCash,
    queryFn: (): Promise<InvestmentCashPosition[]> =>
      Promise.reject(new Error("Broker cash positions are not available yet — no backend endpoint exists.")),
    enabled: isAuth(),
    retry: false,
  });
}

// Account Transfers Query & Mutation
// There is no backend endpoint for account-to-account transfers yet (no
// `/finance/transfers` route exists in services/api/endpoints.ts). These hooks
// intentionally resolve to an error state instead of fabricating transfer
// history or pretending a transfer succeeded — consumers must render the
// resulting isError state rather than treat empty/success as real data.
export function useAccountTransfers(params?: { status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.transfers(params),
    queryFn: (): Promise<AccountTransfer[]> =>
      Promise.reject(new Error("Account transfers are not available yet — no backend endpoint exists.")),
    enabled: isAuth(),
    retry: false,
  });
}

export function useCreateTransfer() {
  return useMutation<{ success: boolean; transfer: Partial<AccountTransfer> }, Error, Partial<AccountTransfer>>({
    mutationFn: async () => {
      throw new Error("Fund transfers are not available yet — no backend endpoint exists.");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Reconciliation Query & Mutations
// There is no backend endpoint for matching imported statement lines against ledger
// transactions — resolves to an error state instead of fabricating match results.
export function useReconciliation(params?: { status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.reconciliation(params),
    queryFn: (): Promise<ReconciliationItem[]> =>
      Promise.reject(new Error("Statement reconciliation is not available yet — no backend endpoint exists.")),
    enabled: isAuth(),
    retry: false,
  });
}

export function useBulkReconcile() {
  return useMutation<never, Error, { ids: string[]; action: "MATCH" | "DISMISS" }>({
    mutationFn: async () => {
      throw new Error("Statement reconciliation is not available yet — no backend endpoint exists.");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Account Statements Query
// There is no backend endpoint that generates/aggregates bank, wallet, or investment
// account statements — resolves to an error state instead of fabricating statement history.
export function useAccountStatements(params?: { type?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.accountStatements(params),
    queryFn: (): Promise<AccountStatementItem[]> =>
      Promise.reject(new Error("Account statements are not available yet — no backend endpoint exists.")),
    enabled: isAuth(),
    retry: false,
  });
}

// Transactions
// The backend nests category/merchant as `{id, name}` objects and never
// returns `version` on read — this mapper flattens them into the app-facing
// Transaction shape once, here, the same way useBudgetQueries.ts/
// useGoalQueries.ts translate their own wire DTOs.
interface RawTransaction {
  id: string;
  accountId: string | null;
  creditCardId: string | null;
  emiId: string | null;
  counterAccountId: string | null;
  category: { id: string; name: string } | null;
  merchant: { id: string; name: string } | null;
  amount: Money;
  direction: Transaction["direction"];
  transactionDate: string;
  description: string;
  notes: string | null;
  source: string;
  isPending: boolean;
  importRowId: string | null;
}

function mapTransaction(raw: RawTransaction): Transaction {
  return {
    id: raw.id,
    accountId: raw.accountId,
    creditCardId: raw.creditCardId,
    emiId: raw.emiId,
    counterAccountId: raw.counterAccountId,
    categoryId: raw.category?.id,
    categoryName: raw.category?.name,
    merchantId: raw.merchant?.id,
    merchantName: raw.merchant?.name,
    amount: raw.amount,
    direction: raw.direction,
    description: raw.description,
    date: raw.transactionDate,
    notes: raw.notes,
    source: raw.source,
    isPending: raw.isPending,
    importRowId: raw.importRowId,
    version: 1,
  };
}

export function useTransactions(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(params),
    queryFn: () => api.getTransactions(params),
    enabled: isAuth(),
    select: (res) => unwrapList<RawTransaction>(res).map(mapTransaction),
  });
}

export function useTransactionsInfinite(params?: Record<string, string | number | boolean | undefined>) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.transactions(params), "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const page = await api.getTransactions({ ...params, cursor: pageParam });
      return { ...page, data: unwrapList<RawTransaction>(page).map(mapTransaction) };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.transaction(id),
    queryFn: async () => mapTransaction((await api.getTransaction(id)) as unknown as RawTransaction),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
      queryClient.invalidateQueries({ queryKey: ["cashFlow"] });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["financial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      useUIStore.getState().showToast("Transaction added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version }: { id: string; data: UpdateTransactionInput; version?: number }) =>
      api.updateTransaction(id, data, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
      queryClient.invalidateQueries({ queryKey: ["cashFlow"] });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["financial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
      queryClient.invalidateQueries({ queryKey: ["cashFlow"] });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["financial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
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

export function useImportPreviewInfinite(id: string, params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.importPreview(id, params), "infinite"],
    queryFn: ({ pageParam }: { pageParam?: string }) => api.getImportPreview(id, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth() && Boolean(id),
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
    mutationFn: ({ jobId, rowId, data }: { jobId: string; rowId: string; data: UpdateImportRowInput }) =>
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
export function useHoldings(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.holdings(params),
    queryFn: () => api.getHoldings(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Holding>(res),
  });
}

export function useHoldingsInfinite(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.holdings(params), "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const page = await api.getHoldings({ ...params, cursor: pageParam });
      return { ...page, data: unwrapList<Holding>(page) };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
  });
}

export function useHoldingLots(holdingId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.holdingLots(holdingId),
    queryFn: () => api.getHoldingLots(holdingId),
    enabled: isAuth() && Boolean(holdingId),
  });
}

export function useTrades(params?: { assetId?: string; portfolioId?: string; cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.trades(params),
    queryFn: () => api.getTrades(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Trade>(res),
  });
}

export function useTradesInfinite(params?: { assetId?: string; portfolioId?: string; limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.trades(params), "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const page = await api.getTrades({ ...params, cursor: pageParam });
      return { ...page, data: unwrapList<Trade>(page) };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
  });
}

export function useCreateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTradeInput) => api.createTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investmentReturns });
      useUIStore.getState().showToast("Trade recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useSIPs(params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.sips(params),
    queryFn: () => api.getSIPs(params),
    enabled: isAuth(),
    select: (res) => unwrapList<SipPlan>(res),
  });
}

export function useRealizedGains(params?: { dateFrom?: string; dateTo?: string; cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.realizedGains(params),
    queryFn: () => api.getRealizedGains(params),
    enabled: isAuth(),
    select: (res) => unwrapList<RealizedGain>(res),
  });
}

export function useRealizedGainsInfinite(params?: { dateFrom?: string; dateTo?: string; limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.realizedGains(params), "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const page = await api.getRealizedGains({ ...params, cursor: pageParam });
      return { ...page, data: unwrapList<RealizedGain>(page) };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
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

export function usePortfolioHistory(id: string, params?: { dateFrom?: string; dateTo?: string; cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.portfolioHistory(id, params),
    queryFn: () => api.getPortfolioHistory(id, params),
    enabled: isAuth() && Boolean(id),
    select: (res) => unwrapList<PortfolioSnapshot>(res),
  });
}

// Loans & Credit Cards & Liabilities
export {
  useLoans,
  useLoanDashboard,
  useLoan,
  useLoanSchedule,
  useEmiSchedule,
  useLoanPayments,
  useLoanDocuments,
  useLoanInterestRateHistory,
  useCreateLoan,
  useUpdateLoan,
  useCloseLoan,
  usePauseLoan,
  useResumeLoan,
  useCancelLoan,
  usePayInstallment,
  useMarkEmiPaid,
  useRecordExtraPayment,
  useReverseLoanPayment,
  useChangeInterestRate,
  useAddLoanDocument,
  useDeleteLoanDocument,
} from "../features/loans/hooks/useLoanQueries";

export {
  useCreditCards,
  useCreditCardDashboard,
  useCreditCard,
  useCreateCreditCard,
  useUpdateCreditCard,
  useCardStatements,
  useCardPayments,
  useRecordCardPayment,
  useCardTransactions,
  useCardEmis,
  useCardRewards,
  useCardDocuments,
  useUploadCardDocument,
  useDeleteCardDocument,
} from "../features/credit-cards/hooks/useCreditCardQueries";

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
// The backend's NetWorthResponseDto uses `snapshotDate` (not `date`) and a
// `breakdown` keyed by `cash` (not `liquidCash`), with an extra `otherAssets`
// line this feature doesn't surface. Map once here so every consumer can use
// the app-facing field names.
interface RawNetWorthSnapshot {
  snapshotDate: string;
  totalAssets: Money;
  totalLiabilities: Money;
  netWorth: Money;
  breakdown: {
    cash: string;
    investments: string;
    realEstate: string;
    otherAssets: string;
    loans: string;
    creditCards: string;
  };
}

function mapNetWorthSnapshot(raw: RawNetWorthSnapshot): NetWorthSnapshot {
  return {
    date: raw.snapshotDate,
    totalAssets: raw.totalAssets,
    totalLiabilities: raw.totalLiabilities,
    netWorth: raw.netWorth,
    breakdown: {
      liquidCash: raw.breakdown?.cash ?? "0",
      investments: raw.breakdown?.investments ?? "0",
      realEstate: raw.breakdown?.realEstate ?? "0",
      loans: raw.breakdown?.loans ?? "0",
      creditCards: raw.breakdown?.creditCards ?? "0",
    },
  };
}

export function useNetWorth() {
  return useQuery({
    queryKey: QUERY_KEYS.netWorth,
    queryFn: async () => mapNetWorthSnapshot((await api.getNetWorth()) as unknown as RawNetWorthSnapshot),
    enabled: isAuth(),
  });
}

export function useNetWorthHistory(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.netWorthHistory(params),
    queryFn: async () => {
      const res = await api.getNetWorthHistory(params);
      return unwrapList<RawNetWorthSnapshot>(res).map(mapNetWorthSnapshot);
    },
    enabled: isAuth(),
  });
}

// The backend's CashFlowResponseDto uses `periodStart`/`periodEnd` (not
// `period`), `netCashFlow` (not `netSavings`), `savingsRate` as a decimal
// string (not a whole-percent number), and category breakdown lines with a
// plain string `amount` (not Money) and no `percentage` — derive that last
// one from each line's share of `totalExpense` instead of fabricating it.
interface RawCashFlowSnapshot {
  periodStart: string;
  periodEnd: string;
  totalIncome: Money;
  totalExpense: Money;
  netCashFlow: Money;
  savingsRate: string;
  categoryBreakdown: Array<{ categoryId: string | null; categoryName: string; amount: string }>;
}

function mapCashFlowSnapshot(raw: RawCashFlowSnapshot): CashFlowSnapshot {
  const currency = raw.totalIncome?.currency || raw.totalExpense?.currency || "INR";
  const totalExpenseVal = parseFloat(raw.totalExpense?.amount || "0") || 0;
  return {
    period: raw.periodStart,
    totalIncome: raw.totalIncome,
    totalExpense: raw.totalExpense,
    netSavings: raw.netCashFlow,
    savingsRate: parseFloat(raw.savingsRate) || 0,
    categoryBreakdown: (raw.categoryBreakdown || []).map((c) => {
      const amountVal = parseFloat(c.amount) || 0;
      return {
        categoryId: c.categoryId || "uncategorized",
        categoryName: c.categoryName,
        amount: { amount: c.amount, currency },
        percentage: totalExpenseVal > 0 ? Math.round((amountVal / totalExpenseVal) * 100) : 0,
      };
    }),
  };
}

export function useCashFlowAnalytics(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.cashFlow(params),
    queryFn: async () => {
      const res = await api.getCashFlow(params);
      return unwrapList<RawCashFlowSnapshot>(res).map(mapCashFlowSnapshot);
    },
    enabled: isAuth(),
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
    select: (res) => unwrapList<{ categoryId?: string; categoryName?: string; amount?: Money; percentage?: number }>(res),
  });
}

export function useExpensesByMerchant() {
  return useQuery({
    queryKey: QUERY_KEYS.expensesByMerchant,
    queryFn: () => api.getExpensesByMerchant(),
    enabled: isAuth(),
    select: (res) => unwrapList<{ merchantName?: string; amount?: Money; percentage?: number }>(res),
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

// Budgets (Re-exported from feature module)
export {
  useBudgetDashboard,
  useBudgets,
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useBudgetCategories,
  useUpdateCategoryAllocation,
  useReplaceBudgetCategories,
  useBudgetAnalytics,
  useBudgetHistory,
  useUpdateBudgetAlertSettings,
  useCarryForwardBudget,
  useDuplicateBudget,
  useResetBudget,
  useBudgetTemplates,
  useCreateBudgetTemplate,
  useUpdateBudgetTemplate,
  useDeleteBudgetTemplate,
  useApplyBudgetTemplate,
  useBudgetAlerts,
  useDismissBudgetAlert,
  useMarkBudgetAlertRead,
} from "../features/budgets/hooks/useBudgetQueries";

// Goals (Re-exported from feature module)
export {
  useGoals,
  useGoalDashboard,
  useGoal,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useActivateGoal,
  usePauseGoal,
  useResumeGoal,
  useCancelGoal,
  useArchiveGoal,
  useGoalContributions,
  useRecordGoalContribution,
  useAddGoalContribution,
  useUpdateGoalContribution,
  useDeleteGoalContribution,
  useGoalMilestones,
  useAddGoalMilestone,
  useUpdateGoalMilestone,
  useDeleteGoalMilestone,
  useGoalForecast,
  useGoalAnalytics,
  useGoalProjection,
  useGoalTemplates,
  useCreateGoalTemplate,
  useDeleteGoalTemplate,
  useApplyGoalTemplate,
  useGoalDocuments,
  useRegisterGoalDocument,
  useDeleteGoalDocument,
  useGoalBeneficiaries,
  useAddGoalBeneficiary,
  useUpdateGoalBeneficiary,
  useDeleteGoalBeneficiary,
} from "../features/goals/hooks/useGoalQueries";

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
export const useImports = useImportJobs;
export const useUploadImport = useUploadImportFile;
