import React from "react";
import { useDefaultPortfolio } from "../hooks/useDefaultPortfolio";
import { useTrades, useHealthComponents, useGoals } from "../../../hooks/useFinanceQueries";
import { MetricCard } from "../components/MetricCard";
import { InsightCard } from "../components/InsightCard";
import { LotTable } from "../components/LotTable";
import { GoalProgressCard } from "../components/GoalProgressCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { Holding } from "../../../types";
import { Wallet, TrendingUp, Award, PieChart, Target } from "lucide-react";

interface InvestmentDashboardViewProps {
  onSelectAsset?: (holding: Holding) => void;
}

export const InvestmentDashboardView: React.FC<InvestmentDashboardViewProps> = ({ onSelectAsset }) => {
  const { portfolio, portfolioId, hasPortfolio, isLoading, isError, refetch } = useDefaultPortfolio();
  const { data: trades = [] } = useTrades(portfolioId ? { portfolioId, limit: 5 } : undefined);
  const { data: healthComponents = [] } = useHealthComponents();
  const { data: goals = [] } = useGoals();

  const diversificationComponent = healthComponents.find((c) => c.code === "INVESTMENT_DIVERSIFICATION");
  const linkedGoals = goals.filter((g) => g.linkedInvestmentIds?.length > 0).slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
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
        message="Record your first trade to create a portfolio and start tracking holdings, returns, and allocation."
      />
    );
  }

  const snapshot = portfolio.latestSnapshot;
  const xirrPercent = snapshot.xirr !== null ? parseFloat(snapshot.xirr) * 100 : null;

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Portfolio Market Value"
          value={snapshot.totalMarketValue}
          subtitle={`Cost Basis: ${formatCurrency(snapshot.totalCostBasis)}`}
          icon={<Wallet className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />
        <MetricCard
          title="Unrealized Gain"
          value={snapshot.totalUnrealizedGain}
          subtitle="Across all open holdings"
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          accentColor={parseFloat(snapshot.totalUnrealizedGain.amount) >= 0 ? "emerald" : "rose"}
        />
        <MetricCard
          title="XIRR"
          value={xirrPercent !== null ? formatPercent(xirrPercent) : "—"}
          subtitle="Cash-flow weighted return"
          icon={<Award className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />
        <MetricCard
          title="Realized Gain (Lifetime)"
          value={snapshot.totalRealizedGain}
          subtitle={`${portfolio.holdings.length} open holdings`}
          icon={<PieChart className="w-6 h-6 text-sky-400" />}
          accentColor="sky"
        />
      </div>

      {/* Investment Diversification Insight */}
      {diversificationComponent && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-100">Portfolio Health</h3>
          <InsightCard component={diversificationComponent} />
        </div>
      )}

      {/* Goal Progress Overview */}
      {linkedGoals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Investment-Linked Goals
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {linkedGoals.map((goal) => (
              <GoalProgressCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Top Holdings */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Top Holdings</h3>
        <LotTable holdings={portfolio.holdings.slice(0, 5)} onSelectAsset={onSelectAsset} />
      </div>

      {/* Recent Trades */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Recent Trades</h3>
        {trades.length === 0 ? (
          <EmptyState title="No Trades Yet" message="Recorded trades will appear here." />
        ) : (
          <div className="space-y-2">
            {trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="font-bold text-slate-100">{t.security?.symbol || "—"}</span>
                <span className="font-semibold text-slate-400">{t.type}</span>
                <span className="font-mono text-slate-400">{t.quantity} units</span>
                <span className="font-mono text-slate-500">{t.tradeDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
