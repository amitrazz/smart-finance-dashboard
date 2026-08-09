import React, { useState } from "react";
import { X, Wallet, Check } from "lucide-react";
import { CreditCardBalanceTransfer } from "../../../types";
import { usePrepayBalanceTransfer } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";

interface PrepayBalanceTransferModalProps {
  cardId: string;
  transfer: CreditCardBalanceTransfer | null;
  isOpen: boolean;
  onClose: () => void;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const PrepayBalanceTransferModal: React.FC<PrepayBalanceTransferModalProps> = ({
  cardId,
  transfer,
  isOpen,
  onClose,
}) => {
  const prepayMutation = usePrepayBalanceTransfer();
  const [extraPrincipal, setExtraPrincipal] = useState("");

  if (!isOpen || !transfer) return null;

  const remaining = getVal(transfer.remainingPrincipal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(extraPrincipal || "0");
    if (val <= 0) return;
    prepayMutation.mutate(
      {
        cardId,
        balanceTransferId: transfer.id,
        version: transfer.version || 1,
        data: { extraPrincipal: String(val) },
      },
      { onSuccess: () => { onClose(); setExtraPrincipal(""); } }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Prepay Transfer</h3>
              <p className="text-xs text-slate-400">Remaining: {formatCurrency({ amount: remaining.toFixed(2), currency: "INR" })}</p>
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
            <label htmlFor="prepay-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Extra Principal Payment *
            </label>
            <input
              id="prepay-amount"
              type="number"
              step="any"
              max={remaining}
              required
              value={extraPrincipal}
              onChange={(e) => setExtraPrincipal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
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
              disabled={prepayMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {prepayMutation.isPending ? "Processing..." : <><Check className="w-4 h-4" /> Prepay</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
