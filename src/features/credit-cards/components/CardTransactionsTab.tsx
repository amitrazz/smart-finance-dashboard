import React, { useState, useMemo } from "react";
import { ArrowUpRight, Search, Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { useCardTransactions } from "../hooks/useCreditCardQueries";
import { Transaction } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { Pagination } from "../../../components/common/Pagination";

interface CardTransactionsTabProps {
  cardId: string;
}

export const CardTransactionsTab: React.FC<CardTransactionsTabProps> = ({ cardId }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMerchant, setSelectedMerchant] = useState("all");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: transactions = [], isLoading, isError, error, refetch } = useCardTransactions(cardId);

  // Extract unique categories and merchants for filter dropdowns
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.categoryName) set.add(t.categoryName);
    });
    return Array.from(set);
  }, [transactions]);

  const merchantsList = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.merchantName) set.add(t.merchantName);
    });
    return Array.from(set);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchLower = (search || "").toLowerCase();
      const matchSearch =
        search === "" ||
        (tx.description && tx.description.toLowerCase().includes(searchLower)) ||
        (tx.merchantName && tx.merchantName.toLowerCase().includes(searchLower)) ||
        (tx.categoryName && tx.categoryName.toLowerCase().includes(searchLower));

      const matchCategory = selectedCategory === "all" || tx.categoryName === selectedCategory;
      const matchMerchant = selectedMerchant === "all" || tx.merchantName === selectedMerchant;

      return matchSearch && matchCategory && matchMerchant;
    });
  }, [transactions, search, selectedCategory, selectedMerchant]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-800/80 rounded-xl w-full max-w-sm" />
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Card Transactions</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch card transaction history."}
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

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search merchant, category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedMerchant}
            onChange={(e) => {
              setSelectedMerchant(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Merchants</option>
            {merchantsList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <ArrowUpRight className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Transactions Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No credit card transactions match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Merchant / Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Reward Points</th>
                  <th className="py-3.5 px-4">EMI Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedTransactions.map((tx) => {
                  const rewardEarned = Math.floor(parseFloat(tx.amount?.amount || "0") / 100);
                  const isEmi = tx.description.toUpperCase().includes("EMI");

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {tx.merchantName || tx.description}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-400">
                        {tx.categoryName || "General Spend"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-100">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{tx.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-400">+{rewardEarned} Pts</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isEmi ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            Converted EMI
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Regular</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setDetailsOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredTransactions.length / pageSize) || 1}
            totalItems={filteredTransactions.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={isDetailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedTx(null);
        }}
      />
    </div>
  );
};
