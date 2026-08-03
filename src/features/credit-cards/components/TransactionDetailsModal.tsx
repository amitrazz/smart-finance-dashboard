import React from "react";
import { X, ArrowUpRight } from "lucide-react";
import { Transaction } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Transaction Details</h3>
              <p className="text-xs text-slate-400">ID: {transaction.id.slice(0, 12)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-slate-400 block">Amount</span>
            <span className="text-2xl font-extrabold text-slate-100 block">
              {formatCurrency(transaction.amount)}
            </span>
            <span className="text-[11px] font-semibold text-rose-400 block uppercase">
              {transaction.direction}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Description / Merchant:</span>
              <span className="font-bold text-slate-200">{transaction.merchantName || transaction.description}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Category:</span>
              <span className="font-bold text-indigo-400">{transaction.categoryName || "General Expense"}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Date:</span>
              <span className="font-bold text-slate-200">{transaction.date}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Source:</span>
              <span className="font-bold text-slate-300">{transaction.source || "Credit Card Statement"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
