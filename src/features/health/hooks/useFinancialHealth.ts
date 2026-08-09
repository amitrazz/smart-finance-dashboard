import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api/endpoints";
import { useAuthStore } from "../../../store/useAuthStore";
import { useUIStore } from "../../../store/useUIStore";
import {
  FinancialHealthScore,
  FinancialHealthRating,
  HealthDimensionKey,
  HealthDimensionDetail,
  HealthRecommendation,
  FinancialHealthHistoryPoint,
} from "../../../types";

const getErrorMessage = (err: unknown): string => {
  if (err !== null && typeof err === "object") {
    if ("userMessage" in err) return String((err as { userMessage: unknown }).userMessage);
    if ("message" in err) return String((err as { message: unknown }).message);
  }
  return "An unexpected error occurred. Please try again.";
};

export const HEALTH_DIMENSION_LABELS: Record<HealthDimensionKey, string> = {
  CASH_FLOW: "Cash Flow",
  SAVINGS_RATE: "Savings Rate",
  EMERGENCY_FUND: "Emergency Fund",
  DEBT_HEALTH: "Debt Health",
  CREDIT_UTILIZATION: "Credit Utilization",
  INVESTMENT_DIVERSIFICATION: "Investment Diversification",
  BILL_DISCIPLINE: "Bill Discipline",
  SPENDING_DISCIPLINE: "Spending Discipline",
};

export function getHealthRating(score: number): FinancialHealthRating {
  if (score >= 95) return "EXCEPTIONAL";
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 55) return "NEEDS_ATTENTION";
  if (score >= 40) return "POOR";
  return "CRITICAL";
}

export function getRatingLabel(rating?: string): string {
  if (!rating) return "Critical";
  switch (rating.toUpperCase()) {
    case "EXCEPTIONAL":
      return "Exceptional";
    case "EXCELLENT":
      return "Excellent";
    case "GOOD":
      return "Good";
    case "NEEDS_ATTENTION":
      return "Needs Attention";
    case "POOR":
      return "Poor";
    case "CRITICAL":
    default:
      return "Critical";
  }
}

export function getStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

export function useFinancialHealth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ["healthScore"],
    queryFn: async (): Promise<FinancialHealthScore | null> => {
      try {
        const res = await api.getFinancialHealth();
        if (res && typeof res.overallScore === "number") {
          const compScores = res.componentScores || res.components || ({} as Record<HealthDimensionKey, HealthDimensionDetail>);
          return {
            ...res,
            rating: res.rating || getHealthRating(res.overallScore),
            componentScores: compScores,
            components: compScores,
            topRecommendations: res.topRecommendations || [],
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useFinancialHealthHistory(windowArg = "30d") {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const windowParam = windowArg.toLowerCase();

  return useQuery({
    queryKey: ["healthScore", "history", windowParam],
    queryFn: async (): Promise<FinancialHealthHistoryPoint[]> => {
      try {
        const res = await api.getFinancialHealthHistory({ window: windowParam });
        if (Array.isArray(res)) return res;
        if (res && "data" in res && Array.isArray(res.data)) return res.data;
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useHealthComponents() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ["healthScore", "components"],
    queryFn: async (): Promise<HealthDimensionDetail[]> => {
      try {
        const res = await api.getHealthComponents();
        if (Array.isArray(res)) return res;
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useHealthRecommendations() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ["healthScore", "recommendations"],
    queryFn: async (): Promise<HealthRecommendation[]> => {
      try {
        const res = await api.getHealthRecommendations();
        if (Array.isArray(res)) return res;
        return [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });
}

export function useRecalculateHealthScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.recalculateHealthScore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthScore"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      useUIStore.getState().showToast("Financial Health Score recalculated!", "success");
    },
    onError: (err) => {
      useUIStore.getState().showToast(getErrorMessage(err), "error");
    },
  });
}

