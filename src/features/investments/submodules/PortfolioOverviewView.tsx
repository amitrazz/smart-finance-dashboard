import React, { useMemo, useState } from "react";
import { useDefaultPortfolio } from "../hooks/useDefaultPortfolio";
import { usePortfolioHistory, useTrades } from "../../../hooks/useFinanceQueries";
import { MetricCard } from "../components/MetricCard";
import { PortfolioChart, PortfolioChartTimeframe } from "../components/PortfolioChart";
import { TransactionTable } from "../components/TransactionTable";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { Wallet, TrendingUp, Award, PieChart } from "lucide-react";

const timeframeToDateFrom = (tf: PortfolioChartTimeframe): string | undefined => {
  if (tf === "ALL") return undefined;
  const now = new Date();
  const months = tf === "1M" ? 1 : tf === "6M" ? 6 : 12;
  now.setMonth(now.getMonth() - months);
  return now.toISOString().split("T")[0];
};

export const PortfolioOverviewView: React.FC = () => {
  const { portfolio, portfolioId, hasPortfolio, isLoading, isError, refetch } = useDefaultPortfolio();
  const [timeframe, setTimeframe] = useState<PortfolioChartTimeframe>("1Y");
  const { data: history = [] } = usePortfolioHistory(
    portfolioId,
    portfolioId ? { dateFrom: timeframeToDateFrom(timeframe), limit: 100 } : undefined
  );
  const { data: trades = [] } = useTrades(portfolioId ? { portfolioId, limit: 5 } : undefined);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate)),
    [history]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-16 bg-slate-900 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-900 rounded-3xl" />
          <div className="h-32 bg-slate-900 rounded-3xl" />
          <div className="h-32 bg-slate-900 rounded-3xl" />
          <div className="h-32 bg-slate-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load portfolio" onRetry={refetch} />;
  }

  if (!hasPortfolio || !portfolio) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10 text-slate-600 mx-auto" />}
        title="No Portfolio Yet"
        message="Record your first trade to create a portfolio."
      />
    );
  }

  const snapshot = portfolio.latestSnapshot;
  const xirrPercent = snapshot.xirr !== null ? parseFloat(snapshot.xirr) * 100 : null;

  return (
    <div className="space-y-8">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">{portfolio.name}</h3>
            <p className="text-xs text-slate-400">
              Base Currency: {portfolio.baseCurrency} {portfolio.isDefault && "• Default Portfolio"}
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-500">Snapshot as of {snapshot.snapshotDate}</span>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Market Value"
          value={snapshot.totalMarketValue}
          subtitle={`Cost Basis: ${formatCurrency(snapshot.totalCostBasis)}`}
          icon={<Wallet className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />
        <MetricCard
          title="Unrealized Gain"
          value={snapshot.totalUnrealizedGain}
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          accentColor={parseFloat(snapshot.totalUnrealizedGain.amount) >= 0 ? "emerald" : "rose"}
        />
        <MetricCard
          title="XIRR"
          value={xirrPercent !== null ? formatPercent(xirrPercent) : "—"}
          subtitle="Cash-flow weighted"
          icon={<Award className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />
        <MetricCard
          title="Realized Gain (Lifetime)"
          value={snapshot.totalRealizedGain}
          icon={<PieChart className="w-6 h-6 text-sky-400" />}
          accentColor="sky"
        />
      </div>

      {/* Portfolio Growth Chart */}
      <PortfolioChart data={sortedHistory} timeframe={timeframe} onTimeframeChange={setTimeframe} />

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Recent Trades</h3>
        <TransactionTable transactions={trades} />
      </div>
    </div>
  );
};
