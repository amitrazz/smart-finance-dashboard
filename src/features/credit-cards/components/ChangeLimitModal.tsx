import React, { useEffect, useState } from "react";
import { X, Check, TrendingUp } from "lucide-react";
import { CreditCard } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { useChangeCreditCardLimit } from "../hooks/useCreditCardQueries";

interface ChangeLimitModalProps {
  card: CreditCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const ChangeLimitModal: React.FC<ChangeLimitModalProps> = ({ card, isOpen, onClose }) => {
  const changeLimitMutation = useChangeCreditCardLimit();
  const [newLimit, setNewLimit] = useState("");
  const [reason, setReason] = useState("");
  const [revertsAt, setRevertsAt] = useState("");

  const currentLimit = getVal(card?.creditLimit);
  const currentOutstanding = getVal(card?.currentOutstanding);

  useEffect(() => {
    if (card) {
      setNewLimit(String(currentLimit || ""));
      setReason("");
      setRevertsAt("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  if (!isOpen || !card) return null;

  const newLimitVal = parseFloat(newLimit || "0");
  const belowOutstanding = newLimitVal > 0 && newLimitVal < currentOutstanding;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLimitVal <= 0 || belowOutstanding) return;
    changeLimitMutation.mutate(
      {
        id: card.id,
        version: card.version || 1,
        data: {
          newLimit: String(newLimitVal),
          reason: reason || undefined,
          revertsAt: revertsAt || undefined,
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
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Change Credit Limit</h3>
              <p className="text-xs text-slate-400">
                {card.nickname} • Current: {formatCurrency({ amount: currentLimit.toFixed(2), currency: card.currency || "INR" })}
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
            <label htmlFor="new-limit" className="block text-xs font-semibold text-slate-300 mb-1.5">
              New Credit Limit *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">{card.currency || "INR"}</span>
              <input
                id="new-limit"
                type="number"
                step="any"
                required
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="w-full pl-12 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {belowOutstanding && (
              <p className="text-[11px] text-rose-400 mt-1.5">
                New limit can't be below the current outstanding balance ({formatCurrency({ amount: currentOutstanding.toFixed(2), currency: card.currency || "INR" })}).
              </p>
            )}
          </div>

          <div>
            <label htmlFor="limit-reason" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason (Optional)
            </label>
            <input
              id="limit-reason"
              type="text"
              placeholder="e.g. Issuer-approved permanent increase"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="limit-reverts-at" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Revert Back On (Optional — for temporary increases)
            </label>
            <input
              id="limit-reverts-at"
              type="date"
              value={revertsAt}
              onChange={(e) => setRevertsAt(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
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
              disabled={changeLimitMutation.isPending || newLimitVal <= 0 || belowOutstanding}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {changeLimitMutation.isPending ? "Updating..." : <><Check className="w-4 h-4" /> Update Limit</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
