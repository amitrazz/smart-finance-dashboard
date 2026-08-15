import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  CloseRetirementAccountInput,
  CreateRetirementAccountInput,
  RecordRetirementTransactionInput,
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
