import React, { useState } from "react";
import { Gift, Award, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useCardRewards, useCardRewardsHistory } from "../hooks/useCreditCardQueries";
import { RedeemRewardsModal } from "./RedeemRewardsModal";

type RewardHistoryItem = { id: string; date: string; description: string; points: number; type: string };

interface CardRewardsTabProps {
  cardId: string;
}

export const CardRewardsTab: React.FC<CardRewardsTabProps> = ({ cardId }) => {
  const { data: rewards, isLoading, isError, error, refetch } = useCardRewards(cardId);
  const { data: rewardsHistory = [] } = useCardRewardsHistory(cardId);
  const [isRedeeming, setIsRedeeming] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Failed to Load Credit Card Rewards</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve reward balance."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const rewardBalance = rewards?.rewardBalance || 0;
  const lifetimeEarned = rewards?.lifetimeEarned || 0;
  const redeemed = rewards?.redeemed || 0;
  const expiringSoon = rewards?.expiringSoon || 0;
  const history: RewardHistoryItem[] =
    rewardsHistory.length > 0 ? rewardsHistory : ((rewards?.history || []) as RewardHistoryItem[]);

  return (
    <div className="space-y-6">
      {/* Expiring Soon Alert */}
      {expiringSoon > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">{expiringSoon.toLocaleString()} Reward Points Expiring Soon!</p>
              <p className="text-[11px] text-amber-400/80">
                Redeem before {rewards?.expiringDate || "month end"} to avoid losing your earned points.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRedeeming(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-all"
          >
            Redeem Now
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Available Reward Points</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{rewardBalance.toLocaleString()} Pts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Lifetime Earned</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{lifetimeEarned.toLocaleString()} Pts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total Redeemed</span>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1">{redeemed.toLocaleString()} Pts</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Expiring Soon</span>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{expiringSoon.toLocaleString()} Pts</p>
        </div>
      </div>

      {/* Reward History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Reward Points History
          </h3>
          <button
            onClick={() => setIsRedeeming(true)}
            disabled={rewardBalance <= 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Gift className="w-4 h-4 inline mr-1" /> Redeem Points
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Gift className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No Reward History Recorded</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Points earned from card transactions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">{item.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{item.description}</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-400">{item.type}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold ${
                        item.points > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {item.points > 0 ? `+${item.points}` : item.points} Pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RedeemRewardsModal
        cardId={cardId}
        availablePoints={rewardBalance}
        isOpen={isRedeeming}
        onClose={() => setIsRedeeming(false)}
      />
    </div>
  );
};
