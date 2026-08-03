import React from "react";
import { useInvestmentAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { formatCurrency } from "../../../utils/formatters";
import { PieChart, Award, TrendingUp, AlertTriangle } from "lucide-react";

export const InvestmentsPage: React.FC = () => {
  const { data: inv, isLoading } = useInvestmentAnalytics();

  if (isLoading || !inv) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Investment Analytics & Allocation Drift"
        description="CAGR, XIRR returns, Sharpe ratio, best/worst position contributors, and sector drift"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Portfolio Valuation"
          value={inv.totalValuation}
          subtitle={`Total Gain: ${formatCurrency(inv.totalGain)}`}
          icon={<PieChart className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="CAGR & XIRR Returns"
          value={`${inv.xirrPercent}% XIRR`}
          subtitle={`Compounded CAGR: ${inv.cagrPercent}%`}
          icon={<Award className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Sharpe & Volatility"
          value={`${inv.sharpeRatio} Sharpe`}
          subtitle={`Volatility: ${inv.volatilityPercent}%`}
          icon={<TrendingUp className="w-6 h-6 text-purple-400" />}
          accentColor="purple"
        />

        <MetricCard
          title="Target Allocation Drift"
          value={`${inv.allocationDriftPercent}% Drift`}
          subtitle="Rebalancing alert active"
          icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
          accentColor="amber"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Best Performing Asset Position</h4>
          <h3 className="text-xl font-bold text-slate-100">{inv.bestHolding.name} ({inv.bestHolding.symbol})</h3>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono">+{inv.bestHolding.returnPercent}% Return</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">Worst Performing Asset Position</h4>
          <h3 className="text-xl font-bold text-slate-100">{inv.worstHolding.name} ({inv.worstHolding.symbol})</h3>
          <p className="text-2xl font-extrabold text-rose-400 font-mono">{inv.worstHolding.returnPercent}% Return</p>
        </div>
      </div>
    </div>
  );
};
