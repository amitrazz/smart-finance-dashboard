import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  CloseRetirementAccountInput,
  CreateRecurringContributionRuleInput,
  CreateRetirementAccountInput,
  RecordRetirementTransactionInput,
  RecurringContributionExecution,
  RecurringContributionRule,
  RetirementAccount,
  RetirementSummary,
  RetirementTransaction,
  UpdateRetirementAccountInput,
} from "../../../types";

const isAuth = () => useAuthStore.getState().isAuthenticated;

const getErrorMessage = (err: unknown): string => {
  if (err !== null && typeof err === "object") {
    if ("userMessage" in err) return String((err as { userMessage: unknown }).userMessage);
    if ("message" in err) return String((err as { message: unknown }).message);
    if ("error" in err) return String((err as { error: unknown }).error);
  }
  return "An unexpected error occurred. Please try again.";
};

const unwrapList = <T>(res: unknown): T[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (typeof res === "object" && res !== null && "data" in res && Array.isArray((res as { data: unknown }).data)) {
    return (res as { data: T[] }).data;
  }
  return [];
};

export const RETIREMENT_QUERY_KEYS = {
  all: ["retirement"] as const,
  accounts: (params?: Record<string, unknown>) => ["retirement", "accounts", params] as const,
  account: (id: string) => ["retirement", "accounts", "detail", id] as const,
  transactions: (params?: Record<string, unknown>) => ["retirement", "transactions", params] as const,
  summary: ["retirement", "summary"] as const,
  recurringRules: (params?: Record<string, unknown>) => ["retirement", "recurring", params] as const,
  recurringRule: (id: string) => ["retirement", "recurring", "detail", id] as const,
  recurringExecutions: (ruleId: string, params?: Record<string, unknown>) =>
    ["retirement", "recurring", ruleId, "executions", params] as const,
};

// Every mutation below invalidates the retirement account/transaction/summary
// queries plus net worth, dashboard, and goals — a retirement contribution,
// withdrawal, interest credit, valuation, or reversal changes a balance that
// all four of those surfaces read (goal corpus and net worth both auto-sum
// RetirementAccount.currentBalance server-side).
function invalidateRetirementSideEffects(
  queryClient: ReturnType<typeof useQueryClient>,
  accountId?: string,
) {
  queryClient.invalidateQueries({ queryKey: RETIREMENT_QUERY_KEYS.all });
  if (accountId) {
    queryClient.invalidateQueries({ queryKey: RETIREMENT_QUERY_KEYS.account(accountId) });
  }
  queryClient.invalidateQueries({ queryKey: ["netWorth"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["goals"] });
}

// Accounts
export function useRetirementAccounts(params?: {
  productType?: string;
  status?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.accounts(params),
    queryFn: async () => {
      const res = await api.getRetirementAccounts(params);
      return {
        data: unwrapList<RetirementAccount>(res),
        nextCursor: (res as { nextCursor?: string })?.nextCursor,
        hasMore: (res as { hasMore?: boolean })?.hasMore ?? false,
        totalCount: (res as { totalCount?: number })?.totalCount,
      };
    },
    enabled: isAuth(),
  });
}

export function useRetirementAccount(id: string) {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.account(id),
    queryFn: async (): Promise<RetirementAccount> => api.getRetirementAccount(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useCreateRetirementAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRetirementAccountInput) => api.createRetirementAccount(data),
    onSuccess: () => {
      invalidateRetirementSideEffects(queryClient);
      useUIStore.getState().showToast("Retirement account created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateRetirementAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      version = 1,
    }: {
      id: string;
      data: UpdateRetirementAccountInput;
      version?: number;
    }) => api.updateRetirementAccount(id, data, version),
    onSuccess: (_, variables) => {
      invalidateRetirementSideEffects(queryClient, variables.id);
      useUIStore.getState().showToast("Retirement account updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCloseRetirementAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      version = 1,
    }: {
      id: string;
      data: CloseRetirementAccountInput;
      version?: number;
    }) => api.closeRetirementAccount(id, data, version),
    onSuccess: (_, variables) => {
      invalidateRetirementSideEffects(queryClient, variables.id);
      useUIStore.getState().showToast("Retirement account closed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Transactions
export function useRetirementTransactions(params?: {
  retirementAccountId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.transactions(params),
    queryFn: async () => {
      const res = await api.getRetirementTransactions(params);
      return {
        data: unwrapList<RetirementTransaction>(res),
        nextCursor: (res as { nextCursor?: string })?.nextCursor,
        hasMore: (res as { hasMore?: boolean })?.hasMore ?? false,
        totalCount: (res as { totalCount?: number })?.totalCount,
      };
    },
    enabled: isAuth() && Boolean(params?.retirementAccountId),
  });
}

export function useRecordRetirementTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordRetirementTransactionInput) => api.recordRetirementTransaction(data),
    onSuccess: (_, variables) => {
      invalidateRetirementSideEffects(queryClient, variables.retirementAccountId);
      queryClient.invalidateQueries({
        queryKey: RETIREMENT_QUERY_KEYS.transactions({ retirementAccountId: variables.retirementAccountId }),
      });
      useUIStore.getState().showToast("Transaction recorded", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useReverseRetirementTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version = 1,
    }: {
      id: string;
      version?: number;
      // Not sent to the API — carried through so onSuccess can invalidate
      // this account's transaction list without a second round trip.
      retirementAccountId: string;
    }) => api.reverseRetirementTransaction(id, version),
    onSuccess: (_, variables) => {
      invalidateRetirementSideEffects(queryClient, variables.retirementAccountId);
      queryClient.invalidateQueries({
        queryKey: RETIREMENT_QUERY_KEYS.transactions({ retirementAccountId: variables.retirementAccountId }),
      });
      useUIStore.getState().showToast("Transaction reversed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Summary
export function useRetirementSummary() {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.summary,
    queryFn: async (): Promise<RetirementSummary> => api.getRetirementSummary(),
    enabled: isAuth(),
  });
}

// Recurring Contributions
//
// Unlike invalidateRetirementSideEffects above, creating/pausing/resuming/
// cancelling a rule never touches the retirement account's balance — only
// RecurringContributionExecutionService (server-side, on the daily sweep)
// writes balance-affecting state. So these mutations only invalidate the
// recurring-rule queries themselves, not netWorth/dashboard/goals.
function invalidateRecurringSideEffects(
  queryClient: ReturnType<typeof useQueryClient>,
  accountId?: string,
  ruleId?: string,
) {
  queryClient.invalidateQueries({ queryKey: RETIREMENT_QUERY_KEYS.recurringRules() });
  if (accountId) {
    queryClient.invalidateQueries({
      queryKey: RETIREMENT_QUERY_KEYS.recurringRules({ retirementAccountId: accountId }),
    });
  }
  if (ruleId) {
    queryClient.invalidateQueries({ queryKey: RETIREMENT_QUERY_KEYS.recurringRule(ruleId) });
  }
}

export function useRecurringContributionRules(params?: {
  retirementAccountId?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.recurringRules(params),
    queryFn: async () => {
      const res = await api.getRecurringContributionRules(params);
      return {
        data: unwrapList<RecurringContributionRule>(res),
        nextCursor: (res as { nextCursor?: string })?.nextCursor,
        hasMore: (res as { hasMore?: boolean })?.hasMore ?? false,
        totalCount: (res as { totalCount?: number })?.totalCount,
      };
    },
    enabled: isAuth() && Boolean(params?.retirementAccountId),
  });
}

export function useRecurringContributionRule(id: string) {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.recurringRule(id),
    queryFn: async (): Promise<RecurringContributionRule> => api.getRecurringContributionRule(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useRecurringContributionExecutions(ruleId: string, params?: { cursor?: string; limit?: number }) {
  return useQuery({
    queryKey: RETIREMENT_QUERY_KEYS.recurringExecutions(ruleId, params),
    queryFn: async () => {
      const res = await api.getRecurringContributionExecutions(ruleId, params);
      return {
        data: unwrapList<RecurringContributionExecution>(res),
        nextCursor: (res as { nextCursor?: string })?.nextCursor,
        hasMore: (res as { hasMore?: boolean })?.hasMore ?? false,
        totalCount: (res as { totalCount?: number })?.totalCount,
      };
    },
    enabled: isAuth() && Boolean(ruleId),
  });
}

export function useCreateRecurringContributionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringContributionRuleInput) => api.createRecurringContributionRule(data),
    onSuccess: (_, variables) => {
      invalidateRecurringSideEffects(queryClient, variables.retirementAccountId);
      useUIStore.getState().showToast("Recurring contribution set up", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function usePauseRecurringContributionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version = 1,
    }: {
      id: string;
      version?: number;
      // Not sent to the API — carried through so onSuccess can invalidate
      // this account's recurring list without a second round trip.
      retirementAccountId: string;
    }) => api.pauseRecurringContributionRule(id, version),
    onSuccess: (_, variables) => {
      invalidateRecurringSideEffects(queryClient, variables.retirementAccountId, variables.id);
      useUIStore.getState().showToast("Recurring contribution paused", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useResumeRecurringContributionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version = 1,
    }: {
      id: string;
      version?: number;
      retirementAccountId: string;
    }) => api.resumeRecurringContributionRule(id, version),
    onSuccess: (_, variables) => {
      invalidateRecurringSideEffects(queryClient, variables.retirementAccountId, variables.id);
      useUIStore.getState().showToast("Recurring contribution resumed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCancelRecurringContributionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version = 1,
    }: {
      id: string;
      version?: number;
      retirementAccountId: string;
    }) => api.cancelRecurringContributionRule(id, version),
    onSuccess: (_, variables) => {
      invalidateRecurringSideEffects(queryClient, variables.retirementAccountId, variables.id);
      useUIStore.getState().showToast("Recurring contribution cancelled", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}
