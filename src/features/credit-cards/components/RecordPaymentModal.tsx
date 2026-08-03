import React, { useState, useEffect, useMemo } from "react";
import { X, Check, DollarSign } from "lucide-react";
import { useRecordCardPayment } from "../hooks/useCreditCardQueries";
import { useAccounts } from "../../../hooks/useFinanceQueries";
import { CreditCard, RecordCreditCardPaymentInput } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";

interface RecordPaymentModalProps {
  card: CreditCard | null;
  isOpen: boolean;
  onClose: () => void;
}

type PaymentOption = "FULL" | "MINIMUM" | "PARTIAL" | "CUSTOM";

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ card, isOpen, onClose }) => {
  const recordPaymentMutation = useRecordCardPayment();
  const { data: accounts = [] } = useAccounts();

  const [paymentOption, setPaymentOption] = useState<PaymentOption>("FULL");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const currentOutstandingVal = useMemo(() => {
    if (!card) return 0;
    if (typeof card.currentOutstanding === "object" && card.currentOutstanding !== null) {
      return parseFloat(card.currentOutstanding.amount || "0");
    }
    if (typeof card.currentOutstanding === "number") return card.currentOutstanding;
    if (typeof card.currentOutstanding === "string") return parseFloat(card.currentOutstanding) || 0;
    if (typeof card.currentBalance === "object" && card.currentBalance !== null) {
      return parseFloat(card.currentBalance.amount || "0");
    }
    return 0;
  }, [card]);

  const minimumDueVal = useMemo(() => {
    if (!card) return 0;
    if (typeof card.minimumDue === "object" && card.minimumDue !== null) {
      return parseFloat(card.minimumDue.amount || "0");
    }
    if (typeof card.minimumDue === "number") return card.minimumDue;
    if (typeof card.minimumDue === "string") return parseFloat(card.minimumDue) || 0;
    return 0;
  }, [card]);

  const creditLimitVal = useMemo(() => {
    if (!card) return 0;
    if (typeof card.creditLimit === "object" && card.creditLimit !== null) {
      return parseFloat(card.creditLimit.amount || "0");
    }
    if (typeof card.creditLimit === "number") return card.creditLimit;
    if (typeof card.creditLimit === "string") return parseFloat(card.creditLimit) || 0;
    return 0;
  }, [card]);

  useEffect(() => {
    if (card) {
      if (card.paymentAccountId) {
        setPaymentAccountId(card.paymentAccountId);
      }
      setPaymentOption("FULL");
      setAmount(String(currentOutstandingVal));
    }
  }, [card, currentOutstandingVal]);

  const handleOptionChange = (option: PaymentOption) => {
    setPaymentOption(option);
    switch (option) {
      case "FULL":
        setAmount(String(currentOutstandingVal));
        break;
      case "MINIMUM":
        setAmount(String(minimumDueVal > 0 ? minimumDueVal : Math.min(currentOutstandingVal, 1000)));
        break;
      case "PARTIAL":
        setAmount(String((currentOutstandingVal * 0.5).toFixed(2)));
        break;
      case "CUSTOM":
        setAmount("");
        break;
    }
  };

  if (!isOpen || !card) return null;

  const paymentAmountVal = parseFloat(amount || "0");
  const remainingOutstanding = Math.max(0, currentOutstandingVal - paymentAmountVal);
  const availableCreditAfterPayment = Math.min(creditLimitVal, creditLimitVal - remainingOutstanding);
  const predictedStatus = remainingOutstanding === 0 ? "PAID IN FULL" : paymentAmountVal >= minimumDueVal ? "MINIMUM PAID" : "PARTIALLY PAID";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmountVal <= 0) return;

    const payload: RecordCreditCardPaymentInput = {
      cardId: card.id,
      paymentType: paymentOption,
      paymentDate,
      amount: String(paymentAmountVal),
      paymentAccountId: paymentAccountId || undefined,
      reference: reference || undefined,
      notes: notes || undefined,
    };

    recordPaymentMutation.mutate(
      { cardId: card.id, data: payload },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Pay Credit Card Bill</h3>
              <p className="text-xs text-slate-400">
                {card.name} • {card.issuer} (•••• {card.last4Digits || "CARD"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Amount Preset Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(["FULL", "MINIMUM", "PARTIAL", "CUSTOM"] as PaymentOption[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleOptionChange(opt)}
              className={`p-3 rounded-2xl text-left border transition-all ${
                paymentOption === opt
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/30"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <span className="text-[10px] font-bold block uppercase tracking-wider">{opt}</span>
              <span className="text-xs font-extrabold mt-1 block">
                {opt === "FULL"
                  ? formatCurrency({ amount: currentOutstandingVal.toFixed(2), currency: card.currency || "INR" })
                  : opt === "MINIMUM"
                  ? formatCurrency({ amount: minimumDueVal.toFixed(2), currency: card.currency || "INR" })
                  : opt === "PARTIAL"
                  ? "50% Pay"
                  : "Custom"}
              </span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Amount *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">{card.currency || "INR"}</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setPaymentOption("CUSTOM");
                  }}
                  className="w-full pl-12 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Debit From Account</label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Select Source Bank Account --</option>
                {accounts
                  .filter((a) => a.type !== "CREDIT_CARD" && a.type !== "LOAN")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Reference / UPR</label>
              <input
                type="text"
                placeholder="e.g. UPI/123456789/Pay"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Partial settlement for bill"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Live Position Impact Preview */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Position Preview</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Remaining Outstanding:</span>
                <span className="font-extrabold text-indigo-300">
                  {formatCurrency({ amount: remainingOutstanding.toFixed(2), currency: card.currency || "INR" })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Available Credit After:</span>
                <span className="font-extrabold text-emerald-400">
                  {formatCurrency({ amount: availableCreditAfterPayment.toFixed(2), currency: card.currency || "INR" })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Statement Outcome:</span>
                <span className="font-extrabold text-cyan-300">{predictedStatus}</span>
              </div>
            </div>
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
              disabled={recordPaymentMutation.isPending || paymentAmountVal <= 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {recordPaymentMutation.isPending ? "Recording..." : <><Check className="w-4 h-4" /> Submit Payment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
