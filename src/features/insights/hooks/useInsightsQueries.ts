import { useQuery, useMutation } from "@tanstack/react-query";
import { insightsApi } from "../services/insightsApi";
import { TimeHorizon, AnalyticsReportType } from "../types/insightsTypes";
import { useUIStore } from "../../../store/useUIStore";

export const INSIGHTS_QUERY_KEYS = {
  health: ["insights", "health"],
  netWorth: (timeframe: TimeHorizon) => ["insights", "netWorth", timeframe],
  cashFlow: ["insights", "cashFlow"],
  spending: ["insights", "spending"],
  income: ["insights", "income"],
  budgets: ["insights", "budgets"],
  goals: ["insights", "goals"],
  investments: ["insights", "investments"],
  debts: ["insights", "debts"],
  subscriptions: ["insights", "subscriptions"],
  trends: ["insights", "trends"],
  forecasts: (horizon: TimeHorizon) => ["insights", "forecasts", horizon],
  recommendations: ["insights", "recommendations"],
  risks: ["insights", "risks"],
};

export function useFinancialHealthAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.health,
    queryFn: () => insightsApi.getFinancialHealth(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useNetWorthAnalytics(timeframe: TimeHorizon = "1Y") {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.netWorth(timeframe),
    queryFn: () => insightsApi.getNetWorthAnalytics(),
  });
}

export function useCashFlowAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.cashFlow,
    queryFn: () => insightsApi.getCashFlowAnalytics(),
  });
}

export function useSpendingAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.spending,
    queryFn: () => insightsApi.getSpendingAnalytics(),
  });
}

export function useIncomeAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.income,
    queryFn: () => insightsApi.getIncomeAnalytics(),
  });
}

export function useBudgetAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.budgets,
    queryFn: () => insightsApi.getBudgetAnalytics(),
  });
}

export function useGoalAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.goals,
    queryFn: () => insightsApi.getGoalAnalytics(),
  });
}

export function useInvestmentAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.investments,
    queryFn: () => insightsApi.getInvestmentAnalytics(),
  });
}

export function useDebtAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.debts,
    queryFn: () => insightsApi.getDebtAnalytics(),
  });
}

export function useSubscriptionAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.subscriptions,
    queryFn: () => insightsApi.getSubscriptionAnalytics(),
  });
}

export function useTrendAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.trends,
    queryFn: () => insightsApi.getTrendAnalytics(),
  });
}

export function useForecastAnalytics(horizon: TimeHorizon = "1Y") {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.forecasts(horizon),
    queryFn: () => insightsApi.getForecastAnalytics(horizon),
  });
}

export function useRecommendationInbox() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.recommendations,
    queryFn: () => insightsApi.getRecommendations(),
  });
}

export function useRiskMatrixAnalytics() {
  return useQuery({
    queryKey: INSIGHTS_QUERY_KEYS.risks,
    queryFn: () => insightsApi.getRiskMatrix(),
  });
}

export function useGenerateAnalyticsReport() {
  return useMutation({
    mutationFn: (reportType: AnalyticsReportType) => insightsApi.generateAnalyticsReport(reportType),
    onSuccess: () => {
      useUIStore.getState().showToast("Analytics report generated successfully", "success");
    },
  });
}
