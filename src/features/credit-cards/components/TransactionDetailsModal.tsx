import React, { useState } from "react";
import { X, ArrowUpRight, Layers, ShieldAlert } from "lucide-react";
import { Transaction } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { ConvertToEmiModal } from "./ConvertToEmiModal";
import { RaiseDisputeModal } from "./RaiseDisputeModal";

interface TransactionDetailsModalProps {
  cardId?: string;
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  cardId,
  transaction,
  isOpen,
  onClose,
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);

  if (!isOpen || !transaction) return null;

  const canManage = Boolean(cardId) && transaction.direction === "OUTFLOW" && !transaction.emiId;
  const txLabel = transaction.merchantName || transaction.description;
  const txAmount = parseFloat(transaction.amount?.amount || "0");

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
            aria-label="Close"
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

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConverting(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600/10 hover:bg-teal-600/20 text-teal-400 border border-teal-500/20 text-xs font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5" /> Convert to EMI
            </button>
            <button
              onClick={() => setIsDisputing(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Raise Dispute
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {cardId && (
        <>
          <ConvertToEmiModal
            cardId={cardId}
            isOpen={isConverting}
            onClose={() => {
              setIsConverting(false);
              onClose();
            }}
            transactionId={transaction.id}
            transactionLabel={txLabel}
          />
          <RaiseDisputeModal
            cardId={cardId}
            isOpen={isDisputing}
            onClose={() => {
              setIsDisputing(false);
              onClose();
            }}
            transactionId={transaction.id}
            transactionLabel={txLabel}
            transactionAmount={txAmount}
          />
        </>
      )}
    </div>
  );
};
