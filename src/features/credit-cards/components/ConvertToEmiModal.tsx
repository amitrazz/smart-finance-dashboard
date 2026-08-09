import React, { useEffect, useMemo, useState } from "react";
import { X, Layers, Check } from "lucide-react";
import { useCardTransactions, useConvertTransactionToEmi } from "../hooks/useCreditCardQueries";
import { Transaction } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface ConvertToEmiModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  transactionId?: string;
  transactionLabel?: string;
}

export const ConvertToEmiModal: React.FC<ConvertToEmiModalProps> = ({
  cardId,
  isOpen,
  onClose,
  transactionId,
  transactionLabel,
}) => {
  const convertMutation = useConvertTransactionToEmi();
  const { data: transactions = [] } = useCardTransactions(cardId, { limit: 100 });
  const [selectedTransactionId, setSelectedTransactionId] = useState(transactionId || "");
  const [tenureMonths, setTenureMonths] = useState("6");
  const [interestRate, setInterestRate] = useState("14");
  const [knownMonthlyEmi, setKnownMonthlyEmi] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedTransactionId(transactionId || "");
      setTenureMonths("6");
      setInterestRate("14");
      setKnownMonthlyEmi("");
    }
  }, [isOpen, transactionId]);

  const eligibleTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.direction === "OUTFLOW" && !tx.emiId);
  }, [transactions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransactionId || !tenureMonths || !interestRate) return;
    convertMutation.mutate(
      {
        cardId,
        data: {
          transactionId: selectedTransactionId,
          tenureMonths: parseInt(tenureMonths, 10),
          interestRate: String(parseFloat(interestRate)),
          knownMonthlyEmi: knownMonthlyEmi ? String(parseFloat(knownMonthlyEmi)) : undefined,
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
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Convert to EMI</h3>
              <p className="text-xs text-slate-400">Turn a purchase into a fixed monthly installment plan</p>
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
              <span className="text-slate-400 block mb-0.5">Transaction</span>
              <span className="font-bold text-slate-200">{transactionLabel || transactionId}</span>
            </div>
          ) : (
            <div>
              <label htmlFor="emi-tx-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Transaction *
              </label>
              <select
                id="emi-tx-select"
                required
                value={selectedTransactionId}
                onChange={(e) => setSelectedTransactionId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="">-- Choose a purchase --</option>
                {eligibleTransactions.map((tx: Transaction) => (
                  <option key={tx.id} value={tx.id}>
                    {formatDate(tx.date)} • {tx.merchantName || tx.description} • {formatCurrency(tx.amount)}
                  </option>
                ))}
              </select>
              {eligibleTransactions.length === 0 && (
                <p className="text-[11px] text-slate-500 mt-1.5">No eligible outflow transactions found on this card yet.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emi-tenure" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tenure (Months) *
              </label>
              <input
                id="emi-tenure"
                type="number"
                min={1}
                required
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="emi-rate" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Interest Rate (% p.a.) *
              </label>
              <input
                id="emi-rate"
                type="number"
                step="any"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="emi-known-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Issuer-Quoted Monthly EMI (Optional)
            </label>
            <input
              id="emi-known-amount"
              type="number"
              step="any"
              placeholder="Leave blank to auto-compute from tenure & rate"
              value={knownMonthlyEmi}
              onChange={(e) => setKnownMonthlyEmi(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
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
              disabled={convertMutation.isPending || !selectedTransactionId}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {convertMutation.isPending ? "Converting..." : <><Check className="w-4 h-4" /> Convert to EMI</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
