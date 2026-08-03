import React, { useState } from "react";
import { usePerformanceAnalytics } from "../hooks/useInvestmentQueries";
import { PortfolioChart } from "../components/PortfolioChart";
import { formatCurrency } from "../../../utils/formatters";
import { TrendingUp, ShieldAlert, Flame } from "lucide-react";

export const PerformanceView: React.FC = () => {
  const [timeframe] = useState("1Y");
  const { data: analytics, isLoading } = usePerformanceAnalytics(timeframe);

  if (isLoading || !analytics) return null;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">CAGR %</span>
          <p className="text-xl font-extrabold text-indigo-400 font-mono">{analytics.cagr}%</p>
          <span className="text-[10px] text-slate-500">Compounded Annual</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">XIRR %</span>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">{analytics.xirr}%</p>
          <span className="text-[10px] text-slate-500">Cash-flow Weighted</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Sharpe Ratio</span>
          <p className="text-xl font-extrabold text-sky-400 font-mono">{analytics.sharpeRatio}</p>
          <span className="text-[10px] text-slate-500">Risk-Adjusted Return</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Alpha / Beta</span>
          <p className="text-xl font-extrabold text-purple-400 font-mono">
            +{analytics.alpha} / {analytics.beta}
          </p>
          <span className="text-[10px] text-slate-500">Outperformance / Vol</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Max Drawdown</span>
          <p className="text-xl font-extrabold text-rose-400 font-mono">{analytics.maxDrawdownPercent}%</p>
          <span className="text-[10px] text-slate-500">Peak to Trough</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Benchmark Return</span>
          <p className="text-xl font-extrabold text-amber-400 font-mono">+{analytics.benchmarkXirr}%</p>
          <span className="text-[10px] text-slate-500">{analytics.benchmarkName}</span>
        </div>
      </div>

      {/* Main Growth Chart */}
      <PortfolioChart data={analytics.growthHistory} benchmarkName={analytics.benchmarkName} />

      {/* Contribution Analysis: Top Contributors vs Detractors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Top Portfolio Contributors
          </h3>
          <div className="space-y-3">
            {analytics.topContributors.map((item) => (
              <div key={item.securityId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h5 className="font-bold text-slate-100 text-sm">{item.securityName}</h5>
                  <span className="text-xs text-slate-400 font-mono">{item.symbol} • {item.assetClass}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400 font-mono text-sm block">
                    {formatCurrency(item.absoluteReturnAmount)}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    +{item.percentageContributionToPortfolio.toFixed(2)}% Contribution
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" /> Top Portfolio Detractors
          </h3>
          <div className="space-y-3">
            {analytics.topDetractors.map((item) => (
              <div key={item.securityId} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h5 className="font-bold text-slate-100 text-sm">{item.securityName}</h5>
                  <span className="text-xs text-slate-400 font-mono">{item.symbol} • {item.assetClass}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-400 font-mono text-sm block">
                    {formatCurrency(item.absoluteReturnAmount)}
                  </span>
                  <span className="text-xs text-rose-400 font-semibold">
                    {item.percentageContributionToPortfolio.toFixed(2)}% Impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" /> Performance Heatmap & Returns Map
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {analytics.heatmapData.map((item) => (
            <div
              key={item.symbol}
              className={`p-4 rounded-2xl border space-y-1 text-center ${
                item.totalReturnPercent > 30
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : item.totalReturnPercent > 0
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              <span className="font-bold text-slate-100 text-sm block">{item.symbol}</span>
              <span className="text-[10px] text-slate-400 block truncate">{item.securityName}</span>
              <span className="text-sm font-extrabold font-mono block">
                {item.totalReturnPercent > 0 ? "+" : ""}{item.totalReturnPercent.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
