import React, { useState } from "react";
import { X, FileText, Check, Undo2 } from "lucide-react";
import { CreditCardStatement } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { usePayCardStatement, useReverseCardStatementPayment } from "../../../hooks/useFinanceQueries";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface StatementDetailsModalProps {
  cardId: string;
  statement: CreditCardStatement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StatementDetailsModal: React.FC<StatementDetailsModalProps> = ({ cardId, statement, isOpen, onClose }) => {
  const payStatementMutation = usePayCardStatement();
  const reverseStatementMutation = useReverseCardStatementPayment();
  const [paidAmount, setPaidAmount] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [isReversing, setIsReversing] = useState(false);

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  // Reset the payment form whenever a different statement is opened, and
  // default the amount to the statement's outstanding balance.
  React.useEffect(() => {
    if (statement) {
      setPaidAmount(getVal(statement.statementBalance || statement.closingBalance).toFixed(2));
      setPaidDate(new Date().toISOString().split("T")[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statement?.id]);

  if (!isOpen || !statement) return null;

  const statementBal = getVal(statement.statementBalance || statement.closingBalance);
  const openingBal = getVal(statement.openingBalance);
  const minDue = getVal(statement.minimumDue);
  const interest = getVal(statement.interest);
  const fees = getVal(statement.fees);
  const canPay = statement.status !== "PAID";
  const canReverse = statement.status === "PAID" || statement.status === "PARTIALLY_PAID";

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(paidAmount || "0");
    if (amountVal <= 0) return;
    payStatementMutation.mutate({
      cardId,
      statementId: statement.id,
      data: { paidAmount: String(amountVal), paidDate },
    });
  };

  const handleConfirmReverse = () => {
    reverseStatementMutation.mutate(
      { cardId, statementId: statement.id },
      { onSuccess: () => setIsReversing(false) }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Statement Details</h3>
              <p className="text-xs text-slate-400">Statement Date: {statement.statementDate}</p>
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

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Status</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  statement.status === "PAID"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : statement.status === "OVERDUE"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {statement.status}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
              <span className="text-slate-400">Statement Total Due:</span>
              <span className="font-extrabold text-base text-slate-100">
                {formatCurrency({ amount: statementBal.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Minimum Amount Due:</span>
              <span className="font-bold text-amber-400">
                {formatCurrency({ amount: minDue.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Payment Due Date:</span>
              <span className="font-bold text-cyan-400">{statement.dueDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Opening Balance</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {formatCurrency({ amount: openingBal.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Closing Balance</span>
              <span className="font-bold text-slate-200 mt-0.5 block">
                {formatCurrency({ amount: statementBal.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Interest Charged</span>
              <span className="font-bold text-rose-400 mt-0.5 block">
                {formatCurrency({ amount: interest.toFixed(2), currency: "INR" })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Fees & Charges</span>
              <span className="font-bold text-amber-400 mt-0.5 block">
                {formatCurrency({ amount: fees.toFixed(2), currency: "INR" })}
              </span>
            </div>
          </div>

          {/* Record / Reverse Payment for this specific statement */}
          {canPay && (
            <form onSubmit={handlePay} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Record Payment for This Statement</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="stmt-paid-amount" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Amount Paid
                  </label>
                  <input
                    id="stmt-paid-amount"
                    type="number"
                    step="any"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="stmt-paid-date" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Paid Date
                  </label>
                  <input
                    id="stmt-paid-date"
                    type="date"
                    required
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={payStatementMutation.isPending || parseFloat(paidAmount || "0") <= 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payStatementMutation.isPending ? (
                  "Recording Payment..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Record Payment
                  </>
                )}
              </button>
            </form>
          )}

          {canReverse && (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-300">Reverse Payment</p>
                <p className="text-[11px] text-slate-400">Undo the payment recorded against this statement.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReversing(true)}
                disabled={reverseStatementMutation.isPending}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5" /> Reverse
              </button>
            </div>
          )}
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

      <ConfirmModal
        isOpen={isReversing}
        title="Reverse Statement Payment?"
        message="This will undo the payment recorded against this statement and restore its outstanding balance. This action cannot be undone."
        confirmText="Reverse Payment"
        cancelText="Cancel"
        variant="danger"
        isLoading={reverseStatementMutation.isPending}
        onConfirm={handleConfirmReverse}
        onClose={() => setIsReversing(false)}
      />
    </div>
  );
};
