import React, { useState, useMemo } from "react";
import { ArrowUpRight, Search, Eye, RefreshCw, AlertTriangle, Tag, Store } from "lucide-react";
import { useCardTransactionsInfinite, mapCardTransaction } from "../hooks/useCreditCardQueries";
import { useCategories, useMerchants } from "../../../hooks/useFinanceQueries";
import { Transaction } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { Pagination } from "../../../components/common/Pagination";
import { AsyncSearchSelect } from "../../../components/common/AsyncSearchSelect";

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

  // Base categories & Category Search Hook
  const [categorySearch, setCategorySearch] = useState("");
  const { data: baseCategories = [] } = useCategories();
  const { data: searchedCategoriesRaw = [], isFetching: isCategoriesFetching } = useCategories({
    search: categorySearch || undefined,
  });

  // Merchant Search Hook
  const [merchantSearch, setMerchantSearch] = useState("");
  const { data: searchedMerchantsRaw = [], isFetching: isMerchantsFetching } = useMerchants({
    search: merchantSearch || undefined,
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    baseCategories.forEach((cat) => {
      if (cat.id && cat.name) map.set(cat.id, cat.name);
    });
    return map;
  }, [baseCategories]);

  const queryParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      merchant: selectedMerchant !== "all" ? selectedMerchant : undefined,
    };
  }, [search, selectedCategory, selectedMerchant]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCardTransactionsInfinite(cardId, queryParams);

  const rawTransactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const transactions = useMemo(() => {
    return rawTransactions.map((tx) => mapCardTransaction(tx, categoryMap));
  }, [rawTransactions, categoryMap]);

  const totalCount = data?.pages[0]?.totalCount;

  // Searchable options list for Category AsyncSearchSelect
  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    baseCategories.forEach((c) => {
      if (c.id && c.name) map.set(c.id, c.name);
    });
    searchedCategoriesRaw.forEach((c) => {
      if (c.id && c.name) map.set(c.id, c.name);
    });
    transactions.forEach((t) => {
      if (t.categoryId && t.categoryName) {
        map.set(t.categoryId, t.categoryName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [baseCategories, searchedCategoriesRaw, transactions]);

  // Searchable options list for Merchant AsyncSearchSelect
  const merchantOptions = useMemo(() => {
    const set = new Set<string>();
    searchedMerchantsRaw.forEach((m) => {
      if (m.name) set.add(m.name);
    });
    transactions.forEach((t) => {
      if (t.merchantName) set.add(t.merchantName);
      else if (t.description) {
        if (t.description.startsWith("UPI-")) {
          const parts = t.description.split("-");
          if (parts.length >= 3) {
            const name = parts.slice(2).join("-").replace(/\s+IN$/, "").trim();
            if (name) set.add(name);
          }
        } else {
          set.add(t.description);
        }
      }
    });
    return Array.from(set).sort().map((m) => ({ id: m, name: m }));
  }, [searchedMerchantsRaw, transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const searchLower = (search || "").toLowerCase().trim();
      const amtStr = typeof tx.amount === "object" ? tx.amount.amount : String(tx.amount);
      const dateStr = formatDate(tx.date) || tx.date;

      const matchSearch =
        searchLower === "" ||
        (tx.description && tx.description.toLowerCase().includes(searchLower)) ||
        (tx.merchantName && tx.merchantName.toLowerCase().includes(searchLower)) ||
        (tx.categoryName && tx.categoryName.toLowerCase().includes(searchLower)) ||
        amtStr.includes(searchLower) ||
        dateStr.toLowerCase().includes(searchLower);

      const matchCategory =
        selectedCategory === "all" ||
        tx.categoryId === selectedCategory ||
        tx.categoryName === selectedCategory;

      const matchMerchant =
        selectedMerchant === "all" ||
        tx.merchantName === selectedMerchant ||
        tx.description.toLowerCase().includes(selectedMerchant.toLowerCase());

      return matchSearch && matchCategory && matchMerchant;
    });
  }, [transactions, search, selectedCategory, selectedMerchant]);

  const hasActiveFilters = search.trim() !== "" || selectedCategory !== "all" || selectedMerchant !== "all";
  const effectiveTotalItems = hasActiveFilters
    ? filteredTransactions.length
    : Math.max(totalCount ?? 0, filteredTransactions.length);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const requiredLoadedCount = newPage * pageSize;
    if (requiredLoadedCount > transactions.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
      {/* Search & Filter Toolbar with AsyncSearchSelect for Categories and Merchants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search merchant, category, amount..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <AsyncSearchSelect<{ id: string; name: string }>
            value={selectedCategory === "all" ? undefined : selectedCategory}
            valueLabel={
              selectedCategory === "all"
                ? "All Categories"
                : categoryOptions.find((c) => c.id === selectedCategory)?.name || selectedCategory
            }
            placeholder="Filter by Category..."
            items={categoryOptions}
            isFetching={isCategoriesFetching}
            onSearch={setCategorySearch}
            onSelect={(c) => {
              setSelectedCategory(c.id);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSelectedCategory("all");
              setCategorySearch("");
              setCurrentPage(1);
            }}
            getOptionKey={(c) => c.id}
            icon={<Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            renderOption={(c) => <span className="truncate">{c.name}</span>}
            emptyMessage="No matching categories"
          />
        </div>

        <div>
          <AsyncSearchSelect<{ id: string; name: string }>
            value={selectedMerchant === "all" ? undefined : selectedMerchant}
            valueLabel={selectedMerchant === "all" ? "All Merchants" : selectedMerchant}
            placeholder="Filter by Merchant..."
            items={merchantOptions}
            isFetching={isMerchantsFetching}
            onSearch={setMerchantSearch}
            onSelect={(m) => {
              setSelectedMerchant(m.name);
              setCurrentPage(1);
            }}
            onClear={() => {
              setSelectedMerchant("all");
              setMerchantSearch("");
              setCurrentPage(1);
            }}
            getOptionKey={(m) => m.id}
            icon={<Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            renderOption={(m) => <span className="truncate">{m.name}</span>}
            emptyMessage="No matching merchants"
          />
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
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(tx.date)}</td>
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
                          aria-label="View Details"
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

          <div className="space-y-2">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(effectiveTotalItems / pageSize) || 1}
              totalItems={effectiveTotalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50]}
            />
            {isFetchingNextPage && (
              <div className="flex items-center justify-end gap-2 text-xs text-indigo-400 font-medium pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Fetching more transactions...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        cardId={cardId}
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
