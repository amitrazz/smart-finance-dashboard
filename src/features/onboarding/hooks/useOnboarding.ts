import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useUIStore } from "../../../store/useUIStore";
import { QUERY_KEYS } from "../../../hooks/useFinanceQueries";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  OnboardingStatus,
  OnboardingStep,
  OnboardingProfileInput,
  OnboardingPreferencesInput,
  OnboardingAccountInput,
  OnboardingCreditCardInput,
  OnboardingLoanInput,
  OnboardingInvestmentInput,
  OnboardingGoalInput,
} from "../../../types";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    if ("userMessage" in err && typeof err.userMessage === "string") {
      return err.userMessage;
    }
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return "An unexpected error occurred. Your progress has been saved. Please try again.";
}

interface RawOnboardingStatus {
  status?: string;
  isCompleted?: boolean;
  isComplete?: boolean;
  completionPercentage?: number;
  progressPercent?: number;
  currentStep?: string | null;
  currentStepKey?: string;
  completedSteps?: string[];
  completedStepKeys?: string[];
  skippedSteps?: string[];
  skippedStepKeys?: string[];
  totalCount?: number;
  steps?: OnboardingStep[];
}

export function normalizeOnboardingStatus(raw: RawOnboardingStatus | null | undefined): OnboardingStatus {
  if (!raw) {
    return {
      status: "NOT_STARTED",
      isCompleted: false,
      completedCount: 0,
      totalCount: 7,
      completedStepKeys: [],
      skippedStepKeys: [],
      currentStepKey: "WELCOME",
      progressPercent: 0,
    };
  }

  const isCompleted =
    raw.status === "COMPLETED" ||
    Boolean(raw.isCompleted) ||
    Boolean(raw.isComplete) ||
    raw.completionPercentage === 100 ||
    raw.progressPercent === 100 ||
    raw.currentStep === "COMPLETE" ||
    raw.currentStepKey === "COMPLETE";

  const completedStepKeys = Array.isArray(raw.completedSteps)
    ? raw.completedSteps
    : Array.isArray(raw.completedStepKeys)
    ? raw.completedStepKeys
    : [];

  const skippedStepKeys = Array.isArray(raw.skippedSteps)
    ? raw.skippedSteps
    : Array.isArray(raw.skippedStepKeys)
    ? raw.skippedStepKeys
    : [];

  const currentStepKey =
    raw.currentStep ||
    raw.currentStepKey ||
    (isCompleted ? "COMPLETE" : "WELCOME");

  const totalCount = raw.totalCount || (Array.isArray(raw.steps) ? raw.steps.length : 7);
  const uniqueDone = new Set([...completedStepKeys, ...skippedStepKeys]).size;
  const progressPercent = isCompleted
    ? 100
    : (raw.completionPercentage ?? raw.progressPercent ?? Math.min(100, Math.round((uniqueDone / totalCount) * 100)));

  return {
    ...raw,
    status: raw.status || (isCompleted ? "COMPLETED" : "IN_PROGRESS"),
    isCompleted,
    completedCount: isCompleted ? totalCount : uniqueDone,
    totalCount,
    completedStepKeys,
    skippedStepKeys,
    currentStepKey,
    progressPercent,
  };
}

export function useOnboardingState() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: QUERY_KEYS.onboarding,
    queryFn: async () => {
      try {
        const rawState = await api.getOnboardingState();
        const normalized = normalizeOnboardingStatus(rawState);
        return {
          ...rawState,
          ...normalized,
        };
      } catch {
        const progress = await api.getOnboardingProgress();
        return normalizeOnboardingStatus(progress);
      }
    },
    enabled: isAuthenticated,
  });
}

export function useOnboardingStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: async () => {
      try {
        const status = await api.getOnboardingStatus();
        return normalizeOnboardingStatus(status);
      } catch {
        const state = await api.getOnboardingState();
        return normalizeOnboardingStatus(state);
      }
    },
    enabled: isAuthenticated,
  });
}

export function useOnboardingStepsCatalog() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ["onboarding", "steps"],
    queryFn: async () => {
      try {
        return await api.getOnboardingSteps();
      } catch {
        return [
          { key: "WELCOME", title: "Welcome", subtitle: "Getting Started", category: "WELCOME", isOptional: false, order: 0 },
          { key: "PROFILE", title: "Profile", subtitle: "Identity & Currency", category: "PROFILE", isOptional: false, order: 1 },
          { key: "PREFERENCES", title: "Preferences", subtitle: "Income & Payday", category: "PREFERENCES", isOptional: false, order: 2 },
          { key: "ACCOUNT", title: "Bank Account", subtitle: "Primary Account", category: "ACCOUNT", isOptional: false, order: 3 },
          { key: "CREDIT_CARD", title: "Credit Card", subtitle: "Cards & Billing", category: "CREDIT_CARD", isOptional: true, order: 4 },
          { key: "LOAN", title: "Loans", subtitle: "Mortgage & Debt", category: "LOAN", isOptional: true, order: 5 },
          { key: "INVESTMENT", title: "Investments", subtitle: "Stocks & Assets", category: "INVESTMENT", isOptional: true, order: 6 },
          { key: "GOAL", title: "Goals", subtitle: "Savings Targets", category: "GOAL", isOptional: true, order: 7 },
          { key: "COMPLETE", title: "Complete", subtitle: "All Set!", category: "COMPLETE", isOptional: false, order: 8 },
        ];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useSubmitProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingProfileInput) => api.postOnboardingProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
      useUIStore.getState().showToast("Profile saved", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSubmitPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingPreferencesInput) => api.postOnboardingPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
      useUIStore.getState().showToast("Preferences saved", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSubmitAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingAccountInput) => api.postOnboardingAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Bank account added", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSubmitCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingCreditCardInput) => api.postOnboardingCreditCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCards() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Credit card added", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSubmitLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingLoanInput) => api.postOnboardingLoan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Loan information saved", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSubmitInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingInvestmentInput) => api.postOnboardingInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.holdings() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Investment added", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSubmitGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingGoalInput) => api.postOnboardingGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.goals() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      useUIStore.getState().showToast("Financial goal added", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useSkipStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepKey: string) => api.postOnboardingSkip(stepKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      useUIStore.getState().showToast("Step skipped", "info");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.postOnboardingComplete(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts() });
      useUIStore.getState().showToast("Welcome to pFOS! Your workspace is ready.", "success");
      useUIStore.getState().setActiveTab("dashboard");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

export function useResetOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.postOnboardingReset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onboarding, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"], refetchType: "all" });
      useUIStore.getState().showToast("Onboarding progress reset", "info");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}
