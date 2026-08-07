import React, { useState, useMemo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTransactionsInfinite, useCreateTransaction, useBulkCategorize, useAccounts, useCategories } from "../../hooks/useFinanceQueries";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Category, Transaction, TransactionDirection } from "../../types";
import { Search, Plus, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, Tag, X, Check, AlertTriangle, RefreshCw, Wallet } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { AsyncSearchSelect } from "../../components/common/AsyncSearchSelect";

const DIRECTION_TO_CATEGORY_KIND: Record<TransactionDirection, Category["kind"]> = {
  OUTFLOW: "EXPENSE",
  INFLOW: "INCOME",
  TRANSFER: "TRANSFER",
  // System-generated Transfer Center legs — not selectable in the manual-add
  // form below, but this map must stay exhaustive over TransactionDirection.
  TRANSFER_OUT: "TRANSFER",
  TRANSFER_IN: "TRANSFER",
};

const isCreditDirection = (d: TransactionDirection) => d === "INFLOW" || d === "TRANSFER_IN";
const isTransferDirection = (d: TransactionDirection) =>
  d === "TRANSFER" || d === "TRANSFER_OUT" || d === "TRANSFER_IN";

import { Button } from "../../components/ui/Button";

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
  } = useTransactionsInfinite(
    // The backend's `direction` filter matches exactly one enum value —
    // fine for INFLOW/OUTFLOW, but "TRANSFER" alone would miss the
    // TRANSFER_OUT/TRANSFER_IN legs Transfer Center produces (see
    // isTransferDirection below). So the TRANSFER pill fetches unfiltered
    // and matches client-side instead of narrowing server-side.
    filterDirection === "INFLOW" || filterDirection === "OUTFLOW" ? { direction: filterDirection } : undefined
  );
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTxnMutation = useCreateTransaction();
  const bulkCategorizeMutation = useBulkCategorize();

  // Separate search-scoped fetches for the two Account/Category pickers below
  // — kept apart from the base `accounts`/`categories` lists above, which
  // stay unfiltered since they're also used for the account-name join and
  // the categories count/panel elsewhere in this view.
  const [modalAccountSearch, setModalAccountSearch] = useState("");
  const { data: modalAccounts = [], isFetching: isModalAccountsFetching } = useAccounts({
    search: modalAccountSearch || undefined,
    limit: 100,
  });
  const [modalCategorySearch, setModalCategorySearch] = useState("");
  const { data: modalCategoriesRaw = [], isFetching: isModalCategoriesFetching } = useCategories({
    search: modalCategorySearch || undefined,
  });
  const [bulkCategorySearch, setBulkCategorySearch] = useState("");
  const { data: bulkCategories = [], isFetching: isBulkCategoriesFetching } = useCategories({
    search: bulkCategorySearch || undefined,
  });

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
  const modalDirectionCategories = useMemo(
    () => modalCategoriesRaw.filter((c) => (c.kind ?? c.type) === DIRECTION_TO_CATEGORY_KIND[direction]),
    [modalCategoriesRaw, direction]
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

  // Flatten all loaded pages into a single list. The backend only returns
  // accountId (see RawTransaction in useFinanceQueries.ts) — accountName is
  // joined here against the already-loaded accounts list.
  const accountNameById = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const allTxns = useMemo<Transaction[]>(
    () =>
      (data?.pages.flatMap((p) => p.data) ?? []).map((t) => ({
        ...t,
        accountName: (t.accountId && accountNameById.get(t.accountId)) || t.accountName,
      })),
    [data, accountNameById]
  );
  const totalCount = data?.pages[0]?.totalCount ?? data?.pages[0]?.total;

  // Memoize filtered transactions to avoid recomputing on every render
  const filteredTxns = useMemo(() => {
    return allTxns.filter((t: Transaction) => {
      // INFLOW/OUTFLOW are filtered server-side (see useTransactionsInfinite
      // call above); TRANSFER is matched here since it must catch the
      // legacy TRANSFER tag plus the new TRANSFER_OUT/TRANSFER_IN legs.
      if (filterDirection === "TRANSFER" && !isTransferDirection(t.direction)) return false;

      let matchesSubFilter = true;
      if (activeSubTab === "recurring") {
        matchesSubFilter = t.description.toLowerCase().includes("subscription");
      }

      const matchesSearch =
        searchQuery.trim() === "" ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.merchantName && t.merchantName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSubFilter && matchesSearch;
    });
  }, [allTxns, activeSubTab, searchQuery, filterDirection]);

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
              <div className="w-40">
                <AsyncSearchSelect
                  items={bulkCategories}
                  isFetching={isBulkCategoriesFetching}
                  disabled={bulkCategorizeMutation.isPending}
                  onSearch={setBulkCategorySearch}
                  onSelect={(c) => handleBulkCategorize(c.id)}
                  getOptionKey={(c) => c.id}
                  placeholder="Categorize as..."
                  emptyMessage="No matching categories"
                  renderOption={(c) => <span className="truncate">{c.name}</span>}
                />
              </div>
            </div>
          )}

          <Button
            variant="neutral"
            hierarchy="outline"
            size="md"
            leftIcon={<Tag className="w-4 h-4 text-purple-400" />}
            onClick={() => useUIStore.getState().showToast("Categories are managed in master settings", "info")}
          >
            Categories ({categories.length})
          </Button>

          <Button
            variant="primary"
            hierarchy="filled"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Add Transaction
          </Button>
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
            <Button
              key={dir}
              variant={filterDirection === dir ? "primary" : "neutral"}
              hierarchy={filterDirection === dir ? "filled" : "outline"}
              size="sm"
              onClick={() => setFilterDirection(dir)}
            >
              {dir}
            </Button>
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

      {/* Transaction Table — only this container swaps between loading/error/
          data states; the header, search box, and filter pills above stay
          mounted so selecting a filter doesn't blank the whole page. */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
        {isError ? (
          <div className="p-8 text-center space-y-4">
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
        ) : (
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
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="p-4" colSpan={6}>
                      <div className="h-6 bg-slate-800/80 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredTxns.length === 0 ? (
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
                                isCreditDirection(txn.direction)
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : isTransferDirection(txn.direction)
                                  ? "bg-indigo-500/10 text-indigo-400"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {isTransferDirection(txn.direction) ? (
                                <RefreshCcw className="w-4 h-4" />
                              ) : isCreditDirection(txn.direction) ? (
                                <ArrowDownLeft className="w-4 h-4" />
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
                          <span className={isCreditDirection(txn.direction) ? "text-emerald-400" : "text-slate-100"}>
                            {isCreditDirection(txn.direction) ? "+" : "-"}{formatCurrency(txn.amount)}
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
        )}

        {/* Load More / Status Footer */}
        {!isError && !isLoading && (
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
        )}
      </div>

      {/* Detail Drawer */}
      {selectedTxnDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-slate-100">Transaction Details</h3>
              <button
                onClick={() => setSelectedTxnDrawer(null)}
                aria-label="Close"
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount</p>
                <p className={`text-3xl font-extrabold mt-1 ${isCreditDirection(selectedTxnDrawer.direction) ? "text-emerald-400" : "text-slate-100"}`}>
                  {isCreditDirection(selectedTxnDrawer.direction) ? "+" : "-"}{formatCurrency(selectedTxnDrawer.amount)}
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
              <button onClick={handleCloseModal} aria-label="Close" className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account</label>
                <AsyncSearchSelect
                  value={accountId}
                  valueLabel={
                    (() => {
                      const acc = modalAccounts.find((a) => a.id === accountId) || accounts.find((a) => a.id === accountId);
                      return acc ? `${acc.name} (${acc.type})` : undefined;
                    })()
                  }
                  items={modalAccounts}
                  isFetching={isModalAccountsFetching}
                  onSearch={setModalAccountSearch}
                  onSelect={(acc) => setAccountId(acc.id)}
                  getOptionKey={(acc) => acc.id}
                  icon={<Wallet className="w-4 h-4 text-slate-500 shrink-0" />}
                  placeholder="Select account"
                  emptyMessage="No matching accounts"
                  renderOption={(acc) => (
                    <span className="truncate">
                      {acc.name} ({acc.type})
                    </span>
                  )}
                />
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
                <AsyncSearchSelect
                  value={categoryId}
                  valueLabel={
                    modalDirectionCategories.find((c) => c.id === categoryId)?.name ||
                    directionCategories.find((c) => c.id === categoryId)?.name
                  }
                  items={modalDirectionCategories}
                  isFetching={isModalCategoriesFetching}
                  disabled={directionCategories.length === 0 && modalDirectionCategories.length === 0}
                  onSearch={setModalCategorySearch}
                  onSelect={(c) => setCategoryId(c.id)}
                  getOptionKey={(c) => c.id}
                  placeholder="No categories available"
                  emptyMessage="No matching categories"
                  renderOption={(c) => <span className="truncate">{c.name}</span>}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
