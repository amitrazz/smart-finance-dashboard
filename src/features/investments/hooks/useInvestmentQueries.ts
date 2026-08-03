import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investmentApi } from "../services/investmentApi";
import { InvestmentFilterState, ReportType } from "../types/investmentTypes";
import { useUIStore } from "../../../store/useUIStore";

export const INVESTMENT_QUERY_KEYS = {
  summary: (portfolioId?: string) => ["investments", "summary", portfolioId],
  insights: ["investments", "insights"],
  holdings: (filters?: InvestmentFilterState) => ["investments", "holdings", filters],
  lots: (holdingId: string) => ["investments", "lots", holdingId],
  asset: (securityId: string) => ["investments", "asset", securityId],
  corporateActions: ["investments", "corporateActions"],
  performance: (timeframe: string) => ["investments", "performance", timeframe],
  allocation: ["investments", "allocation"],
  goals: ["investments", "goals"],
  income: ["investments", "income"],
  transactions: (filters?: InvestmentFilterState) => ["investments", "transactions", filters],
  watchlist: ["investments", "watchlist"],
  search: (query: string) => ["investments", "search", query],
};

export function useInvestmentSummary(portfolioId?: string) {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.summary(portfolioId),
    queryFn: () => investmentApi.getPortfolioSummary(portfolioId),
    staleTime: 1000 * 60 * 2, // 2 mins
  });
}

export function useInvestmentInsights() {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.insights,
    queryFn: () => investmentApi.getInsights(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useHoldings(filters?: InvestmentFilterState) {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.holdings(filters),
    queryFn: () => investmentApi.getHoldings(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useHoldingLots(holdingId: string) {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.lots(holdingId),
    queryFn: () => investmentApi.getHoldingLots(holdingId),
    enabled: Boolean(holdingId),
  });
}

export function useAssetDetails(securityId: string) {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.asset(securityId),
    queryFn: () => investmentApi.getAssetDetails(securityId),
    enabled: Boolean(securityId),
  });
}

export function useCorporateActions() {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.corporateActions,
    queryFn: () => investmentApi.getCorporateActions(),
  });
}

export function usePerformanceAnalytics(timeframe: string = "1Y") {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.performance(timeframe),
    queryFn: () => investmentApi.getPerformanceAnalytics(timeframe),
  });
}

export function useAllocationOverview() {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.allocation,
    queryFn: () => investmentApi.getAllocationOverview(),
  });
}

export function useInvestmentGoals() {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.goals,
    queryFn: () => investmentApi.getInvestmentGoals(),
  });
}

export function useIncomeDashboard() {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.income,
    queryFn: () => investmentApi.getIncomeDashboard(),
  });
}

export function useInvestmentTransactions(filters?: InvestmentFilterState) {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.transactions(filters),
    queryFn: () => investmentApi.getTransactions(filters),
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.watchlist,
    queryFn: () => investmentApi.getWatchlist(),
  });
}

export function useToggleWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (securityId: string) => investmentApi.toggleWatchlist(securityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVESTMENT_QUERY_KEYS.watchlist });
      useUIStore.getState().showToast("Watchlist updated", "success");
    },
  });
}

export function useCreateImportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceType, fileName }: { sourceType: string; fileName: string }) =>
      investmentApi.createImportJob(sourceType, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries();
      useUIStore.getState().showToast("Import job created successfully", "success");
    },
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: ({ reportType, financialYear }: { reportType: ReportType; financialYear?: string }) =>
      investmentApi.generateReport(reportType, financialYear),
    onSuccess: () => {
      useUIStore.getState().showToast("Report generated successfully", "success");
    },
  });
}

export function useGlobalInvestmentSearch(query: string) {
  return useQuery({
    queryKey: INVESTMENT_QUERY_KEYS.search(query),
    queryFn: () => investmentApi.searchInvestments(query),
    enabled: query.trim().length > 0,
  });
}
