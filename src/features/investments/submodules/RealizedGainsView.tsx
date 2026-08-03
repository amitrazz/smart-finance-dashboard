import React, { useMemo, useState } from "react";
import { useRealizedGainsInfinite } from "../../../hooks/useFinanceQueries";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { GainLossBadge } from "../components/GainLossBadge";
import { formatCurrency } from "../../../utils/formatters";
import { Receipt, Calendar } from "lucide-react";

// Capital gains ledger — one row per Lot consumed by a SELL, from the
// immutable RealizedGain table. No tax-liability/STCG-LTCG classification
// or PDF export exists on the backend, so none is fabricated here.
export const RealizedGainsView: React.FC = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useRealizedGainsInfinite({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 50,
  });

  const gains = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Realized Gains Ledger</h3>
            <p className="text-xs text-slate-400">Every SELL, newest first — cost basis, proceeds, and gain/loss per lot consumed</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-12 bg-slate-900 rounded-2xl" />
          <div className="h-64 bg-slate-900 rounded-3xl" />
        </div>
      ) : isError ? (
        <ErrorState title="Failed to load realized gains" onRetry={refetch} />
      ) : gains.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-10 h-10 text-slate-600 mx-auto" />}
          title="No Realized Gains"
          message="Gains and losses from SELL trades will appear here once you close a position."
        />
      ) : (
        <>
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-4">Realized Date</th>
                    <th className="p-4 text-right">Quantity</th>
                    <th className="p-4 text-right">Cost Basis</th>
                    <th className="p-4 text-right">Proceeds</th>
                    <th className="p-4 text-right">Gain / Loss</th>
                    <th className="p-4 text-right">Holding Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gains.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-xs font-mono text-slate-400">{g.realizedDate}</td>
                      <td className="p-4 text-right font-medium text-slate-200">{g.quantity}</td>
                      <td className="p-4 text-right font-mono text-slate-400">{formatCurrency(g.costBasis)}</td>
                      <td className="p-4 text-right font-mono text-slate-200">{formatCurrency(g.proceeds)}</td>
                      <td className="p-4 text-right">
                        <GainLossBadge amount={g.gain} showIcon size="sm" />
                      </td>
                      <td className="p-4 text-right text-xs text-slate-400">{g.holdingPeriodDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {hasNextPage && (
            <div className="text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
