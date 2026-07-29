import React from "react";
import { useHoldings, useTrades, usePortfolios } from "../../hooks/useFinanceQueries";
import { formatCurrency, formatPercent } from "../../utils/formatters";
import { Holding, Trade } from "../../types";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const InvestmentsView: React.FC = () => {
  const { data: holdings = [], isLoading: loadingHoldings, isError, error, refetch } = useHoldings();
  const { data: trades = [] } = useTrades();
  const { data: portfolios = [] } = usePortfolios();

  if (loadingHoldings) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
          <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
          <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Investments</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve investment holdings."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const totalValue = holdings.reduce((acc, h) => acc + parseFloat(h.currentValue?.amount || "0"), 0);
  const totalGain = holdings.reduce((acc, h) => acc + parseFloat(h.unrealizedGain?.amount || "0"), 0);
  const totalGainPct = totalValue > 0 ? (totalGain / Math.max(1, totalValue - totalGain)) * 100 : 0;
  const blendedXirr = portfolios[0]?.xirr ? `${portfolios[0].xirr}%` : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Investment Portfolio & Holdings</h2>
        <p className="text-xs text-slate-400">Unified tracking across Mutual Funds, Indian Equities, Gold, SGBs, PPF & FDs</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Total Portfolio Value</p>
          <p className="text-3xl font-extrabold text-slate-100">
            {formatCurrency({ amount: totalValue.toFixed(2), currency: "INR" })}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Unrealized Total Gain</p>
          <p className="text-3xl font-extrabold text-emerald-400">
            {formatCurrency({ amount: totalGain.toFixed(2), currency: "INR" })}
          </p>
          <p className="text-xs text-emerald-400 font-semibold">{formatPercent(totalGainPct)} Total Return</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Blended XIRR</p>
          <p className="text-3xl font-extrabold text-indigo-400">{blendedXirr}</p>
          <p className="text-xs text-slate-400 font-medium">Annualized Return Rate</p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-100">Holdings Breakdown</h3>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Security / Fund</th>
                  <th className="p-4">Asset Class</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Avg Cost</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">Current Value</th>
                  <th className="p-4 text-right">Gain / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                      No holdings found in portfolio.
                    </td>
                  </tr>
                ) : (
                  holdings.map((h: Holding) => (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-100">
                        <div>
                          <span>{h.securityName}</span>
                          <p className="text-xs text-slate-400 font-mono">{h.symbol}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                          {h.assetClass}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-200">{h.quantity}</td>
                      <td className="p-4 text-xs text-slate-400">{formatCurrency(h.avgCostPrice)}</td>
                      <td className="p-4 text-xs font-semibold text-slate-200">{formatCurrency(h.currentPrice)}</td>
                      <td className="p-4 font-bold text-slate-100">{formatCurrency(h.currentValue)}</td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-emerald-400">{formatCurrency(h.unrealizedGain)}</p>
                        <p className="text-xs text-emerald-400 font-semibold">{formatPercent(h.unrealizedGainPercent)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade Log */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-100">Recent Trades & SIP Log</h3>
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
          {trades.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No recent trade records.</p>
          ) : (
            trades.map((t: Trade) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs">{t.type}</span>
                  <div>
                    <p className="font-semibold text-slate-100 text-sm">{t.securityName}</p>
                    <p className="text-xs text-slate-400">Qty: {t.quantity} @ {formatCurrency(t.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-100 text-sm">{formatCurrency(t.totalAmount)}</p>
                  <p className="text-xs text-slate-500">{t.date}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
