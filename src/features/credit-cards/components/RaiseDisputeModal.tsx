import React, { useEffect, useMemo, useState } from "react";
import { X, ShieldAlert, Check } from "lucide-react";
import { useCardTransactions, useRaiseCardDispute } from "../hooks/useCreditCardQueries";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface RaiseDisputeModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  transactionId?: string;
  transactionLabel?: string;
  transactionAmount?: number;
}

export const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
  cardId,
  isOpen,
  onClose,
  transactionId,
  transactionLabel,
  transactionAmount,
}) => {
  const raiseDisputeMutation = useRaiseCardDispute();
  const { data: transactions = [] } = useCardTransactions(cardId, { limit: 100 });
  const [selectedTransactionId, setSelectedTransactionId] = useState(transactionId || "");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(transactionAmount ? String(transactionAmount) : "");

  const eligibleTransactions = useMemo(
    () => transactions.filter((tx) => tx.direction === "OUTFLOW"),
    [transactions]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedTransactionId(transactionId || "");
      setReason("");
      setAmount(transactionAmount ? String(transactionAmount) : "");
    }
  }, [isOpen, transactionId, transactionAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !selectedTransactionId) return;
    raiseDisputeMutation.mutate(
      {
        cardId,
        data: {
          transactionId: selectedTransactionId,
          reason: reason.trim(),
          amount: amount ? String(parseFloat(amount)) : undefined,
        },
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Raise a Dispute</h3>
              <p className="text-xs text-slate-400">Applies an immediate provisional credit while it's investigated</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {transactionId ? (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-0.5">Disputed Transaction</span>
              <span className="font-bold text-slate-200">
                {transactionLabel || transactionId}
                {typeof transactionAmount === "number" && (
                  <span className="text-slate-400 font-normal"> • {formatCurrency({ amount: transactionAmount.toFixed(2), currency: "INR" })}</span>
                )}
              </span>
            </div>
          ) : (
            <div>
              <label htmlFor="dispute-tx-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Transaction *
              </label>
              <select
                id="dispute-tx-select"
                required
                value={selectedTransactionId}
                onChange={(e) => {
                  const tx = eligibleTransactions.find((t) => t.id === e.target.value);
                  setSelectedTransactionId(e.target.value);
                  setAmount(tx ? String(parseFloat(tx.amount?.amount || "0")) : "");
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="">-- Choose a charge to dispute --</option>
                {eligibleTransactions.map((tx) => (
                  <option key={tx.id} value={tx.id}>
                    {formatDate(tx.date)} • {tx.merchantName || tx.description} • {formatCurrency(tx.amount)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="dispute-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Disputed Amount (leave blank for full amount)
            </label>
            <input
              id="dispute-amount"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="dispute-reason" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason *
            </label>
            <textarea
              id="dispute-reason"
              required
              rows={3}
              placeholder="e.g. Charged twice for the same purchase"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={raiseDisputeMutation.isPending || !reason.trim() || !selectedTransactionId}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {raiseDisputeMutation.isPending ? "Submitting..." : <><Check className="w-4 h-4" /> Raise Dispute</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
