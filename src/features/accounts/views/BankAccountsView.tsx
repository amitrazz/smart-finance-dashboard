import React, { useState, useMemo } from "react";

import { motion } from "framer-motion";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { AccountCard } from "../components/AccountCard";
import { Account } from "../../../types";
import { Search, Landmark, SlidersHorizontal } from "lucide-react";

interface BankAccountsViewProps {
  onSelectAccount: (account: Account) => void;
  onTransfer: () => void;
}

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({ onSelectAccount, onTransfer }) => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"balance" | "name" | "lastSync">("balance");

  const bankAccounts = useMemo(() => {
    return accounts.filter((a) =>
      ["CHECKING", "SAVINGS", "CURRENT"].includes(a.type)
    );
  }, [accounts]);

  const filtered = useMemo(() => {
    let list = bankAccounts.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.institution?.name || "").toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "balance") list = [...list].sort((a, b) => parseFloat(b.currentBalance?.amount || "0") - parseFloat(a.currentBalance?.amount || "0"));
    else if (sortBy === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [bankAccounts, search, sortBy]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(6).fill(null).map((_, i) => <div key={i} className="h-52 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bank accounts…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none"
          >
            <option value="balance">Sort by Balance</option>
            <option value="name">Sort by Name</option>
            <option value="lastSync">Sort by Last Sync</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Total Accounts</p>
          <p className="text-xl font-extrabold text-slate-100">{filtered.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Total Balance</p>
          <p className="text-xl font-extrabold text-emerald-400">
            ₹{(filtered.reduce((s, a) => s + parseFloat(a.currentBalance?.amount || "0"), 0) / 100000).toFixed(2)}L
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Active</p>
          <p className="text-xl font-extrabold text-slate-100">{filtered.filter((a) => a.status === "ACTIVE").length}</p>
        </div>
      </div>

      {/* Account Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((account, i) => (
            <motion.div key={account.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <AccountCard
                account={account}
                onViewDetails={onSelectAccount}
                onTransfer={onTransfer}
                onStatement={() => {}}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto">
            <Landmark className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">No Bank Accounts Found</h3>
          <p className="text-sm text-slate-400">Add your first bank account to start tracking your finances.</p>
        </div>
      )}
    </div>
  );
};
