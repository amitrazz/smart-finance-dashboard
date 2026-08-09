import React, { useState } from "react";
import { X, AlertOctagon, Check } from "lucide-react";
import { CreditCardPayment } from "../../../types";
import { useBounceCardPayment } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";

interface BouncePaymentModalProps {
  cardId: string;
  payment: CreditCardPayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BouncePaymentModal: React.FC<BouncePaymentModalProps> = ({ cardId, payment, isOpen, onClose }) => {
  const bounceMutation = useBounceCardPayment();
  const [status, setStatus] = useState<"BOUNCED" | "FAILED">("BOUNCED");
  const [reason, setReason] = useState("");

  if (!isOpen || !payment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    bounceMutation.mutate(
      { cardId, paymentId: payment.id, data: { status, reason: reason.trim() } },
      {
        onSuccess: () => {
          onClose();
          setReason("");
          setStatus("BOUNCED");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Report Failed Payment</h3>
              <p className="text-xs text-slate-400">
                {payment.paymentDate} • {formatCurrency(payment.amount)}
              </p>
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
          <div>
            <p className="block text-xs font-semibold text-slate-300 mb-1.5">Outcome *</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(["BOUNCED", "FAILED"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    status === opt
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <span className="text-xs font-bold block">{opt === "BOUNCED" ? "Bounced (cheque/ECS)" : "Failed (gateway/auto-pay)"}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bounce-reason" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason *
            </label>
            <input
              id="bounce-reason"
              type="text"
              required
              placeholder="e.g. Insufficient funds in source account"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
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
              disabled={bounceMutation.isPending || !reason.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {bounceMutation.isPending ? "Saving..." : <><Check className="w-4 h-4" /> Confirm</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
