import React from "react";
import { useInvestmentSummary, usePerformanceAnalytics, useInvestmentTransactions } from "../hooks/useInvestmentQueries";
import { MetricCard } from "../components/MetricCard";
import { PortfolioChart } from "../components/PortfolioChart";
import { RiskBadge } from "../components/RiskBadge";
import { TransactionTable } from "../components/TransactionTable";
import { formatCurrency } from "../../../utils/formatters";
import { Wallet, TrendingUp, Award, DollarSign, ShieldAlert, CheckCircle2 } from "lucide-react";

export const PortfolioOverviewView: React.FC = () => {
  const { data: summary } = useInvestmentSummary();
  const { data: analytics } = usePerformanceAnalytics();
  const { data: txns = [] } = useInvestmentTransactions();

  if (!summary || !analytics) return null;

  return (
    <div className="space-y-8">
      {/* Portfolio Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">{summary.name}</h3>
            <p className="text-xs text-slate-400">Benchmark: {summary.benchmarkName} • Currency: {summary.currency}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Cash Position:</span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
            {formatCurrency(summary.availableCash)}
          </span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Valuation"
          value={summary.currentValue}
          subtitle={`Invested: ${formatCurrency(summary.investedAmount)}`}
          icon={<Wallet className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Today's Return"
          value={summary.todayGainLoss}
          gainLossPercent={summary.todayGainLossPercent}
          icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Total Lifetime Gain"
          value={summary.lifetimeReturn}
          gainLossPercent={summary.lifetimeReturnPercent}
          subtitle={`CAGR: ${summary.cagr}% | XIRR: ${summary.xirr}%`}
          icon={<Award className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />

        <MetricCard
          title="Benchmark Comparison"
          value={`+${summary.benchmarkReturnPercent}%`}
          subtitle={summary.outperformingBenchmark ? "Outperforming Index" : "Underperforming Index"}
          badge={
            summary.outperformingBenchmark ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> +4.22% Alpha
              </span>
            ) : undefined
          }
          icon={<DollarSign className="w-6 h-6 text-sky-400" />}
          accentColor="sky"
        />
      </div>

      {/* Portfolio Growth Chart */}
      <PortfolioChart data={analytics.growthHistory} benchmarkName={summary.benchmarkName} />

      {/* Risk Metrics Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" /> Portfolio Risk & Concentration Audit
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-xs block">Overall Risk Rating</span>
            <RiskBadge category={summary.riskMetrics.riskCategory} size="sm" />
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-xs block">Largest Holding Weight</span>
            <span className="text-xl font-bold text-slate-100 mt-1 block">
              {summary.riskMetrics.largestHoldingWeight}%
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-xs block">Largest Sector Weight</span>
            <span className="text-xl font-bold text-slate-100 mt-1 block">
              {summary.riskMetrics.largestSectorWeight}%
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-xs block">Portfolio Volatility</span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">
              {analytics.volatilityPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100">Recent Portfolio Trades & Transactions</h3>
        <TransactionTable transactions={txns.slice(0, 5)} />
      </div>
    </div>
  );
};
