import { useQuery, useMutation, useQueryClient, useInfiniteQuery, QueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { getAccessToken } from "../services/api/client";
import { Money, UserSettings, Account, Transaction, CreateTransactionInput, UpdateTransactionInput, Trade, Category, FinancialInstitution, ImportRowStaging, UpdateImportRowInput, Holding, Portfolio, SipPlan, RealizedGain, CreateTradeInput, PortfolioSnapshot, NetWorthSnapshot, CashFlowSnapshot, CalendarItem, SearchResultItem, ImportJob, ImportJobStatus, CashPositionData, WalletAccount, FixedDeposit, InvestmentCashPosition, Transfer, CreateTransferInput, AccountStatementItem, StatementLine, StatementLineCandidate, ReconciliationRecord, IgnoreReason, Merchant, ReviewClusterStatus, ResolveReviewClusterInput, AssetRefreshResult, AssetRefreshStatus, RefreshPricesResponse, UserSelfIdentifier, CreateUserSelfIdentifierInput, AnalyticsTrendPoint, IncomeSource, IncomeRecord } from "../types";
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
  categories: (params?: Record<string, unknown>) => ["categories", params],
  imports: (params?: Record<string, unknown>) => ["imports", params],
  reviewQueue: (params?: Record<string, unknown>) => ["reviewQueue", params],
  importJob: (id: string) => ["imports", id],
  importPreview: (id: string, params?: Record<string, unknown>) => ["imports", id, "preview", params],
  merchants: (params?: Record<string, unknown>) => ["merchants", params],
  reviewClusters: (params?: Record<string, unknown>) => ["reviewClusters", params],
  reviewCluster: (id: string) => ["reviewClusters", id],
  selfIdentifiers: (params?: Record<string, unknown>) => ["selfIdentifiers", params],
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
  incomeRecord: (id: string) => ["incomeRecord", id],
  incomeReconciliation: (id: string) => ["incomeReconciliation", id],
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
  accountStatements: (params?: Record<string, unknown>) => ["accountStatements", params],
  statementLines: (params?: Record<string, unknown>) => ["statementLines", params],
  statementLine: (id: string) => ["statementLines", id],
  statementLineCandidates: (id: string) => ["statementLines", id, "candidates"],
  unmatchedStatementLines: (params?: Record<string, unknown>) => ["statementLines", "unmatched", params],
  suggestedStatementLines: (params?: Record<string, unknown>) => ["statementLines", "suggestions", params],
  reconciliations: (params?: Record<string, unknown>) => ["reconciliations", params],
  reconciliation: (id: string) => ["reconciliations", id],
  reconciliationSummary: (params?: Record<string, unknown>) => ["reconciliationSummary", params],
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
} from "../features/health/hooks/useFinancialHealth";

// Accounts
export function useAccounts(params?: { limit?: number; search?: string; type?: string; status?: string }) {
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

// Transfer Center (`/finance/transfers`) — atomic account-to-account
// transfers. The backend only returns account ids, not names; components
// join fromAccountName/toAccountName against useAccounts() themselves.
export function useTransfers(params?: { status?: string; type?: string; accountId?: string; dateFrom?: string; dateTo?: string; search?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.transfers(params),
    queryFn: () => api.getTransfers(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Transfer>(res),
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: ["transfers", id],
    queryFn: () => api.getTransfer(id),
    enabled: isAuth() && Boolean(id),
  });
}

const invalidateAfterTransfer = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ["transfers"] });
  queryClient.invalidateQueries({ queryKey: ["accounts"] });
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
  queryClient.invalidateQueries({ queryKey: ["cashFlow"] });
  queryClient.invalidateQueries({ queryKey: ["cashPosition"] });
};

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferInput) => api.createTransfer(data),
    onSuccess: () => {
      invalidateAfterTransfer(queryClient);
      useUIStore.getState().showToast("Transfer completed successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useReverseTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.reverseTransfer(id),
    onSuccess: () => {
      invalidateAfterTransfer(queryClient);
      useUIStore.getState().showToast("Transfer reversed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Statement Reconciliation — Queries & Mutations
// Mirrors packages/finance/src/reconciliation on the backend: every imported
// bank-statement row lands as a StatementLine (UNMATCHED/SUGGESTED/MATCHED/
// DUPLICATE/IGNORED); ReconciliationRecord rows track the match decisions
// (SUGGESTED/CONFIRMED/REJECTED/SUPERSEDED) behind SUGGESTED lines.
const invalidateAfterReconciliation = (
  queryClient: ReturnType<typeof useQueryClient>,
  affectsLedger = false,
) => {
  queryClient.invalidateQueries({ queryKey: ["statementLines"] });
  queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
  queryClient.invalidateQueries({ queryKey: ["reconciliationSummary"] });
  if (affectsLedger) {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
    queryClient.invalidateQueries({ queryKey: ["cashFlow"] });
  }
};

export function useStatementLines(params?: {
  accountId?: string;
  importJobId?: string;
  status?: string;
  reviewRequired?: boolean;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.statementLines(params),
    queryFn: () => api.getStatementLines(params),
    enabled: isAuth(),
    select: (res) => unwrapList<StatementLine>(res),
  });
}

export function useStatementLinesInfinite(params?: {
  accountId?: string;
  importJobId?: string;
  status?: string;
  reviewRequired?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.statementLines(params), "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const page = await api.getStatementLines({ ...params, cursor: pageParam });
      return { ...page, data: unwrapList<StatementLine>(page) };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
  });
}

export function useUnmatchedStatementLines(params?: { accountId?: string; importJobId?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.unmatchedStatementLines(params),
    queryFn: () => api.getUnmatchedStatementLines(params),
    enabled: isAuth(),
    select: (res) => unwrapList<StatementLine>(res),
  });
}

export function useSuggestedStatementLines(params?: { accountId?: string; importJobId?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.suggestedStatementLines(params),
    queryFn: () => api.getSuggestedStatementLines(params),
    enabled: isAuth(),
    select: (res) => unwrapList<StatementLine>(res),
  });
}

export function useStatementLine(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.statementLine(id),
    queryFn: () => api.getStatementLine(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useStatementLineCandidates(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.statementLineCandidates(id),
    queryFn: () => api.getStatementLineCandidates(id),
    enabled: isAuth() && Boolean(id),
    select: (res) => unwrapList<StatementLineCandidate>(res),
  });
}

export function useMatchStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transactionId, version }: { id: string; transactionId: string; version: number }) =>
      api.matchStatementLine(id, transactionId, version),
    onSuccess: () => {
      invalidateAfterReconciliation(queryClient);
      useUIStore.getState().showToast("Statement line matched", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUnmatchStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => api.unmatchStatementLine(id, version),
    onSuccess: () => {
      invalidateAfterReconciliation(queryClient);
      useUIStore.getState().showToast("Match undone", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useIgnoreStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, version }: { id: string; reason: IgnoreReason; version: number }) =>
      api.ignoreStatementLine(id, reason, version),
    onSuccess: () => {
      invalidateAfterReconciliation(queryClient);
      useUIStore.getState().showToast("Statement line ignored", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCreateMissingTransactionFromStatementLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      version,
    }: {
      id: string;
      data: { categoryId?: string; notes?: string };
      version: number;
    }) => api.createMissingTransactionFromStatementLine(id, data, version),
    onSuccess: () => {
      invalidateAfterReconciliation(queryClient, true);
      useUIStore.getState().showToast("Transaction created and reconciled", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRunReconciliationAutoMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { accountId?: string; importJobId?: string }) =>
      api.runReconciliationAutoMatch(params),
    onSuccess: (res) => {
      invalidateAfterReconciliation(queryClient);
      useUIStore.getState().showToast(
        `Auto-match complete — ${res.autoMatched} matched, ${res.suggested} suggested`,
        "success",
      );
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCompleteReconciliation() {
  return useMutation({
    mutationFn: (params?: { accountId?: string; dateFrom?: string; dateTo?: string }) =>
      api.completeReconciliation(params),
    onSuccess: () => {
      useUIStore.getState().showToast("Reconciliation marked complete", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useReconciliations(params?: {
  statementLineId?: string;
  transactionId?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.reconciliations(params),
    queryFn: () => api.getReconciliations(params),
    enabled: isAuth(),
    select: (res) => unwrapList<ReconciliationRecord>(res),
  });
}

export function useReconciliationSummary(params?: { accountId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.reconciliationSummary(params),
    queryFn: () => api.getReconciliationSummary(params),
    enabled: isAuth(),
  });
}

export function useConfirmReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => api.confirmReconciliation(id, version),
    onSuccess: () => {
      invalidateAfterReconciliation(queryClient);
      useUIStore.getState().showToast("Match confirmed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRejectReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => api.rejectReconciliation(id, version),
    onSuccess: () => {
      invalidateAfterReconciliation(queryClient);
      useUIStore.getState().showToast("Suggestion rejected", "info");
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
export function useCategories(params?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.categories(params),
    queryFn: () => api.getCategories(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Category>(res),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => api.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      useUIStore.getState().showToast("Category created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Imports & Documents
//
// Polls while any job in the list hasn't reached a terminal status yet, so
// Import Job History reflects PARSING/OCR_PROCESSING/etc. progressing to
// AWAITING_REVIEW/COMPLETED/FAILED without the user needing to manually
// refresh — this list previously only ever updated via mutation
// invalidation, so a job's row froze on its upload-time status (e.g.
// "PARSING") for as long as the user stayed on the page.
export function useImportJobs(params?: { limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.imports(params),
    queryFn: () => api.getImportJobs(params),
    enabled: isAuth(),
    select: (res) => unwrapList<ImportJob>(res),
    refetchInterval: (query) => {
      const jobs = query.state.data ? unwrapList<ImportJob>(query.state.data) : [];
      const hasActiveJob = jobs.some((j) => !TERMINAL_POST_UPLOAD_STATUSES.includes(j.status));
      return hasActiveJob ? 4000 : false;
    },
  });
}

// Cursor-paginated ("Load More") rather than a single fixed-limit fetch —
// the review queue can span many jobs' worth of NEEDS_REVIEW rows, and a
// plain useQuery previously silently truncated to one page while a caller
// used `.length` on that truncated array as if it were the true total.
export function useReviewQueueInfinite(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.reviewQueue(params), "infinite"],
    queryFn: ({ pageParam }: { pageParam?: string }) => api.getReviewQueue({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
  });
}

// Counterparty Intelligence — Unknown Counterparty Workflow. Distinct from
// useReviewQueue above: that lists ImportRowStaging rows (per-job,
// snapshotted at import time); these list MerchantReviewCluster groups
// (cross-job, live — every raw narration variant of the same unresolved
// counterparty grouped into one reviewable/resolvable unit).
export function useMerchants(params?: { search?: string; merchantType?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.merchants(params),
    queryFn: () => api.getMerchants(params),
    enabled: isAuth(),
    select: (res) => unwrapList<Merchant>(res),
  });
}

// Deliberately a distinct query-key prefix ("merchant", singular) from
// useMerchants' ("merchants", plural + params) — TanStack Query's default
// key hashing runs entries through JSON.stringify, which collapses
// `undefined` array elements to `null`, so `["merchants", undefined]`
// (useMerchants() with no filters) and `["merchants", null]` (this hook,
// disabled) would otherwise hash identically and share one cache slot —
// this disabled query would then silently render the *list* query's cached
// response as if it were a single Merchant.
export function useMerchant(id: string | null | undefined) {
  return useQuery({
    queryKey: ["merchant", id],
    queryFn: () => api.getMerchant(id as string),
    enabled: isAuth() && Boolean(id),
  });
}

// Cursor-paginated ("Load More") for the same reason as
// useReviewQueueInfinite above — cursor is driven by pagination itself
// (via pageParam), not passed in by the caller.
export function useReviewClustersInfinite(params?: { status?: ReviewClusterStatus; limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.reviewClusters(params), "infinite"],
    queryFn: ({ pageParam }: { pageParam?: string }) => api.getReviewClusters({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth(),
  });
}

export function useReviewCluster(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reviewCluster(id),
    queryFn: () => api.getReviewCluster(id),
    enabled: isAuth() && Boolean(id),
  });
}

// `silent` (caller-side only, not sent to the backend) lets bulk callers —
// "Ignore Selected" / auto-resolve high-confidence matches — suppress the
// per-call toast and show one summary toast instead.
export function useResolveReviewCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveReviewClusterInput; silent?: boolean }) =>
      api.resolveReviewCluster(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviewClusters"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviewQueue() });
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      if (!variables.silent) {
        useUIStore
          .getState()
          .showToast(
            variables.data.status === "IGNORED" ? "Cluster ignored" : "Counterparty resolved",
            "success",
          );
      }
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Self-transfer identifiers — the user's own registered UPI VPAs. Not
// paginated in the UI (a user realistically has a handful of these), so the
// list is unwrapped the same way useMerchants unwraps its response shape.
export function useSelfIdentifiers(params?: { enabled?: boolean; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.selfIdentifiers(params),
    queryFn: () => api.getSelfIdentifiers(params),
    enabled: isAuth(),
    select: (res) => unwrapList<UserSelfIdentifier>(res),
  });
}

export function useCreateSelfIdentifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserSelfIdentifierInput) => api.createSelfIdentifier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selfIdentifiers"] });
      useUIStore.getState().showToast("Self-transfer VPA registered", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useToggleSelfIdentifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.toggleSelfIdentifier(id, enabled),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["selfIdentifiers"] });
      useUIStore
        .getState()
        .showToast(variables.enabled ? "Identifier re-enabled" : "Identifier disabled", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Statuses a job can settle into after upload without an explicit user
// action (commit/rollback). Anything else (UPLOADED, VALIDATING, PARSING,
// OCR_PROCESSING, AI_EXTRACTING, NORMALIZING, DETECTING_DUPLICATES) is
// in-flight processing that a poller should keep waiting through.
export const TERMINAL_POST_UPLOAD_STATUSES: ImportJobStatus[] = [
  "AWAITING_REVIEW",
  "FAILED",
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "ROLLED_BACK",
];

// `pollIntervalMs` (not a plain `poll: boolean`) so a caller can slow the
// cadence down instead of only being able to turn polling fully off —
// e.g. ImportsView drops to a slower interval once its own give-up timeout
// fires, rather than stopping entirely and never learning the job later
// failed/completed. `poll: true` still works as a 2.5s-cadence shorthand.
export function useImportJob(
  id: string,
  options?: { poll?: boolean; pollIntervalMs?: number }
) {
  const intervalMs = options?.pollIntervalMs ?? (options?.poll ? 2500 : undefined);
  return useQuery({
    queryKey: QUERY_KEYS.importJob(id),
    queryFn: () => api.getImportJob(id),
    enabled: isAuth() && Boolean(id),
    refetchInterval: intervalMs
      ? (query) => {
          const status = query.state.data?.status;
          if (status && TERMINAL_POST_UPLOAD_STATUSES.includes(status)) return false;
          return intervalMs;
        }
      : undefined,
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

export function useImportPreviewInfinite(id: string, params?: { limit?: number }, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.importPreview(id, params), "infinite"],
    queryFn: ({ pageParam }: { pageParam?: string }) => api.getImportPreview(id, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth() && Boolean(id) && (options?.enabled ?? true),
  });
}

export function useUploadImportFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadImportFile(formData),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      // The job is very often still PARSING/OCR_PROCESSING/etc. at this
      // point (only fast CSVs resolve synchronously) — don't claim success
      // before it's actually done, since that reads as contradictory next
      // to the "Processing Statement" screen the UI moves to.
      if (job.status === "AWAITING_REVIEW") {
        useUIStore.getState().showToast("Statement uploaded and parsed successfully", "success");
      } else if (job.status !== "FAILED") {
        useUIStore.getState().showToast("Statement received — processing started", "info");
      }
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

// `silent` is a caller-side flag, not sent to the backend (mutationFn only
// forwards jobId/rowId/data) — bulk callers (Review Queue's Accept/Reject
// Selected) set it so N queued mutateAsync calls don't stack N identical
// "Row updated" toasts; they show one summary toast themselves instead.
export function useUpdateImportRow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, rowId, data }: { jobId: string; rowId: string; data: UpdateImportRowInput; silent?: boolean }) =>
      api.updateImportRow(jobId, rowId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
      if (!variables.silent) {
        useUIStore.getState().showToast("Row updated", "success");
      }
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

// Asset price refresh (Yahoo Finance-backed). Both hooks call the exact
// same backend AssetPriceRefreshService the daily scheduled job uses — no
// separate refresh pipeline on the frontend either.
function invalidatePriceDependentQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["holdings"] });
  queryClient.invalidateQueries({ queryKey: ["portfolios"] });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investmentReturns });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assetAllocation });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.netWorth });
}

export function useRefreshHoldingPrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetIds?: string[]) => api.refreshHoldingPrices(assetIds),
    onSuccess: (res: RefreshPricesResponse) => {
      invalidatePriceDependentQueries(queryClient);

      let message: string;
      if (res.total === 0) {
        message = "No held assets to refresh";
      } else if (res.refreshed > 0) {
        message = `Refreshed ${res.refreshed} of ${res.total} asset price${res.total === 1 ? "" : "s"}`;
        if (res.alreadyFresh > 0) message += ` (${res.alreadyFresh} already fresh)`;
      } else if (res.alreadyFresh === res.total) {
        message = "All prices are already up to date";
      } else {
        message = `Checked ${res.total} asset${res.total === 1 ? "" : "s"} — no new prices available right now`;
      }
      const hasIssues = res.providerErrors > 0 || res.failed > 0;
      useUIStore.getState().showToast(message, hasIssues ? "info" : "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

const ASSET_REFRESH_STATUS_MESSAGE: Record<AssetRefreshStatus, string> = {
  REFRESHED: "Price refreshed",
  ALREADY_FRESH: "Price is already up to date",
  MARKET_CLOSED: "Market closed — showing the latest available close",
  UNSUPPORTED: "This asset has no market-data provider mapping",
  PROVIDER_ERROR: "Could not reach the market-data provider — try again shortly",
  INVALID_DATA: "The provider returned invalid data — not applied",
  FAILED: "Refresh failed",
};

const ASSET_REFRESH_SUCCESS_STATUSES = new Set<AssetRefreshStatus>([
  "REFRESHED",
  "ALREADY_FRESH",
  "MARKET_CLOSED",
]);

export function useRefreshAssetPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => api.refreshAssetPrice(assetId),
    onSuccess: (res: AssetRefreshResult) => {
      invalidatePriceDependentQueries(queryClient);
      const message = res.reason || ASSET_REFRESH_STATUS_MESSAGE[res.status];
      const tone = ASSET_REFRESH_SUCCESS_STATUSES.has(res.status) ? "success" : "info";
      useUIStore.getState().showToast(message, tone);
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
  useDeleteCreditCard,
  useChangeCreditCardLimit,
  useCreditCardLimitHistory,
  useCloseCreditCard,
  useCardStatements,
  useCreateCardStatement,
  useUpdateCardStatement,
  useCardPayments,
  useRecordCardPayment,
  useReverseCardPayment,
  useBounceCardPayment,
  useCardTransactions,
  useCardTransactionsInfinite,
  useCardEmis,
  useConvertTransactionToEmi,
  useUpdateCardEmi,
  useCloseCardEmi,
  useCardRewards,
  useCardRewardsHistory,
  useRedeemCardRewards,
  useCardDisputes,
  useCardDispute,
  useRaiseCardDispute,
  useResolveCardDispute,
  useBalanceTransfers,
  useCreateBalanceTransfer,
  usePrepayBalanceTransfer,
  useCloseBalanceTransfer,
  useCardCashback,
  useCardCashbackHistory,
  useRedeemCardCashback,
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
    retirement: string;
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
      // Kept as its own line, disjoint from `investments` on the backend
      // (RetirementAccount.currentBalance vs Holding.marketValue) — never
      // sum these into one figure or the total would double-count nothing,
      // but the two lines would look like they should be merged when they
      // deliberately aren't (retirement has no lots/cost-basis).
      retirement: raw.breakdown?.retirement ?? "0",
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
  // Still in progress (same calendar month as "now") — see
  // CashFlowSnapshot's own doc comment in types/index.ts.
  isCurrentPeriod?: boolean;
  incomeStillExpected?: boolean | null;
  // Only sent alongside isCurrentPeriod: true. Already Money-shaped on the
  // wire, unlike totalIncome's sibling category-breakdown lines, so no
  // amount-string/currency reassembly is needed here.
  expectedIncome?: Money;
  projectedIncome?: Money;
  expectedIncomeItems?: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: Money;
    expectedDateStart: string;
    expectedDateEnd: string;
    confidence: number;
  }>;
}

function mapCashFlowSnapshot(raw: RawCashFlowSnapshot): CashFlowSnapshot {
  const currency = raw.totalIncome?.currency || raw.totalExpense?.currency || "INR";
  const totalExpenseVal = parseFloat(raw.totalExpense?.amount || "0") || 0;
  return {
    period: raw.periodStart,
    totalIncome: raw.totalIncome,
    totalExpense: raw.totalExpense,
    netSavings: raw.netCashFlow,
    // A fraction on the wire ("-0.6979"); every consumer of `CashFlowSnapshot`
    // reads whole percent, so a −69.8% rate was rendering as −0.7%.
    savingsRate: Math.round((parseFloat(raw.savingsRate) || 0) * 10000) / 100,
    categoryBreakdown: (raw.categoryBreakdown || []).map((c) => {
      const amountVal = parseFloat(c.amount) || 0;
      return {
        categoryId: c.categoryId || "uncategorized",
        categoryName: c.categoryName,
        amount: { amount: c.amount, currency },
        percentage: totalExpenseVal > 0 ? Math.round((amountVal / totalExpenseVal) * 100) : 0,
      };
    }),
    // Previously dropped here — the raw API field was correct, but this
    // mapper constructs a brand-new object and never copied it through, so
    // AnalyticsView's "in progress" badge silently never had data to render.
    isCurrentPeriod: raw.isCurrentPeriod,
    incomeStillExpected: raw.incomeStillExpected,
    expectedIncome: raw.expectedIncome,
    projectedIncome: raw.projectedIncome,
    expectedIncomeItems: raw.expectedIncomeItems,
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

// Both trend endpoints share the backend's TrendPointDto shape — `periodStart`
// (not `date`/`month`), `amount` as a plain decimal string (not Money). See
// AnalyticsTrendPoint's own doc comment in types/index.ts.
export function useIncomeTrend(params?: { limit?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeTrend(params),
    queryFn: () => api.getIncomeTrend(params),
    enabled: isAuth(),
    select: (res) => unwrapList<AnalyticsTrendPoint>(res),
  });
}

export function useExpenseTrendAnalytics(params?: { limit?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.expenseTrendAnalytics(params),
    queryFn: () => api.getExpenseTrendAnalytics(params),
    enabled: isAuth(),
    select: (res) => unwrapList<AnalyticsTrendPoint>(res),
  });
}

export function useRetirementForecast(params?: { currentAge?: number; retirementAge?: number; expectedReturnPercent?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.retirementForecast(params),
    queryFn: () => api.getRetirementForecast(params),
    enabled: isAuth(),
  });
}

// `useInsights` / `useDismissInsight` were removed: `/finance/insights` is a
// frozen feed that has returned zero rows since generation was retired, and
// neither hook had a single consumer. The Smart Action Center
// (`useSmartActions` et al) is the live equivalent — see the backend's
// docs/10-frontend-action-center-migration.md. `useDeleteInsight`, an alias of
// the latter, went with them — it had no consumers either.

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

export function useIncomeSources(params?: { search?: string; cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeSources(params),
    queryFn: () => api.getIncomeSources(params),
    enabled: isAuth(),
    select: (res) => unwrapList<IncomeSource>(res),
  });
}

export function useCreateIncomeSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<{
        name: string;
        expectedAmount: string;
        expectedCurrency: string;
        payFrequency: string;
        payDay: number;
      }>,
    ) => api.createIncomeSource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeSources"] });
      useUIStore.getState().showToast("Income source created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useIncomeRecords(params?: {
  incomeSourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeRecords(params),
    queryFn: () => api.getIncomeRecords(params),
    enabled: isAuth(),
    select: (res) => unwrapList<IncomeRecord>(res),
  });
}

// Powers the Salary Slip detail page — the full breakdown (components/
// deductions/contributions), a single composed fetch rather than assembling
// it from several list responses.
export function useIncomeRecord(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeRecord(id),
    queryFn: () => api.getIncomeRecord(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useRecordIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      incomeSourceId: string;
      grossAmount: string;
      netAmount: string;
      currency: string;
      payDate: string;
      transactionId?: string;
      documentId?: string;
    }) => api.recordIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Income recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Never auto-matched server-side — a GET here can promote UNMATCHED ->
// SUGGESTED (see backend docs/24-salary-slip-import.md), but only an
// explicit user confirm ever sets a transactionId.
export function useIncomeReconciliation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeReconciliation(id),
    queryFn: () => api.getIncomeReconciliation(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useReconcileIncomeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transactionId }: { id: string; transactionId: string }) =>
      api.reconcileIncomeRecord(id, transactionId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomeReconciliation(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomeRecord(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
      useUIStore.getState().showToast("Salary matched to the bank transaction", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useRejectIncomeReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rejectIncomeReconciliation(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomeReconciliation(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incomeRecord(id) });
      queryClient.invalidateQueries({ queryKey: ["incomeRecords"] });
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
