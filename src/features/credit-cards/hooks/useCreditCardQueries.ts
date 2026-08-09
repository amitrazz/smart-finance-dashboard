import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  CreditCard,
  CreditCardDashboardData,
  CreditCardStatement,
  CreditCardPayment,
  CreditCardEmi,
  CreditCardRewards,
  CreditCardDocument,
  CreditCardLimitHistory,
  CreditCardDispute,
  CreditCardBalanceTransfer,
  CreditCardCashback,
  CreditCardCashbackTransaction,
  CreditCardRewardHistoryItem,
  CreateCreditCardInput,
  UpdateCreditCardInput,
  RecordCreditCardPaymentInput,
  ChangeCreditCardLimitInput,
  CreateCreditCardStatementInput,
  UpdateCreditCardStatementInput,
  BounceCreditCardPaymentInput,
  ConvertTransactionToEmiInput,
  UpdateCreditCardEmiInput,
  RedeemCreditCardRewardsInput,
  RaiseCreditCardDisputeInput,
  ResolveCreditCardDisputeInput,
  CreateBalanceTransferInput,
  PrepayBalanceTransferInput,
  RedeemCreditCardCashbackInput,
  Transaction,
  Money,
} from "../../../types";

const isAuth = () => useAuthStore.getState().isAuthenticated;

const getErrorMessage = (err: unknown) => {
  const e = err as { userMessage?: string; message?: string; error?: string } | undefined;
  return e?.userMessage || e?.message || e?.error || "An error occurred. Please try again.";
};

export const CREDIT_CARD_QUERY_KEYS = {
  all: ["creditCards"] as const,
  cards: (params?: Record<string, unknown>) => ["creditCards", "list", params] as const,
  dashboard: ["creditCards", "dashboard"] as const,
  detail: (id: string) => ["creditCards", "detail", id] as const,
  statements: (id: string, params?: Record<string, unknown>) => ["creditCards", "statements", id, params] as const,
  payments: (id: string, params?: Record<string, unknown>) => ["creditCards", "payments", id, params] as const,
  transactions: (id: string, params?: Record<string, unknown>) => ["creditCards", "transactions", id, params] as const,
  emis: (id: string, params?: Record<string, unknown>) => ["creditCards", "emis", id, params] as const,
  rewards: (id: string) => ["creditCards", "rewards", id] as const,
  rewardsHistory: (id: string, params?: Record<string, unknown>) => ["creditCards", "rewardsHistory", id, params] as const,
  documents: (id: string) => ["creditCards", "documents", id] as const,
  limitHistory: (id: string) => ["creditCards", "limitHistory", id] as const,
  disputes: (id: string, params?: Record<string, unknown>) => ["creditCards", "disputes", id, params] as const,
  dispute: (id: string, disputeId: string) => ["creditCards", "dispute", id, disputeId] as const,
  balanceTransfers: (id: string, params?: Record<string, unknown>) => ["creditCards", "balanceTransfers", id, params] as const,
  balanceTransfer: (id: string, balanceTransferId: string) => ["creditCards", "balanceTransfer", id, balanceTransferId] as const,
  cashback: (id: string) => ["creditCards", "cashback", id] as const,
  cashbackHistory: (id: string, params?: Record<string, unknown>) => ["creditCards", "cashbackHistory", id, params] as const,
};

export function useCreditCardDashboard() {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.dashboard,
    queryFn: async (): Promise<CreditCardDashboardData> => api.getCreditCardDashboard(),
    enabled: isAuth(),
  });
}

export function useCreditCards(params?: { limit?: number; status?: string; issuer?: string; search?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.cards(params),
    queryFn: async (): Promise<CreditCard[]> => {
      const res = await api.getCreditCards(params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCard[];
    },
    enabled: isAuth(),
  });
}

export function useCreditCard(id: string) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<CreditCard> => api.getCreditCard(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCreditCardInput | Partial<CreditCard>) => api.createCreditCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["liabilitiesSummary"] });
      useUIStore.getState().showToast("Credit card added successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version = 1 }: { id: string; data: UpdateCreditCardInput | Partial<CreditCard>; version?: number }) =>
      api.updateCreditCard(id, data, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      useUIStore.getState().showToast("Credit card updated successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.deleteCreditCard(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      useUIStore.getState().showToast("Credit card deleted successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useChangeCreditCardLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version = 1 }: { id: string; data: ChangeCreditCardLimitInput; version?: number }) =>
      api.changeCreditCardLimit(id, data, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.limitHistory(variables.id) });
      useUIStore.getState().showToast("Credit limit updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCreditCardLimitHistory(cardId: string) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.limitHistory(cardId),
    queryFn: async (): Promise<CreditCardLimitHistory[]> => {
      const res = await api.getCreditCardLimitHistory(cardId);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardLimitHistory[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useCloseCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.closeCreditCard(id, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Credit card closed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCardStatements(cardId: string, params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.statements(cardId, params),
    queryFn: async (): Promise<CreditCardStatement[]> => {
      const res = await api.getCardStatements(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardStatement[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useCreateCardStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CreateCreditCardStatementInput }) =>
      api.createCardStatement(cardId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.statements(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Statement added", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateCardStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      statementId,
      data,
    }: {
      cardId: string;
      statementId: string;
      data: UpdateCreditCardStatementInput;
    }) => api.updateCardStatement(cardId, statementId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.statements(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Statement corrected", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCardPayments(cardId: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.payments(cardId, params),
    queryFn: async (): Promise<CreditCardPayment[]> => {
      const res = await api.getCardPayments(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardPayment[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useRecordCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: RecordCreditCardPaymentInput }) =>
      api.recordCardPayment(cardId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.payments(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.statements(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["financial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      useUIStore.getState().showToast("Payment recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

function invalidateAfterPaymentCorrection(queryClient: ReturnType<typeof useQueryClient>, cardId: string) {
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.payments(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.statements(cardId) });
  queryClient.invalidateQueries({ queryKey: ["accounts"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["calendar"] });
  queryClient.invalidateQueries({ queryKey: ["healthScore"] });
}

export function useReverseCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, paymentId }: { cardId: string; paymentId: string }) =>
      api.reverseCardPayment(cardId, paymentId),
    onSuccess: (_, variables) => {
      invalidateAfterPaymentCorrection(queryClient, variables.cardId);
      useUIStore.getState().showToast("Payment reversed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useBounceCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      paymentId,
      data,
    }: {
      cardId: string;
      paymentId: string;
      data: BounceCreditCardPaymentInput;
    }) => api.bounceCardPayment(cardId, paymentId, data),
    onSuccess: (_, variables) => {
      invalidateAfterPaymentCorrection(queryClient, variables.cardId);
      useUIStore.getState().showToast("Payment marked as bounced/failed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCardTransactions(
  cardId: string,
  params?: { limit?: number; category?: string; merchant?: string; search?: string; cursor?: string }
) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.transactions(cardId, params),
    queryFn: async (): Promise<Transaction[]> => {
      const res = await api.getCardTransactions(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as Transaction[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCardTransaction(raw: any, categoryMap?: Map<string, string>): Transaction {
  const categoryId = raw.category?.id || raw.categoryId || undefined;
  let categoryName = raw.category?.name || raw.categoryName || undefined;
  if (!categoryName && categoryId && categoryMap) {
    categoryName = categoryMap.get(categoryId);
  }

  const merchantId = raw.merchant?.id || raw.merchantId || undefined;
  let merchantName = raw.merchant?.name || raw.merchantName || undefined;

  if (!merchantName && raw.description) {
    const desc = String(raw.description);
    if (desc.startsWith("UPI-")) {
      const parts = desc.split("-");
      if (parts.length >= 3) {
        const party = parts.slice(2).join("-").replace(/\s+IN$/, "").trim();
        if (party) merchantName = party;
      }
    }
  }

  let amountObj: Money;
  if (typeof raw.amount === "string" || typeof raw.amount === "number") {
    amountObj = { amount: String(raw.amount), currency: "INR" };
  } else if (raw.amount && typeof raw.amount === "object") {
    amountObj = { amount: String(raw.amount.amount || "0"), currency: raw.amount.currency || "INR" };
  } else {
    amountObj = { amount: "0", currency: "INR" };
  }

  const dateStr = raw.transactionDate || raw.date || new Date().toISOString();

  return {
    id: raw.id,
    accountId: raw.accountId || null,
    creditCardId: raw.creditCardId || null,
    emiId: raw.emiId || null,
    counterAccountId: raw.counterAccountId || null,
    categoryId,
    categoryName,
    merchantId,
    merchantName,
    amount: amountObj,
    direction: raw.direction || "OUTFLOW",
    description: raw.description || "",
    date: dateStr,
    notes: raw.notes || null,
    source: raw.source || "CARD",
    isPending: Boolean(raw.isPending),
    importRowId: raw.importRowId || null,
    version: raw.version || 1,
  };
}

export function useCardTransactionsInfinite(
  cardId: string,
  params?: { limit?: number; category?: string; merchant?: string; search?: string; cursor?: string }
) {
  return useInfiniteQuery({
    queryKey: [...CREDIT_CARD_QUERY_KEYS.transactions(cardId, params), "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const res = await api.getCardTransactions(cardId, { ...params, cursor: pageParam });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let dataList: any[] = [];
      let nextCursor: string | null | undefined = undefined;
      let hasMore = false;
      let totalCount: number | undefined = undefined;

      if (Array.isArray(res)) {
        dataList = res;
      } else if (res && typeof res === "object") {
        dataList = Array.isArray(res.data) ? res.data : [];
        nextCursor = res.nextCursor;
        hasMore = Boolean(res.hasMore);
        totalCount = res.totalCount ?? res.total;
      }

      return {
        data: dataList,
        nextCursor,
        hasMore,
        totalCount,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined),
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useCardEmis(cardId: string, params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.emis(cardId, params),
    queryFn: async (): Promise<CreditCardEmi[]> => {
      const res = await api.getCardEmis(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardEmi[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

function invalidateAfterEmiChange(queryClient: ReturnType<typeof useQueryClient>, cardId: string) {
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.emis(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.transactions(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.dashboard });
}

export function useConvertTransactionToEmi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: ConvertTransactionToEmiInput }) =>
      api.convertTransactionToEmi(cardId, data),
    onSuccess: (_, variables) => {
      invalidateAfterEmiChange(queryClient, variables.cardId);
      useUIStore.getState().showToast("Transaction converted to EMI", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateCardEmi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      emiId,
      data,
      version = 1,
    }: {
      cardId: string;
      emiId: string;
      data: UpdateCreditCardEmiInput;
      version?: number;
    }) => api.updateCardEmi(cardId, emiId, data, version),
    onSuccess: (_, variables) => {
      invalidateAfterEmiChange(queryClient, variables.cardId);
      useUIStore.getState().showToast("EMI plan updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCloseCardEmi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, emiId, version = 1 }: { cardId: string; emiId: string; version?: number }) =>
      api.closeCardEmi(cardId, emiId, version),
    onSuccess: (_, variables) => {
      invalidateAfterEmiChange(queryClient, variables.cardId);
      useUIStore.getState().showToast("EMI plan closed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCardRewards(cardId: string) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.rewards(cardId),
    queryFn: async (): Promise<CreditCardRewards> => api.getCardRewards(cardId),
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useCardRewardsHistory(cardId: string, params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.rewardsHistory(cardId, params),
    queryFn: async (): Promise<CreditCardRewardHistoryItem[]> => {
      const res = await api.getCardRewardsHistory(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardRewardHistoryItem[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useRedeemCardRewards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: RedeemCreditCardRewardsInput }) =>
      api.redeemCardRewards(cardId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.rewards(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.rewardsHistory(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.cardId) });
      useUIStore.getState().showToast("Reward points redeemed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCardDocuments(cardId: string) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.documents(cardId),
    queryFn: async (): Promise<CreditCardDocument[]> => {
      const res = await api.getCardDocuments(cardId);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardDocument[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useUploadCardDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, formData }: { cardId: string; formData: FormData }) =>
      api.uploadCardDocument(cardId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.documents(variables.cardId) });
      useUIStore.getState().showToast("Document uploaded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteCardDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, documentId }: { cardId: string; documentId: string }) =>
      api.deleteCardDocument(cardId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.documents(variables.cardId) });
      useUIStore.getState().showToast("Document deleted", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Disputes

export function useCardDisputes(cardId: string, params?: { limit?: number; cursor?: string; status?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.disputes(cardId, params),
    queryFn: async (): Promise<CreditCardDispute[]> => {
      const res = await api.getCardDisputes(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardDispute[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useCardDispute(cardId: string, disputeId: string) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.dispute(cardId, disputeId),
    queryFn: async (): Promise<CreditCardDispute> => api.getCardDispute(cardId, disputeId),
    enabled: isAuth() && Boolean(cardId) && Boolean(disputeId),
  });
}

function invalidateAfterDisputeChange(queryClient: ReturnType<typeof useQueryClient>, cardId: string) {
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.disputes(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.transactions(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.rewards(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.cashback(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.dashboard });
}

export function useRaiseCardDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: RaiseCreditCardDisputeInput }) =>
      api.raiseCardDispute(cardId, data),
    onSuccess: (_, variables) => {
      invalidateAfterDisputeChange(queryClient, variables.cardId);
      useUIStore.getState().showToast("Dispute raised — provisional credit applied", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useResolveCardDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      disputeId,
      data,
    }: {
      cardId: string;
      disputeId: string;
      data: ResolveCreditCardDisputeInput;
    }) => api.resolveCardDispute(cardId, disputeId, data),
    onSuccess: (_, variables) => {
      invalidateAfterDisputeChange(queryClient, variables.cardId);
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.dispute(variables.cardId, variables.disputeId) });
      useUIStore.getState().showToast("Dispute resolved", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Balance Transfers

export function useBalanceTransfers(cardId: string, params?: { limit?: number; cursor?: string; status?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.balanceTransfers(cardId, params),
    queryFn: async (): Promise<CreditCardBalanceTransfer[]> => {
      const res = await api.getBalanceTransfers(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardBalanceTransfer[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

function invalidateAfterBalanceTransferChange(queryClient: ReturnType<typeof useQueryClient>, cardId: string) {
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.balanceTransfers(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.payments(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.transactions(cardId) });
  queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.dashboard });
}

export function useCreateBalanceTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CreateBalanceTransferInput }) =>
      api.createBalanceTransfer(cardId, data),
    onSuccess: (_, variables) => {
      invalidateAfterBalanceTransferChange(queryClient, variables.cardId);
      invalidateAfterBalanceTransferChange(queryClient, variables.data.sourceCreditCardId);
      useUIStore.getState().showToast("Balance transfer created", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function usePrepayBalanceTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      balanceTransferId,
      data,
      version = 1,
    }: {
      cardId: string;
      balanceTransferId: string;
      data: PrepayBalanceTransferInput;
      version?: number;
    }) => api.prepayBalanceTransfer(cardId, balanceTransferId, data, version),
    onSuccess: (_, variables) => {
      invalidateAfterBalanceTransferChange(queryClient, variables.cardId);
      useUIStore.getState().showToast("Balance transfer prepaid", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCloseBalanceTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      balanceTransferId,
      version = 1,
    }: {
      cardId: string;
      balanceTransferId: string;
      version?: number;
    }) => api.closeBalanceTransfer(cardId, balanceTransferId, version),
    onSuccess: (_, variables) => {
      invalidateAfterBalanceTransferChange(queryClient, variables.cardId);
      useUIStore.getState().showToast("Balance transfer closed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Cashback

export function useCardCashback(cardId: string) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.cashback(cardId),
    queryFn: async (): Promise<CreditCardCashback> => api.getCardCashback(cardId),
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useCardCashbackHistory(cardId: string, params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: CREDIT_CARD_QUERY_KEYS.cashbackHistory(cardId, params),
    queryFn: async (): Promise<CreditCardCashbackTransaction[]> => {
      const res = await api.getCardCashbackHistory(cardId, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as CreditCardCashbackTransaction[];
    },
    enabled: isAuth() && Boolean(cardId),
  });
}

export function useRedeemCardCashback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: RedeemCreditCardCashbackInput }) =>
      api.redeemCardCashback(cardId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.cashback(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.cashbackHistory(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: CREDIT_CARD_QUERY_KEYS.detail(variables.cardId) });
      useUIStore.getState().showToast("Cashback redeemed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}
