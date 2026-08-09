import React, { useEffect, useState } from "react";
import { X, ArrowLeftRight, Check } from "lucide-react";
import { useCreditCards, useCreateBalanceTransfer } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";

interface CreateBalanceTransferModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const CreateBalanceTransferModal: React.FC<CreateBalanceTransferModalProps> = ({ cardId, isOpen, onClose }) => {
  const createTransferMutation = useCreateBalanceTransfer();
  const { data: cards = [] } = useCreditCards();
  const sourceOptions = cards.filter((c) => c.id !== cardId && c.status === "ACTIVE");

  const [sourceCreditCardId, setSourceCreditCardId] = useState("");
  const [amount, setAmount] = useState("");
  const [promoRatePercent, setPromoRatePercent] = useState("0");
  const [promoRateExpiresAt, setPromoRateExpiresAt] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSourceCreditCardId("");
      setAmount("");
      setPromoRatePercent("0");
      setPromoRateExpiresAt("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedSource = sourceOptions.find((c) => c.id === sourceCreditCardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCreditCardId || !amount || !promoRateExpiresAt) return;
    createTransferMutation.mutate(
      {
        cardId,
        data: {
          sourceCreditCardId,
          amount: String(parseFloat(amount)),
          promoRatePercent: String(parseFloat(promoRatePercent || "0")),
          promoRateExpiresAt,
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
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">New Balance Transfer</h3>
              <p className="text-xs text-slate-400">Move a balance from another card onto this one at a promo rate</p>
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
            <label htmlFor="bt-source" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transfer From *
            </label>
            <select
              id="bt-source"
              required
              value={sourceCreditCardId}
              onChange={(e) => setSourceCreditCardId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">-- Choose source card --</option>
              {sourceOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nickname} ({c.issuer}) — Outstanding {formatCurrency({ amount: getVal(c.currentOutstanding).toFixed(2), currency: c.currency || "INR" })}
                </option>
              ))}
            </select>
            {sourceOptions.length === 0 && (
              <p className="text-[11px] text-slate-500 mt-1.5">No other active cards available to transfer from.</p>
            )}
          </div>

          <div>
            <label htmlFor="bt-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transfer Amount *
            </label>
            <input
              id="bt-amount"
              type="number"
              step="any"
              required
              max={selectedSource ? getVal(selectedSource.currentOutstanding) : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bt-promo-rate" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Promo Rate (% p.a.)
              </label>
              <input
                id="bt-promo-rate"
                type="number"
                step="any"
                value={promoRatePercent}
                onChange={(e) => setPromoRatePercent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="bt-promo-expiry" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Promo Expires *
              </label>
              <input
                id="bt-promo-expiry"
                type="date"
                required
                value={promoRateExpiresAt}
                onChange={(e) => setPromoRateExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
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
              disabled={createTransferMutation.isPending || !sourceCreditCardId || !amount}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {createTransferMutation.isPending ? "Creating..." : <><Check className="w-4 h-4" /> Create Transfer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
