import React, { useMemo } from "react";
import { AlertTriangle, RefreshCw, Tag } from "lucide-react";
import { useTransactionsInfinite } from "../../../hooks/useFinanceQueries";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { Budget, BudgetCategoryLine } from "../../../types";
import { EmptyState } from "../../../components/common/EmptyState";
import { LoadingSkeleton } from "../../../components/common/LoadingSkeleton";

interface BudgetTransactionsTabProps {
  budget: Budget;
  categoryLines: BudgetCategoryLine[];
}

// There's no endpoint that filters transactions by a *set* of category ids
// (GET /finance/transactions only accepts one categoryId) or by budget id
// directly — so this fetches transactions across the budget's current period
// and filters client-side down to the categories this budget actually caps.
export const BudgetTransactionsTab: React.FC<BudgetTransactionsTabProps> = ({ budget, categoryLines }) => {
  const dateTo = budget.endDate ?? new Date().toISOString().slice(0, 10);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsInfinite({ dateFrom: budget.startDate, dateTo, limit: 50 });

  const budgetCategoryIds = useMemo(() => new Set(categoryLines.map((l) => l.categoryId)), [categoryLines]);

  const filteredTxns = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.data) ?? [];
    return all.filter((t) => t.categoryId && budgetCategoryIds.has(t.categoryId));
  }, [data, budgetCategoryIds]);

  if (categoryLines.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="No Categories on This Budget"
        message="Add category caps to this budget plan to see their transactions here."
      />
    );
  }

  if (isLoading) {
    return <LoadingSkeleton type="list" rows={5} />;
  }

  if (isError) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Transactions</h3>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (filteredTxns.length === 0) {
    return (
      <EmptyState
        title="No Transactions in This Period"
        message="No transactions in this budget's categories have been recorded for the current period yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Transaction</th>
              <th className="p-4">Category</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTxns.map((txn) => (
              <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-slate-100">{txn.description}</p>
                  {txn.merchantName && <p className="text-xs text-slate-400">{txn.merchantName}</p>}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-300">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    {txn.categoryName || "Uncategorized"}
                  </span>
                </td>
                <td className="p-4 text-xs text-slate-400">{formatDate(txn.date)}</td>
                <td className="p-4 text-right font-bold text-sm">
                  <span className={txn.direction === "INFLOW" ? "text-emerald-400" : "text-slate-100"}>
                    {txn.direction === "INFLOW" ? "+" : "-"}{formatCurrency(txn.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading more...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetTransactionsTab;
