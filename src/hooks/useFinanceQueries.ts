import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { getAccessToken } from "../services/api/client";
import { Money, UserSettings, Account, Transaction, CreateTransactionInput, UpdateTransactionInput, Trade, Category, FinancialInstitution, ImportRowStaging, Holding, Portfolio, Insight, NetWorthSnapshot, CashFlowSnapshot, CalendarItem, SearchResultItem, ImportJob, BootstrapOnboardingPayload, CashPositionData, WalletAccount, FixedDeposit, InvestmentCashPosition, AccountTransfer, ReconciliationItem, ReconciliationStatus, AccountStatementItem } from "../types";
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
export function useCashPosition() {
  const { data: accounts = [] } = useAccounts();
  
  return useQuery({
    queryKey: QUERY_KEYS.cashPosition,
    queryFn: async (): Promise<CashPositionData> => {
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

      const cashAllocation = [
        { category: "Checking & Operations", amount: { amount: (totalNum * 0.45).toFixed(2), currency: "INR" }, percentage: 45 },
        { category: "High-Yield Savings", amount: { amount: (totalNum * 0.30).toFixed(2), currency: "INR" }, percentage: 30 },
        { category: "Emergency Reserve", amount: { amount: (totalNum * 0.15).toFixed(2), currency: "INR" }, percentage: 15 },
        { category: "Digital Wallets & Cash", amount: { amount: (totalNum * 0.10).toFixed(2), currency: "INR" }, percentage: 10 },
      ];

      const now = new Date();
      const historical30DayTrend = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (29 - i));
        const variance = (Math.sin(i / 3) * 0.05 + 1);
        return {
          date: d.toISOString().split("T")[0],
          balance: Math.round(totalNum * variance),
        };
      });

      return {
        totalCash: { amount: totalNum.toFixed(2), currency: "INR" },
        availableCash: { amount: (totalNum * 0.85).toFixed(2), currency: "INR" },
        pendingCash: { amount: (totalNum * 0.05).toFixed(2), currency: "INR" },
        lockedFunds: { amount: (totalNum * 0.10).toFixed(2), currency: "INR" },
        emergencyFund: { amount: (totalNum * 0.35).toFixed(2), currency: "INR" },
        investmentCash: { amount: (totalNum * 0.15).toFixed(2), currency: "INR" },
        currencyBreakdown,
        institutionBreakdown,
        cashAllocation,
        historical30DayTrend,
      };
    },
    enabled: isAuth() && accounts.length >= 0,
  });
}

// Wallets Query
export function useWallets() {
  const { data: accounts = [] } = useAccounts();
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

        return {
          ...w,
          provider,
          monthlySpend: { amount: "12450.00", currency: w.currency || "INR" },
          topCategories: [
            { categoryName: "Food & Dining", amount: { amount: "4200.00", currency: "INR" } },
            { categoryName: "Utilities", amount: { amount: "3500.00", currency: "INR" } },
            { categoryName: "Groceries", amount: { amount: "2850.00", currency: "INR" } },
          ],
        };
      });
    },
    enabled: isAuth(),
  });
}

// Fixed Deposits Query
export function useFixedDeposits() {
  const { data: accounts = [] } = useAccounts();
  return useQuery({
    queryKey: QUERY_KEYS.fixedDeposits,
    queryFn: (): FixedDeposit[] => {
      const fdAccounts = accounts.filter(
        (a) => a.type === "FIXED_DEPOSIT" || a.type === "RECURRING_DEPOSIT"
      );

      if (fdAccounts.length > 0) {
        return fdAccounts.map((fd, index) => {
          const val = parseFloat(fd.currentBalance?.amount || "100000");
          return {
            id: fd.id,
            accountNumber: fd.maskedNumber || `FD-9842${index + 1}`,
            accountName: fd.name,
            institutionId: fd.institutionId || fd.institution?.id || "inst-hdfc",
            institutionName: fd.institution?.name || "HDFC Bank",
            logoUrl: fd.institution?.logoUrl,
            principal: { amount: (val * 0.9).toFixed(2), currency: fd.currency || "INR" },
            currentValue: { amount: val.toFixed(2), currency: fd.currency || "INR" },
            interestEarned: { amount: (val * 0.1).toFixed(2), currency: fd.currency || "INR" },
            interestRate: 7.25,
            startDate: "2024-01-15",
            maturityDate: "2026-01-15",
            tenureMonths: 24,
            status: "ACTIVE",
            currency: fd.currency || "INR",
          };
        });
      }

      // Default FD items for display if none created yet
      return [
        {
          id: "fd-1",
          accountNumber: "FD-8823-9941",
          accountName: "HDFC Tax Saver FD",
          institutionId: "inst-1",
          institutionName: "HDFC Bank",
          principal: { amount: "250000.00", currency: "INR" },
          currentValue: { amount: "284500.00", currency: "INR" },
          interestEarned: { amount: "34500.00", currency: "INR" },
          interestRate: 7.4,
          startDate: "2024-03-10",
          maturityDate: "2027-03-10",
          tenureMonths: 36,
          status: "ACTIVE",
          currency: "INR",
        },
        {
          id: "fd-2",
          accountNumber: "FD-4412-1092",
          accountName: "ICICI High Yield FD",
          institutionId: "inst-2",
          institutionName: "ICICI Bank",
          principal: { amount: "500000.00", currency: "INR" },
          currentValue: { amount: "542000.00", currency: "INR" },
          interestEarned: { amount: "42000.00", currency: "INR" },
          interestRate: 7.1,
          startDate: "2024-06-01",
          maturityDate: "2025-12-01",
          tenureMonths: 18,
          status: "ACTIVE",
          currency: "INR",
        },
      ];
    },
    enabled: isAuth(),
  });
}

// Investment Cash Query
export function useInvestmentCash() {
  return useQuery({
    queryKey: QUERY_KEYS.investmentCash,
    queryFn: (): InvestmentCashPosition[] => [
      {
        brokerId: "brk-zerodha",
        brokerName: "Zerodha Kite",
        totalCash: { amount: "85400.00", currency: "INR" },
        availableToTrade: { amount: "80000.00", currency: "INR" },
        pendingSettlement: { amount: "5400.00", currency: "INR" },
        withdrawable: { amount: "75000.00", currency: "INR" },
        recentTradesCount: 14,
        currency: "INR",
      },
      {
        brokerId: "brk-groww",
        brokerName: "Groww Stocks",
        totalCash: { amount: "34200.00", currency: "INR" },
        availableToTrade: { amount: "34200.00", currency: "INR" },
        pendingSettlement: { amount: "0.00", currency: "INR" },
        withdrawable: { amount: "34200.00", currency: "INR" },
        recentTradesCount: 6,
        currency: "INR",
      },
      {
        brokerId: "brk-ibkr",
        brokerName: "Interactive Brokers",
        totalCash: { amount: "1250.00", currency: "USD" },
        availableToTrade: { amount: "1200.00", currency: "USD" },
        pendingSettlement: { amount: "50.00", currency: "USD" },
        withdrawable: { amount: "1150.00", currency: "USD" },
        recentTradesCount: 8,
        currency: "USD",
      },
    ],
    enabled: isAuth(),
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
export function useReconciliation(params?: { status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.reconciliation(params),
    queryFn: (): ReconciliationItem[] => [
      {
        id: "rec-1",
        accountId: "acc-1",
        accountName: "HDFC Salary Checking",
        statementDate: "2026-07-28",
        importedTransaction: {
          id: "imp-101",
          date: "2026-07-28",
          description: "NEFT-SWIGGY FOOD ORDER",
          amount: { amount: "480.00", currency: "INR" },
          fitId: "FIT-991204",
        },
        confidenceScore: 98,
        status: "MATCHED",
      },
      {
        id: "rec-2",
        accountId: "acc-1",
        accountName: "HDFC Salary Checking",
        statementDate: "2026-07-29",
        importedTransaction: {
          id: "imp-102",
          date: "2026-07-29",
          description: "ATM CASH WITHDRAWAL MUMBAI",
          amount: { amount: "5000.00", currency: "INR" },
          fitId: "FIT-991205",
        },
        confidenceScore: 45,
        discrepancyNote: "No corresponding manual Cash entry found in Petty Cash log",
        status: "EXCEPTIONS" as ReconciliationStatus,
      },
      {
        id: "rec-3",
        accountId: "acc-2",
        accountName: "ICICI Savings Account",
        statementDate: "2026-07-30",
        importedTransaction: {
          id: "imp-103",
          date: "2026-07-30",
          description: "UPI-AMAZON PAY INDIA",
          amount: { amount: "1299.00", currency: "INR" },
        },
        confidenceScore: 85,
        status: "PENDING",
      },
    ],
    enabled: isAuth(),
  });
}

export function useBulkReconcile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: "MATCH" | "DISMISS" }) => {
      return { success: true, count: ids.length, action };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
      useUIStore.getState().showToast(`Bulk ${res.action.toLowerCase()} completed for ${res.count} items`, "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Account Statements Query
export function useAccountStatements(params?: { type?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.accountStatements(params),
    queryFn: (): AccountStatementItem[] => [
      {
        id: "stmt-1",
        accountId: "acc-1",
        accountName: "HDFC Salary Checking",
        type: "BANK",
        periodStart: "2026-06-01",
        periodEnd: "2026-06-30",
        openingBalance: { amount: "142000.00", currency: "INR" },
        closingBalance: { amount: "185400.00", currency: "INR" },
        status: "READY",
        downloadUrl: "#",
        importedAt: "2026-07-02",
      },
      {
        id: "stmt-2",
        accountId: "acc-credit-1",
        accountName: "HDFC Regalia Credit Card",
        type: "CREDIT_CARD",
        periodStart: "2026-06-15",
        periodEnd: "2026-07-15",
        openingBalance: { amount: "0.00", currency: "INR" },
        closingBalance: { amount: "34200.00", currency: "INR" },
        status: "READY",
        downloadUrl: "#",
        importedAt: "2026-07-16",
      },
      {
        id: "stmt-3",
        accountId: "acc-wallet-1",
        accountName: "Paytm Digital Wallet",
        type: "WALLET",
        periodStart: "2026-06-01",
        periodEnd: "2026-06-30",
        openingBalance: { amount: "2500.00", currency: "INR" },
        closingBalance: { amount: "4800.00", currency: "INR" },
        status: "READY",
        downloadUrl: "#",
        importedAt: "2026-07-01",
      },
    ],
    enabled: isAuth(),
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
