import React from "react";

import { useAccount, useAccountBalanceHistory, useTransactions } from "../../../hooks/useFinanceQueries";
import { AccountHeader } from "../components/AccountHeader";
import { Account } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, AlertTriangle } from "lucide-react";

interface AccountDetailWorkspaceViewProps {
  account: Account;
  onBack: () => void;
  onTransfer?: () => void;
  onStatement?: () => void;
}

export const AccountDetailWorkspaceView: React.FC<AccountDetailWorkspaceViewProps> = ({
  account,
  onBack,
  onTransfer,
  onStatement,
}) => {
  const { data: fullAccount } = useAccount(account.id);
  const { data: historyData } = useAccountBalanceHistory(account.id, { limit: 30 });
  // Fetched wide enough to compute a real 30-day inflow/outflow total below, not just for the list.
  const { data: txns = [] } = useTransactions({ accountId: account.id, limit: 100 });

  const displayAccount = fullAccount || account;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTxns = txns.filter((txn) => new Date(txn.date) >= thirtyDaysAgo);
  const income30d = recentTxns
    .filter((txn) => txn.direction === "INFLOW")
    .reduce((sum, txn) => sum + Math.abs(parseFloat(txn.amount?.amount || "0")), 0);
  const expenses30d = recentTxns
    .filter((txn) => txn.direction !== "INFLOW")
    .reduce((sum, txn) => sum + Math.abs(parseFloat(txn.amount?.amount || "0")), 0);

  return (
    <div className="space-y-6">
      <AccountHeader
        account={displayAccount}
        income30d={income30d}
        expenses30d={expenses30d}
        onBack={onBack}
        onTransfer={onTransfer}
        onStatement={onStatement}
      />

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-5">
          <h3 className="text-base font-bold text-slate-100">Recent Transactions</h3>

          {txns.length > 0 ? (
            <div className="divide-y divide-slate-800/60">
              {txns.slice(0, 10).map((txn) => {
                const amt = parseFloat(txn.amount?.amount || "0");
                const isCredit = txn.direction === "INFLOW";
                return (
                  <div key={txn.id} className="flex items-center justify-between py-3.5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCredit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100 line-clamp-1">{txn.description || txn.merchantName || "Transaction"}</p>
                        <p className="text-xs text-slate-400">{formatDate(txn.date)}</p>
                      </div>
                    </div>
                    <span className={`font-extrabold text-sm shrink-0 ${isCredit ? "text-emerald-400" : "text-slate-100"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(Math.abs(amt), txn.amount?.currency || "INR")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No transactions found for this account.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Balance History Sparkline */}
      {(historyData?.length || 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Balance History</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {historyData?.slice(0, 4).map((point) => (
                <div key={point.date} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">{formatDate(point.date)}</p>
                  <p className="text-sm font-extrabold text-slate-100">{formatCurrency(parseFloat(point.balance?.amount || "0"), point.balance?.currency || "INR")}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
