import React from "react";
import { Holding } from "../../../types";
import { useHoldingLots, useTrades } from "../../../hooks/useFinanceQueries";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { X, Layers, History } from "lucide-react";
import { GainLossBadge } from "./GainLossBadge";

interface AssetDetailDrawerProps {
  holding: Holding | null;
  onClose: () => void;
}

export const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({ holding, onClose }) => {
  const { data: lots, isLoading: isLotsLoading } = useHoldingLots(holding?.id || "");
  const { data: trades, isLoading: isTradesLoading } = useTrades(
    holding?.security?.id ? { assetId: holding.security.id, limit: 10 } : undefined
  );

  if (!holding) return null;

  const security = holding.security;
  const currency = holding.marketValue?.currency || "INR";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                {security?.assetClass?.replace(/_/g, " ") || "—"}
              </span>
              <span className="text-xs font-mono text-slate-400">{security?.symbol || "—"}</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-100">{security?.name || "Asset Details"}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Price Hero */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Latest Price</span>
              <span className="text-3xl font-extrabold text-slate-100 font-mono">
                {security?.latestPrice ? formatCurrency({ amount: security.latestPrice, currency }) : "—"}
              </span>
              {security?.latestPriceAt && (
                <span className="text-[10px] text-slate-500 block mt-1">
                  As of {formatDate(security.latestPriceAt)} (last trade-recorded price — no live market feed)
                </span>
              )}
            </div>
          </div>

          {/* Position Summary */}
          <div className="p-5 rounded-3xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Your Portfolio Position
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Quantity</span>
                <span className="text-slate-100 font-bold">{holding.quantity}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Avg Cost</span>
                <span className="text-slate-100 font-bold font-mono">
                  {formatCurrency({ amount: holding.averageCost, currency })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Market Value</span>
                <span className="text-indigo-400 font-extrabold font-mono">{formatCurrency(holding.marketValue)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Unrealized Gain</span>
                <GainLossBadge amount={holding.unrealizedGain} percent={parseFloat(holding.unrealizedGainPercent)} size="sm" />
              </div>
            </div>
          </div>

          {/* Fundamentals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">ISIN</span>
                <span className="text-slate-200 font-mono font-semibold">{security?.isin || "—"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Sector</span>
                <span className="text-slate-200 font-semibold">{security?.sector || "—"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">Exchange</span>
                <span className="text-slate-200 font-semibold">{security?.exchangeCode || "—"}</span>
              </div>
            </div>
          </div>

          {/* Tax Lots */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Tax Lots (FIFO Order)
            </h4>
            {isLotsLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading lots...</div>
            ) : !lots || lots.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 rounded-2xl bg-slate-950 border border-slate-800">
                No lot records for this position.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Open Date</th>
                      <th className="p-2.5 text-right">Remaining</th>
                      <th className="p-2.5 text-right">Unit Cost</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {lots.map((lot) => (
                      <tr key={lot.id}>
                        <td className="p-2.5 font-mono">{lot.openDate}</td>
                        <td className="p-2.5 text-right font-bold text-slate-100">{lot.remainingQuantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency({ amount: lot.unitCost, currency })}</td>
                        <td className="p-2.5 text-center">{lot.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Trades */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Trades
            </h4>
            {isTradesLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading trades...</div>
            ) : !trades || trades.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 rounded-2xl bg-slate-950 border border-slate-800">
                No trades recorded for this asset.
              </div>
            ) : (
              <div className="space-y-2">
                {trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="font-semibold text-slate-300">{t.type}</span>
                    <span className="font-mono text-slate-400">{t.quantity} units @ {formatCurrency({ amount: t.price, currency })}</span>
                    <span className="font-mono text-slate-500">{t.tradeDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
