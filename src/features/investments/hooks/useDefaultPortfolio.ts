import { usePortfolios, usePortfolio } from "../../../hooks/useFinanceQueries";

// The app creates one default Portfolio per user on first trade (see
// PortfolioSnapshotComputationService on the backend) — there is no
// portfolio-switcher UX yet, so every investment screen resolves "the"
// portfolio the same way: find isDefault, else fall back to the first one.
export function useDefaultPortfolio() {
  const portfoliosQuery = usePortfolios();
  const defaultPortfolioId =
    portfoliosQuery.data?.find((p) => p.isDefault)?.id || portfoliosQuery.data?.[0]?.id || "";
  const detailQuery = usePortfolio(defaultPortfolioId);

  return {
    portfolioId: defaultPortfolioId,
    hasPortfolio: Boolean(defaultPortfolioId),
    portfolio: detailQuery.data,
    isLoading: portfoliosQuery.isLoading || (Boolean(defaultPortfolioId) && detailQuery.isLoading),
    isError: portfoliosQuery.isError || detailQuery.isError,
    error: portfoliosQuery.error || detailQuery.error,
    refetch: () => {
      portfoliosQuery.refetch();
      detailQuery.refetch();
    },
  };
}
