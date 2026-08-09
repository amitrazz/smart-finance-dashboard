import React, { useState } from "react";
import { X, Wallet, Check } from "lucide-react";
import { useRedeemCardCashback } from "../hooks/useCreditCardQueries";
import { formatCurrency } from "../../../utils/formatters";

interface RedeemCashbackModalProps {
  cardId: string;
  availableBalance: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RedeemCashbackModal: React.FC<RedeemCashbackModalProps> = ({ cardId, availableBalance, isOpen, onClose }) => {
  const redeemMutation = useRedeemCardCashback();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  if (!isOpen) return null;

  const amountVal = parseFloat(amount || "0");
  const exceedsBalance = amountVal > availableBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountVal <= 0 || exceedsBalance) return;
    redeemMutation.mutate(
      { cardId, data: { amount: String(amountVal), reference: reference || undefined } },
      {
        onSuccess: () => {
          onClose();
          setAmount("");
          setReference("");
        },
      }
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
              <h3 className="text-lg font-bold text-slate-100">Redeem Cashback</h3>
              <p className="text-xs text-slate-400">
                Available: {formatCurrency({ amount: availableBalance.toFixed(2), currency: "INR" })}
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
            <label htmlFor="redeem-cashback-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Amount to Redeem *
            </label>
            <input
              id="redeem-cashback-amount"
              type="number"
              step="any"
              max={availableBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">Redeeming posts a real statement credit that reduces your outstanding balance.</p>
            {exceedsBalance && <p className="text-[11px] text-rose-400 mt-1">Can't redeem more than your available cashback balance.</p>}
          </div>
          <div>
            <label htmlFor="redeem-cashback-reference" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reference (Optional)
            </label>
            <input
              id="redeem-cashback-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
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
              disabled={redeemMutation.isPending || amountVal <= 0 || exceedsBalance}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {redeemMutation.isPending ? "Redeeming..." : <><Check className="w-4 h-4" /> Redeem</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
