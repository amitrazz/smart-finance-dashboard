import React from "react";
import {
  useInvestmentSummary,
  useInvestmentInsights,
  useHoldings,
  useCorporateActions,
  useInvestmentGoals,
  useIncomeDashboard,
} from "../hooks/useInvestmentQueries";
import { MetricCard } from "../components/MetricCard";
import { RiskBadge } from "../components/RiskBadge";
import { InsightCard } from "../components/InsightCard";
import { LotTable } from "../components/LotTable";
import { CorporateActionTimeline } from "../components/CorporateActionTimeline";
import { GoalProgressCard } from "../components/GoalProgressCard";
import { formatCurrency } from "../../../utils/formatters";
import { Wallet, TrendingUp, ShieldAlert, Award, DollarSign, Target } from "lucide-react";

interface InvestmentDashboardViewProps {
  onSelectAsset?: (securityId: string) => void;
}

export const InvestmentDashboardView: React.FC<InvestmentDashboardViewProps> = ({ onSelectAsset }) => {
  const { data: summary, isLoading: loadingSummary } = useInvestmentSummary();
  const { data: insights = [] } = useInvestmentInsights();
  const { data: holdings = [] } = useHoldings();
  const { data: corporateActions = [] } = useCorporateActions();
  const { data: goals = [] } = useInvestmentGoals();
  const { data: income } = useIncomeDashboard();

  if (loadingSummary || !summary) {
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

  return (
    <div className="space-y-8">
      {/* 5-Second Primary UX KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Portfolio Value"
          value={summary.currentValue}
          subtitle={`Invested: ${formatCurrency(summary.investedAmount)}`}
          icon={<Wallet className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Today's Gain / Loss"
          value={summary.todayGainLoss}
          gainLossPercent={summary.todayGainLossPercent}
          subtitle="Daily Portfolio Fluctuation"
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Lifetime Return & XIRR"
          value={summary.lifetimeReturn}
          gainLossPercent={summary.lifetimeReturnPercent}
          subtitle={`Annualized XIRR: ${summary.xirr}%`}
          icon={<Award className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />

        <MetricCard
          title="Portfolio Health & Risk"
          value={`Score ${summary.riskMetrics.overallScore}/100`}
          subtitle={`Max Sector Weight: ${summary.riskMetrics.largestSectorWeight}%`}
          badge={<RiskBadge riskScore={summary.riskMetrics.overallScore} size="sm" />}
          icon={<ShieldAlert className="w-6 h-6 text-amber-400" />}
          accentColor="amber"
        />
      </div>

      {/* Domain Quick Insights Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" /> Executive Wealth Insights & Action Items
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>

      {/* Goal Progress Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" /> Goal Mapping Progress
          </h3>
          <span className="text-xs text-slate-400 font-semibold">{goals.length} Goals Linked</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalProgressCard key={goal.goalId} goal={goal} />
          ))}
        </div>
      </div>

      {/* Top Holdings & FIFO Lot Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Top Position Holdings & Tax Lots</h3>
        <LotTable holdings={holdings.slice(0, 5)} onSelectAsset={onSelectAsset} />
      </div>

      {/* Corporate Actions & Income Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CorporateActionTimeline actions={corporateActions} />
        {income && (
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Passive Income Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Received This Year</span>
                <p className="text-xl font-extrabold text-emerald-400 font-mono">
                  {formatCurrency(income.totalReceivedThisYear)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400">Upcoming Dividends</span>
                <p className="text-xl font-extrabold text-indigo-400 font-mono">
                  {formatCurrency(income.totalUpcomingThisYear)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
