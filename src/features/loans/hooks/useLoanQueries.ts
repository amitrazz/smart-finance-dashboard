import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  Loan,
  LoanDashboardData,
  LoanScheduleItem,
  LoanPayment,
  LoanDocument,
  LoanInterestRateHistory,
  CreateLoanInput,
  UpdateLoanInput,
} from "../../../types";

const isAuth = () => useAuthStore.getState().isAuthenticated;

const getErrorMessage = (err: unknown) => {
  const e = err as { message?: string; error?: string } | undefined;
  return e?.message || e?.error || "An error occurred. Please try again.";
};

export const LOAN_QUERY_KEYS = {
  loans: (params?: Record<string, unknown>) => ["loans", params] as const,
  dashboard: ["loans", "dashboard"] as const,
  detail: (id: string) => ["loans", "detail", id] as const,
  schedule: (id: string) => ["loans", "schedule", id] as const,
  payments: (id: string, params?: Record<string, unknown>) => ["loans", "payments", id, params] as const,
  documents: (id: string) => ["loans", "documents", id] as const,
  rateHistory: (id: string) => ["loans", "rateHistory", id] as const,
};

export function useLoans(params?: { status?: string; type?: string; search?: string; limit?: number }) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.loans(params),
    queryFn: async () => {
      const res = await api.getLoans(params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as Loan[];
    },
    enabled: isAuth(),
  });
}

export function useLoanDashboard() {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.dashboard,
    queryFn: async (): Promise<LoanDashboardData> => api.getLoanDashboard(),
    enabled: isAuth(),
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.detail(id),
    queryFn: () => api.getLoan(id),
    enabled: isAuth() && Boolean(id),
  });
}

export function useLoanSchedule(id: string) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.schedule(id),
    queryFn: async () => {
      const res = await api.getLoanSchedule(id);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as LoanScheduleItem[];
    },
    enabled: isAuth() && Boolean(id),
  });
}

// Backwards compatibility alias
export const useEmiSchedule = useLoanSchedule;

export function useLoanPayments(id: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.payments(id, params),
    queryFn: async () => {
      const res = await api.getLoanPayments(id, params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      return [] as LoanPayment[];
    },
    enabled: isAuth() && Boolean(id),
  });
}

export function useLoanDocuments(id: string) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.documents(id),
    queryFn: async () => {
      const res = await api.getLoanDocuments(id);
      return Array.isArray(res) ? res : ([] as LoanDocument[]);
    },
    enabled: isAuth() && Boolean(id),
  });
}

export function useLoanInterestRateHistory(id: string) {
  return useQuery({
    queryKey: LOAN_QUERY_KEYS.rateHistory(id),
    queryFn: async () => {
      const res = await api.getLoanInterestRateHistory(id);
      return Array.isArray(res) ? res : ([] as LoanInterestRateHistory[]);
    },
    enabled: isAuth() && Boolean(id),
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoanInput) => api.createLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      useUIStore.getState().showToast("Loan recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version = 1 }: { id: string; data: UpdateLoanInput; version?: number }) =>
      api.updateLoan(id, data, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.id) });
      useUIStore.getState().showToast("Loan details updated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCloseLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.closeLoan(id, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.id) });
      useUIStore.getState().showToast("Loan closed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function usePauseLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.pauseLoan(id, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.id) });
      useUIStore.getState().showToast("Loan repayments paused", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useResumeLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.resumeLoan(id, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.id) });
      useUIStore.getState().showToast("Loan repayments resumed", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useCancelLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version = 1 }: { id: string; version?: number }) => api.cancelLoan(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      useUIStore.getState().showToast("Loan cancelled", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function usePayInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      scheduleId,
      data,
    }: {
      loanId: string;
      scheduleId: string;
      data?: {
        paidAmount?: string;
        paidDate?: string;
        paymentMethod?: string;
        reference?: string;
        principalPortion?: string;
        interestPortion?: string;
        penaltyPortion?: string;
      };
    }) => api.payLoanInstallment(loanId, scheduleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.schedule(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.payments(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["financial-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["financialHealth"] });
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      useUIStore.getState().showToast("EMI Payment recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

// Backwards compatibility alias
export const useMarkEmiPaid = () => {
  const mutation = usePayInstallment();
  return {
    ...mutation,
    mutate: ({ loanId, emiId }: { loanId: string; emiId: string }) =>
      mutation.mutate({ loanId, scheduleId: emiId }),
  };
};

export function useRecordExtraPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      data,
    }: {
      loanId: string;
      data: {
        paidAmount: string;
        paidDate?: string;
        paymentMethod?: string;
        reference?: string;
        principalPortion?: string;
        interestPortion?: string;
        penaltyPortion?: string;
        notes?: string;
      };
    }) => api.recordExtraLoanPayment(loanId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.schedule(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.payments(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      useUIStore.getState().showToast("Extra prepayment recorded successfully", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useReverseLoanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, paymentId }: { loanId: string; paymentId: string }) =>
      api.reverseLoanPayment(loanId, paymentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.schedule(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.payments(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.loanId) });
      useUIStore.getState().showToast("Payment reversed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useChangeInterestRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      data,
      version = 1,
    }: {
      loanId: string;
      data: { newRate: string; effectiveDate: string; reason?: string };
      version?: number;
    }) => api.changeLoanInterestRate(loanId, data, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.schedule(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.rateHistory(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.detail(variables.loanId) });
      useUIStore.getState().showToast("Interest rate updated and schedule regenerated", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useAddLoanDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      data,
    }: {
      loanId: string;
      data: { category: string; fileName: string; storageKey: string; mimeType: string; sizeBytes: number };
    }) => api.addLoanDocument(loanId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.documents(variables.loanId) });
      useUIStore.getState().showToast("Document attached to loan", "success");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}

export function useDeleteLoanDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, documentId }: { loanId: string; documentId: string }) =>
      api.deleteLoanDocument(loanId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LOAN_QUERY_KEYS.documents(variables.loanId) });
      useUIStore.getState().showToast("Document removed", "info");
    },
    onError: (err) => useUIStore.getState().showToast(getErrorMessage(err), "error"),
  });
}
