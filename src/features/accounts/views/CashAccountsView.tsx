import React from "react";

import { motion } from "framer-motion";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { formatCurrency, formatLastSyncedAt } from "../../../utils/formatters";
import { StatusBadge } from "../components/StatusBadge";
import { Banknote, Plus, ShieldCheck } from "lucide-react";
import { Account } from "../../../types";

interface CashAccountsViewProps {
  onAddAccount?: () => void;
}

const CASH_TYPE_LABELS: Record<string, { label: string; gradient: string }> = {
  Cash: { label: "General Cash", gradient: "from-emerald-500/15 to-teal-500/15" },
  Petty: { label: "Petty Cash", gradient: "from-amber-500/15 to-orange-500/15" },
  Emergency: { label: "Emergency Cash", gradient: "from-rose-500/15 to-pink-500/15" },
  Travel: { label: "Travel Cash", gradient: "from-indigo-500/15 to-blue-500/15" },
};

export const CashAccountsView: React.FC<CashAccountsViewProps> = ({ onAddAccount }) => {
  const { data: accounts = [], isLoading } = useAccounts();

  const cashAccounts = accounts.filter((a) => a.type === "CASH");

  const getCashStyle = (name: string): { label: string; gradient: string } => {
    for (const key of Object.keys(CASH_TYPE_LABELS)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return CASH_TYPE_LABELS[key];
    }
    return { label: "Cash Account", gradient: "from-slate-800/60 to-slate-900/60" };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(3).fill(null).map((_, i) => <div key={i} className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cashAccounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cashAccounts.map((account: Account, i) => {
            const style = getCashStyle(account.name);
            const balance = parseFloat(account.currentBalance?.amount || "0");
            return (
              <motion.div key={account.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className={`relative overflow-hidden bg-gradient-to-br ${style.gradient} border border-slate-800 hover:border-slate-700 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50">
                        <Banknote className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-base">{account.name}</h4>
                        <p className="text-xs text-slate-400 font-medium">{style.label}</p>
                      </div>
                    </div>
                    <StatusBadge status={account.status || "ACTIVE"} size="sm" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-medium">Current Balance</p>
                    <p className="text-2xl font-extrabold text-slate-100">{formatCurrency(balance, account.currency || "INR")}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Updated {formatLastSyncedAt(account.updatedAt || new Date().toISOString())}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto">
            <Banknote className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">No Cash Accounts Tracked</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Add cash, petty cash, emergency cash, or travel cash accounts to track physical money.</p>
          <button onClick={onAddAccount} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Cash Account</span>
          </button>
        </div>
      )}
    </div>
  );
};
