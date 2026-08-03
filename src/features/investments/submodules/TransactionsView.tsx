import React, { useMemo } from "react";
import { useTradesInfinite, useSIPs } from "../../../hooks/useFinanceQueries";
import { TransactionTable } from "../components/TransactionTable";
import { ErrorState } from "../../../components/common/ErrorState";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatCurrency } from "../../../utils/formatters";
import { Repeat } from "lucide-react";

export const TransactionsView: React.FC = () => {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useTradesInfinite({
    limit: 50,
  });
  const { data: sips = [], isLoading: isSipsLoading } = useSIPs();

  const trades = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="space-y-4 animate-pulse p-4">
          <div className="h-12 bg-slate-900 rounded-2xl" />
          <div className="h-64 bg-slate-900 rounded-3xl" />
        </div>
      ) : isError ? (
        <ErrorState title="Failed to load trades" onRetry={refetch} />
      ) : (
        <div className="space-y-4">
          <TransactionTable transactions={trades} />
          {hasNextPage && (
            <div className="text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load More Trades"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active SIPs — read-only, only created as a byproduct of CAS/mutual-fund import */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-indigo-400" /> Active SIPs
        </h3>
        {isSipsLoading ? (
          <div className="h-16 bg-slate-900 rounded-2xl animate-pulse" />
        ) : sips.length === 0 ? (
          <EmptyState
            title="No SIPs Found"
            message="SIP plans are detected automatically from CAS / mutual-fund statement imports."
          />
        ) : (
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Security</th>
                  <th className="p-4">Frequency</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sips.map((sip) => (
                  <tr key={sip.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-bold text-slate-100">{sip.security?.name || "Unknown Security"}</td>
                    <td className="p-4 text-slate-300">{sip.frequency}</td>
                    <td className="p-4 text-right font-mono font-semibold text-slate-200">
                      {formatCurrency(sip.amount)}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400">{sip.startDate}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          sip.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {sip.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
