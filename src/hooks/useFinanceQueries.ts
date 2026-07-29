import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { Money, UserSettings, Account, Transaction, Budget, Goal, Loan } from "../types";

export const QUERY_KEYS = {
  dashboard: ["dashboard"],
  netWorth: ["netWorth"],
  netWorthHistory: (params?: Record<string, string>) => ["netWorthHistory", params],
  accounts: (params?: Record<string, string>) => ["accounts", params],
  account: (id: string) => ["accounts", id],
  accountHistory: (id: string) => ["accounts", id, "history"],
  transactions: (params?: Record<string, string>) => ["transactions", params],
  transaction: (id: string) => ["transactions", id],
  imports: (params?: Record<string, string>) => ["imports", params],
  importPreview: (id: string) => ["imports", id, "preview"],
  reviewQueue: (params?: Record<string, string>) => ["reviewQueue", params],
  budgets: ["budgets"],
  holdings: ["holdings"],
  trades: (params?: Record<string, string>) => ["trades", params],
  portfolios: ["portfolios"],
  portfolioDetail: (id: string) => ["portfolios", id],
  loans: ["loans"],
  loanDetail: (id: string) => ["loans", id],
  emiSchedule: (id: string) => ["loans", id, "emiSchedule"],
  goals: ["goals"],
  health: ["financialHealth"],
  insights: ["insights"],
  cashFlow: (params?: Record<string, string>) => ["cashFlow", params],
  calendar: ["calendar"],
  search: (q: string) => ["search", q],
  settings: ["settings"],
  onboarding: ["onboarding"],
};

export function useOnboardingProgress() {
  return useQuery({
    queryKey: QUERY_KEYS.onboarding,
    queryFn: () => api.getOnboardingProgress(),
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => api.completeOnboardingStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding });
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => api.getDashboard(),
  });
}

export function useNetWorth() {
  return useQuery({
    queryKey: QUERY_KEYS.netWorth,
    queryFn: () => api.getNetWorth(),
  });
}

export function useNetWorthHistory(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.netWorthHistory(params),
    queryFn: () => api.getNetWorthHistory(params),
  });
}

export function useAccounts(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.accounts(params),
    queryFn: () => api.getAccounts(params),
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
    },
  });
}

export function useTransactions(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(params),
    queryFn: () => api.getTransactions(params),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Transaction>) => api.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: ["cashFlow"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useBulkCategorize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionIds, categoryId }: { transactionIds: string[]; categoryId: string }) =>
      api.bulkCategorize(transactionIds, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useImports(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.imports(params),
    queryFn: () => api.getImports(params),
  });
}

export function useUploadImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadImportFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
    },
  });
}

export function useReviewQueue(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.reviewQueue(params),
    queryFn: () => api.getReviewQueue(params),
  });
}

export function useCommitImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.commitImport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["reviewQueue"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: QUERY_KEYS.budgets,
    queryFn: () => api.getBudgets(),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => api.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets });
    },
  });
}

export function useHoldings() {
  return useQuery({
    queryKey: QUERY_KEYS.holdings,
    queryFn: () => api.getHoldings(),
  });
}

export function useTrades(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.trades(params),
    queryFn: () => api.getTrades(params),
  });
}

export function usePortfolios() {
  return useQuery({
    queryKey: QUERY_KEYS.portfolios,
    queryFn: () => api.getPortfolios(),
  });
}

export function useLoans() {
  return useQuery({
    queryKey: QUERY_KEYS.loans,
    queryFn: () => api.getLoans(),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Loan>) => api.createLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
    },
  });
}

export function useEmiSchedule(loanId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.emiSchedule(loanId),
    queryFn: () => api.getEmiSchedule(loanId),
    enabled: !!loanId,
  });
}

export function useMarkEmiPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, emiId }: { loanId: string; emiId: string }) => api.markEmiPaid(loanId, emiId),
    onSuccess: (_, { loanId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emiSchedule(loanId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: QUERY_KEYS.goals,
    queryFn: () => api.getGoals(),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Goal>) => api.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
    },
  });
}

export function useAddGoalContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: Money }) => api.addGoalContribution(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useFinancialHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: () => api.getFinancialHealth(),
  });
}

export function useInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.insights,
    queryFn: () => api.getInsights(),
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.dismissInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.insights });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useCashFlow(params?: Record<string, string>) {
  return useQuery({
    queryKey: QUERY_KEYS.cashFlow(params),
    queryFn: () => api.getCashFlow(params),
  });
}

export function useCalendar() {
  return useQuery({
    queryKey: QUERY_KEYS.calendar,
    queryFn: () => api.getCalendar(),
  });
}

export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(q),
    queryFn: () => api.globalSearch(q),
    enabled: q.trim().length > 0,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => api.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserSettings>) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
    },
  });
}
