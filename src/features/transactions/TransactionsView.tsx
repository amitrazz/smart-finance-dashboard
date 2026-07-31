import React, { useState, useMemo, useEffect } from "react";
import { useTransactions, useCreateTransaction, useBulkCategorize, useAccounts, useCategories } from "../../hooks/useFinanceQueries";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Transaction, TransactionDirection } from "../../types";
import { Search, Plus, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, Tag, X, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { Pagination } from "../../components/common/Pagination";
import { useUIStore } from "../../store/useUIStore";

export const TransactionsView: React.FC = () => {
  const { isAddTransactionOpen, setAddTransactionOpen } = useUIStore();
  const [filterDirection, setFilterDirection] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTxnDrawer, setSelectedTxnDrawer] = useState<Transaction | null>(null);

  // Sync isAddTransactionOpen from global store
  useEffect(() => {
    if (isAddTransactionOpen) {
      setModalOpen(true);
    }
  }, [isAddTransactionOpen]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setAddTransactionOpen(false);
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: txnsResponse, isLoading, isError, error, refetch } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTxnMutation = useCreateTransaction();
  const bulkCategorizeMutation = useBulkCategorize();

  // Form State — accountId synced from loaded accounts to avoid stale "" closure
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<TransactionDirection>("OUTFLOW");
  const [categoryName, setCategoryName] = useState("Dining & Food");

  // Sync accountId when accounts data loads
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Memoize filtered transactions to avoid recomputing on every render
  const filteredTxns = useMemo(() => {
    const transactions: Transaction[] = Array.isArray(txnsResponse)
      ? (txnsResponse as Transaction[])
      : (txnsResponse as unknown as { data: Transaction[] })?.data || [];
    return transactions.filter((t: Transaction) => {
      const matchesDirection = filterDirection === "ALL" || t.direction === filterDirection;
      const matchesSearch =
        searchQuery.trim() === "" ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.merchantName && t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDirection && matchesSearch;
    });
  }, [txnsResponse, filterDirection, searchQuery]);

  const totalPages = Math.ceil(filteredTxns.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTxns = filteredTxns.slice(startIndex, startIndex + pageSize);

  const toggleSelectTxn = (id: string) => {
    setSelectedTxnIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTxnMutation.mutate(
      {
        accountId: accountId || accounts[0]?.id || "",
        description,
        amount,
        direction,
        categoryName,
        transactionDate: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          handleCloseModal();
          setDescription("");
          setAmount("");
        },
      }
    );
  };

  const handleBulkCategorize = (catName: string) => {
    if (selectedTxnIds.length === 0) return;
    bulkCategorizeMutation.mutate(
      { transactionIds: selectedTxnIds, categoryId: catName },
      {
        onSuccess: () => setSelectedTxnIds([]),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-12 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-96 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Transactions</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch transaction audit trail."}
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
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Transaction History</h2>
          <p className="text-xs text-slate-400">Full audit trail of inflows, outflows, split transactions, and transfers</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedTxnIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 animate-in fade-in">
              <span>{selectedTxnIds.length} Selected</span>
              <button
                onClick={() => handleBulkCategorize("Bulk Categorized")}
                className="px-2 py-0.5 rounded bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold"
              >
                Categorize
              </button>
            </div>
          )}

          <button
            onClick={() => useUIStore.getState().showToast("Categories are managed in master settings", "info")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
          >
            <Tag className="w-4 h-4 text-purple-400" /> Categories
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-80 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-100 text-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by description, merchant..."
            className="w-full bg-transparent border-none focus:outline-none placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:inline" />
          {["ALL", "INFLOW", "OUTFLOW", "TRANSFER"].map((dir) => (
            <button
              key={dir}
              onClick={() => setFilterDirection(dir)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterDirection === dir ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedTxnIds.length === filteredTxns.length && filteredTxns.length > 0}
                    onChange={(e) =>
                      setSelectedTxnIds(e.target.checked ? filteredTxns.map((t) => t.id) : [])
                    }
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </th>
                <th className="p-4">Transaction & Merchant</th>
                <th className="p-4">Category</th>
                <th className="p-4">Account</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No transactions matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedTxns.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => setSelectedTxnDrawer(txn)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedTxnIds.includes(txn.id)}
                        onChange={() => toggleSelectTxn(txn.id)}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            txn.direction === "INFLOW"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : txn.direction === "TRANSFER"
                              ? "bg-indigo-500/10 text-indigo-400"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {txn.direction === "INFLOW" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : txn.direction === "TRANSFER" ? (
                            <RefreshCcw className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{txn.description}</p>
                          {txn.merchantName && <p className="text-xs text-slate-400">{txn.merchantName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-300">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        {txn.categoryName || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-400">{txn.accountName || "Bank Account"}</td>
                    <td className="p-4 text-xs text-slate-400">{formatDate(txn.date)}</td>
                    <td className="p-4 text-right font-bold text-sm">
                      <span className={txn.direction === "INFLOW" ? "text-emerald-400" : "text-slate-100"}>
                        {txn.direction === "INFLOW" ? "+" : "-"}{formatCurrency(txn.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTxns.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Detail Drawer */}
      {selectedTxnDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-slate-100">Transaction Details</h3>
              <button onClick={() => setSelectedTxnDrawer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount</p>
                <p className={`text-3xl font-extrabold mt-1 ${selectedTxnDrawer.direction === "INFLOW" ? "text-emerald-400" : "text-slate-100"}`}>
                  {selectedTxnDrawer.direction === "INFLOW" ? "+" : "-"}{formatCurrency(selectedTxnDrawer.amount)}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Description</span>
                  <span className="font-semibold text-slate-200">{selectedTxnDrawer.description}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Category</span>
                  <span className="font-semibold text-emerald-400">{selectedTxnDrawer.categoryName || "Uncategorized"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Account</span>
                  <span className="font-semibold text-slate-200">{selectedTxnDrawer.accountName || "Bank Account"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 py-2 text-sm">
                  <span className="text-slate-400">Date</span>
                  <span className="font-semibold text-slate-200">{formatDate(selectedTxnDrawer.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100">Log Manual Transaction</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Merchant</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Swiggy Order"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as TransactionDirection)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="OUTFLOW">Outflow (Spend)</option>
                    <option value="INFLOW">Inflow (Income)</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTxnMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
                >
                  <Check className="w-4 h-4" /> Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
