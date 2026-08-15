import React from "react";
import { useDefaultPortfolio } from "../hooks/useDefaultPortfolio";
import { useTrades, useHealthComponents, useGoals } from "../../../hooks/useFinanceQueries";
import { MetricCard } from "../components/MetricCard";
import { InsightCard } from "../components/InsightCard";
import { LotTable } from "../components/LotTable";
import { GoalProgressCard } from "../components/GoalProgressCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { formatCurrency } from "../../../utils/formatters";
import { describePortfolioReturn, describeRealizedGain } from "../utils/portfolioReturn";
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
  const portfolioReturn = describePortfolioReturn(snapshot);

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
          title={portfolioReturn.title}
          value={portfolioReturn.value ?? "—"}
          subtitle={portfolioReturn.subtitle}
          icon={<Award className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />
        <MetricCard
          title="Realized Gain (Lifetime)"
          value={snapshot.totalRealizedGain}
          subtitle={describeRealizedGain(snapshot)}
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
        {/*
          Trade rows are a grid, not `justify-between`.

          Flex distributes free space *within each row independently*, so a long
          symbol pushed that row's "BUY" and unit count sideways while a short
          one let them drift back — four columns that never lined up with the row
          above. A shared grid template gives every row the same column edges,
          and the numeric columns are right-aligned and `tabular-nums` so the
          digits stack too.
        */}
        {trades.length === 0 ? (
          <EmptyState title="No Trades Yet" message="Recorded trades will appear here." />
        ) : (
          <div className="space-y-2">
            {trades.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs sm:grid-cols-[minmax(0,2fr)_5rem_minmax(0,1fr)_6.5rem]"
              >
                <span className="truncate font-bold text-slate-100">{t.security?.symbol || "—"}</span>
                <span className="text-right font-semibold text-slate-400 sm:text-left">{t.type}</span>
                <span className="font-mono tabular-nums text-slate-400 sm:text-right">
                  {t.quantity} units
                </span>
                <span className="text-right font-mono tabular-nums text-slate-500">
                  {t.tradeDate}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
