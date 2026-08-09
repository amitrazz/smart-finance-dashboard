import React, { useState } from "react";
import { X, Gift, Check } from "lucide-react";
import { useRedeemCardRewards } from "../hooks/useCreditCardQueries";

interface RedeemRewardsModalProps {
  cardId: string;
  availablePoints: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RedeemRewardsModal: React.FC<RedeemRewardsModalProps> = ({ cardId, availablePoints, isOpen, onClose }) => {
  const redeemMutation = useRedeemCardRewards();
  const [points, setPoints] = useState("");
  const [reference, setReference] = useState("");

  if (!isOpen) return null;

  const pointsVal = parseInt(points || "0", 10);
  const exceedsBalance = pointsVal > availablePoints;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pointsVal <= 0 || exceedsBalance) return;
    redeemMutation.mutate(
      { cardId, data: { points: pointsVal, reference: reference || undefined } },
      {
        onSuccess: () => {
          onClose();
          setPoints("");
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
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Redeem Reward Points</h3>
              <p className="text-xs text-slate-400">Available: {availablePoints.toLocaleString()} Pts</p>
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
            <label htmlFor="redeem-points" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Points to Redeem *
            </label>
            <input
              id="redeem-points"
              type="number"
              min={1}
              max={availablePoints}
              required
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {exceedsBalance && <p className="text-[11px] text-rose-400 mt-1.5">Can't redeem more than your available balance.</p>}
          </div>
          <div>
            <label htmlFor="redeem-reference" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reference (Optional)
            </label>
            <input
              id="redeem-reference"
              type="text"
              placeholder="e.g. Amazon voucher redemption"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
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
              disabled={redeemMutation.isPending || pointsVal <= 0 || exceedsBalance}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
            >
              {redeemMutation.isPending ? "Redeeming..." : <><Check className="w-4 h-4" /> Redeem</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
