import React from "react";
import { useWatchlist, useToggleWatchlist } from "../hooks/useInvestmentQueries";
import { formatCurrency } from "../../../utils/formatters";
import { GainLossBadge } from "../components/GainLossBadge";
import { Eye, Trash2, Plus } from "lucide-react";

export const WatchlistView: React.FC = () => {
  const { data: watchlist = [], isLoading } = useWatchlist();
  const toggleWatchlist = useToggleWatchlist();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-24 bg-slate-900 rounded-2xl" />
        <div className="h-24 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Investment Target Watchlist</h3>
            <p className="text-xs text-slate-400">Track price drops & set buy target triggers</p>
          </div>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Asset to Watchlist
        </button>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {watchlist.length === 0 ? (
          <p className="text-xs text-slate-500 text-center col-span-2 py-8">Your watchlist is empty.</p>
        ) : (
          watchlist.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.assetClass}
                  </span>
                  <h4 className="text-base font-bold text-slate-100">{item.securityName}</h4>
                  <span className="text-xs font-mono text-slate-400">{item.symbol}</span>
                </div>
                <button
                  onClick={() => toggleWatchlist.mutate(item.securityId)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove from Watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Price</span>
                  <span className="text-lg font-bold text-slate-100 font-mono">
                    {formatCurrency(item.currentPrice)}
                  </span>
                </div>

                <GainLossBadge percent={item.dayChangePercent} size="sm" />
              </div>

              {item.targetBuyPrice && (
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Buy Trigger:</span>
                  <span className="text-indigo-400 font-extrabold font-mono">
                    {formatCurrency(item.targetBuyPrice)}
                  </span>
                </div>
              )}

              {item.notes && <p className="text-xs text-slate-400 italic">"{item.notes}"</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
