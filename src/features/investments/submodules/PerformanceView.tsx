import React, { useMemo, useState } from "react";
import { useInvestmentReturns, usePortfolioHistory } from "../../../hooks/useFinanceQueries";
import { useDefaultPortfolio } from "../hooks/useDefaultPortfolio";
import { PortfolioChart, PortfolioChartTimeframe } from "../components/PortfolioChart";
import { GainLossBadge } from "../components/GainLossBadge";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { Award, Wallet } from "lucide-react";

const timeframeToDateFrom = (tf: PortfolioChartTimeframe): string | undefined => {
  if (tf === "ALL") return undefined;
  const now = new Date();
  const months = tf === "1M" ? 1 : tf === "6M" ? 6 : 12;
  now.setMonth(now.getMonth() - months);
  return now.toISOString().split("T")[0];
};

// Only what the backend actually computes: XIRR + market value/cost basis
// breakdown from GET /finance/analytics/investment-returns, and the
// portfolio value/cost-basis history. CAGR, Sharpe, Alpha/Beta, benchmark
// comparison, and heatmaps have no backend support and are not shown.
export const PerformanceView: React.FC = () => {
  const { data: returns, isLoading: isReturnsLoading, isError, refetch } = useInvestmentReturns();
  const { portfolioId } = useDefaultPortfolio();
  const [timeframe, setTimeframe] = useState<PortfolioChartTimeframe>("1Y");
  const { data: history = [] } = usePortfolioHistory(
    portfolioId,
    portfolioId ? { dateFrom: timeframeToDateFrom(timeframe), limit: 100 } : undefined
  );
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate)),
    [history]
  );

  if (isReturnsLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-900 rounded-2xl" />
          <div className="h-24 bg-slate-900 rounded-2xl" />
          <div className="h-24 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load investment returns" onRetry={refetch} />;
  }

  const portfolioReturns = returns?.[0];

  if (!portfolioReturns) {
    return <EmptyState title="No Returns Data Yet" message="Record trades to start tracking portfolio returns." />;
  }

  const xirrPercent = portfolioReturns.xirr !== null ? parseFloat(portfolioReturns.xirr) * 100 : null;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">XIRR</span>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">
            {xirrPercent !== null ? formatPercent(xirrPercent) : "—"}
          </p>
          <span className="text-[10px] text-slate-500">Cash-flow weighted return</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Market Value</span>
          <p className="text-xl font-extrabold text-indigo-400 font-mono">
            {formatCurrency({ amount: portfolioReturns.totalMarketValue, currency: "INR" })}
          </p>
          <span className="text-[10px] text-slate-500">Cost Basis: {formatCurrency({ amount: portfolioReturns.totalCostBasis, currency: "INR" })}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Unrealized Gain</span>
          <p className="text-xl font-extrabold text-purple-400 font-mono">
            {formatCurrency({ amount: portfolioReturns.totalUnrealizedGain, currency: "INR" })}
          </p>
          <span className="text-[10px] text-slate-500">Across all open holdings</span>
        </div>
      </div>

      {/* Value History */}
      <PortfolioChart data={sortedHistory} timeframe={timeframe} onTimeframeChange={setTimeframe} />

      {/* Per-Holding Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" /> Returns By Holding
        </h3>
        {portfolioReturns.holdings.length === 0 ? (
          <EmptyState icon={<Wallet className="w-8 h-8 text-slate-600 mx-auto" />} title="No Holdings" message="No open holdings to break down." />
        ) : (
          <div className="space-y-3">
            {portfolioReturns.holdings.map((h) => (
              <div key={h.securityId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h5 className="font-bold text-slate-100 text-sm">{h.name || "Unknown Security"}</h5>
                  <span className="text-xs text-slate-400 font-mono">{h.symbol || "—"}</span>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-slate-100 font-mono text-sm block">
                    {formatCurrency({ amount: h.marketValue, currency: "INR" })}
                  </span>
                  <GainLossBadge
                    amount={{ amount: h.unrealizedGain, currency: "INR" }}
                    percent={parseFloat(h.unrealizedGainPercent)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
