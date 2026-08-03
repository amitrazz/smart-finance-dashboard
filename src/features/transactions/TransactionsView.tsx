import React, { useState, useMemo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTransactionsInfinite, useCreateTransaction, useBulkCategorize, useAccounts, useCategories } from "../../hooks/useFinanceQueries";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Category, Transaction, TransactionDirection } from "../../types";
import { Search, Plus, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, Tag, X, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

const DIRECTION_TO_CATEGORY_KIND: Record<TransactionDirection, Category["kind"]> = {
  OUTFLOW: "EXPENSE",
  INFLOW: "INCOME",
  TRANSFER: "TRANSFER",
};

export const TransactionsView: React.FC = () => {
  const { isAddTransactionOpen, setAddTransactionOpen, activeSubTab } = useUIStore();
  const [filterDirection, setFilterDirection] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTxnDrawer, setSelectedTxnDrawer] = useState<Transaction | null>(null);

  // Sync activeSubTab into filter direction or category view
  useEffect(() => {
    if (activeSubTab === "transfers") {
      setFilterDirection("TRANSFER");
    } else if (activeSubTab === "all-transactions") {
      setFilterDirection("ALL");
    }
  }, [activeSubTab]);

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

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsInfinite();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTxnMutation = useCreateTransaction();
  const bulkCategorizeMutation = useBulkCategorize();

  // Form State — accountId synced from loaded accounts
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<TransactionDirection>("OUTFLOW");
  const [categoryId, setCategoryId] = useState("");

  // Category options are filtered to match the selected transaction
  // direction (e.g. only expense categories for an outflow).
  const directionCategories = useMemo(
    () => categories.filter((c) => (c.kind ?? c.type) === DIRECTION_TO_CATEGORY_KIND[direction]),
    [categories, direction]
  );

  // Sync accountId when backend data loads, and keep categoryId valid for
  // the current direction — reselecting the first matching category whenever
  // it's empty or no longer matches (e.g. after switching direction).
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
    if (directionCategories.length > 0 && !directionCategories.some((c) => c.id === categoryId)) {
      setCategoryId(directionCategories[0].id || "");
    }
  }, [accounts, accountId, directionCategories, categoryId]);

  // Flatten all loaded pages into a single list
  const allTxns = useMemo<Transaction[]>(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const totalCount = data?.pages[0]?.totalCount ?? data?.pages[0]?.total;

  // Memoize filtered transactions to avoid recomputing on every render
  const filteredTxns = useMemo(() => {
    return allTxns.filter((t: Transaction) => {
      const matchesDirection = filterDirection === "ALL" || t.direction === filterDirection;

      let matchesSubFilter = true;
      if (activeSubTab === "recurring") {
        matchesSubFilter = t.description.toLowerCase().includes("subscription");
      }

      const matchesSearch =
        searchQuery.trim() === "" ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.merchantName && t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesDirection && matchesSubFilter && matchesSearch;
    });
  }, [allTxns, filterDirection, activeSubTab, searchQuery]);

  // Virtualize the (potentially large) loaded row set
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredTxns.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  // Auto-fetch the next page once the user scrolls near the end of what's loaded
  useEffect(() => {
    const lastRow = virtualRows[virtualRows.length - 1];
    if (!lastRow) return;
    if (lastRow.index >= filteredTxns.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualRows, filteredTxns.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        categoryId: categoryId || undefined,
        transactionDate: new Date().toISOString().slice(0, 10),
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

  const handleBulkCategorize = (catId: string) => {
    if (selectedTxnIds.length === 0 || !catId) return;
    bulkCategorizeMutation.mutate(
      { transactionIds: selectedTxnIds, categoryId: catId },
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
          <p className="text-xs text-slate-400">
            {activeSubTab
              ? `Sub-View: ${activeSubTab.replace("-", " ").toUpperCase()}`
              : "Full audit trail of inflows, outflows, split transactions, and transfers"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedTxnIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 animate-in fade-in">
              <span>{selectedTxnIds.length} Selected</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleBulkCategorize(e.target.value);
                  e.target.value = "";
                }}
                disabled={bulkCategorizeMutation.isPending}
                className="px-2 py-0.5 rounded bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs focus:outline-none disabled:opacity-50"
              >
                <option value="" disabled>Categorize as...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => useUIStore.getState().showToast("Categories are managed in master settings", "info")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
          >
            <Tag className="w-4 h-4 text-purple-400" /> Categories ({categories.length})
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
            className="w-full bg-transparent border-none focus:outline-none placeholder-slate-500 text-xs"
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

      {/* Categories View Card Panel when activeSubTab === "categories" */}
      {activeSubTab === "categories" && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" /> Category Breakdown & Master Rules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">{c.name}</p>
                  <p className="text-[10px] text-slate-400">{c.kind}</p>
                </div>
                <span className="text-xs font-bold text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  {c.isSystem ? "System" : "Custom"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
        <div ref={scrollRef} className="overflow-auto max-h-[640px]">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
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
                <>
                  {paddingTop > 0 && (
                    <tr style={{ height: `${paddingTop}px` }}>
                      <td colSpan={6} />
                    </tr>
                  )}
                  {virtualRows.map((virtualRow) => {
                    const txn = filteredTxns[virtualRow.index];
                    return (
                      <tr
                        key={txn.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
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
                    );
                  })}
                  {paddingBottom > 0 && (
                    <tr style={{ height: `${paddingBottom}px` }}>
                      <td colSpan={6} />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More / Status Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Loaded <span className="font-bold text-slate-200">{filteredTxns.length}</span>
            {typeof totalCount === "number" && (
              <>
                {" "}of <span className="font-bold text-slate-200">{totalCount}</span> total
              </>
            )}
          </span>
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all disabled:opacity-50 self-start sm:self-auto"
            >
              {isFetchingNextPage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading more...
                </>
              ) : (
                "Load More"
              )}
            </button>
          )}
        </div>
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
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={directionCategories.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  {directionCategories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    directionCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
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
