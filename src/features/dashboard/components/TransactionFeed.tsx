import React, { useState } from "react";
import { Search, ArrowDownLeft, ShoppingBag, Tag, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { useTransactions } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";
import { Transaction } from "../../../types";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

export const TransactionFeed: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const { data: transactionsRaw = [], isLoading } = useTransactions({ limit: 20 });
  const { setActiveTab } = useUIStore();

  let filtered = [...transactionsRaw];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(q))
    );
  }

  if (filterCategory !== "ALL") {
    filtered = filtered.filter((t) => t.categoryName?.toUpperCase() === filterCategory.toUpperCase());
  }

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-100 font-sans tracking-tight">Recent Activity Feed</h3>
          <p className="text-xs text-slate-400">Streamlined transaction ledger across accounts</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-36 sm:w-48 transition-all"
            />
          </div>

          <button
            onClick={() => setActiveTab("transactions")}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title="View Full Ledger"
          >
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Category Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {["ALL", "FOOD", "SHOPPING", "UTILITIES", "ENTERTAINMENT", "INCOME"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              filterCategory === cat
                ? `${NAV_TAB_L2}`
                : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modern Transaction List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse flex-1">
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 flex-1 flex flex-col justify-center items-center">
          <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 flex flex-col justify-center">
          {filtered.slice(0, 4).map((txn: Transaction) => {
            const isIncome = txn.direction === "INFLOW";
            const initial = (txn.description[0] || "T").toUpperCase();
            const subtitleText = txn.categoryName || txn.accountName || (isIncome ? "Income Credit" : "General Expense");

            return (
              <div
                key={txn.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
              >
                {/* Left: Merchant Avatar & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shrink-0 ${
                      isIncome
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-900 text-indigo-400 border-slate-800"
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : initial}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                      {txn.description}
                    </h4>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        <Tag className="w-3 h-3 text-slate-500" /> {subtitleText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Date & Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-extrabold font-sans ${
                      isIncome ? "text-emerald-400" : "text-slate-100"
                    }`}
                  >
                    {isIncome ? "+" : "-"}{formatCurrency(txn.amount)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {txn.date ? new Date(txn.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
