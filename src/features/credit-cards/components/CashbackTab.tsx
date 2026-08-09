import React, { useState } from "react";
import { Wallet, RefreshCw, AlertTriangle, Gift } from "lucide-react";
import { useCardCashback, useCardCashbackHistory } from "../hooks/useCreditCardQueries";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { RedeemCashbackModal } from "./RedeemCashbackModal";

interface CashbackTabProps {
  cardId: string;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const CashbackTab: React.FC<CashbackTabProps> = ({ cardId }) => {
  const { data: cashback, isLoading, isError, error, refetch } = useCardCashback(cardId);
  const { data: history = [] } = useCardCashbackHistory(cardId);
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
        <h3 className="text-base font-bold text-slate-100">Failed to Load Cashback</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve cashback balance."}
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

  const balance = getVal(cashback?.cashbackBalance);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" /> Cashback Balance
          </h4>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            {formatCurrency({ amount: balance.toFixed(2), currency: "INR" })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Redemption posts a real statement credit — it reduces your outstanding balance directly.</p>
        </div>
        <button
          onClick={() => setIsRedeeming(true)}
          disabled={balance <= 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Gift className="w-4 h-4" /> Redeem Cashback
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" /> Cashback History
        </h3>

        {history.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Gift className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No Cashback History Recorded</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Cashback earned from card transactions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => {
                  const amt = getVal(item.amount);
                  const isNegative = item.type === "REDEEMED" || (item.type === "ADJUSTED" && amt < 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(item.createdAt || "")}</td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-400">{item.type}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.reference || "—"}</td>
                      <td className={`py-3.5 px-4 text-right font-extrabold ${isNegative ? "text-rose-400" : "text-emerald-400"}`}>
                        {isNegative ? "-" : "+"}
                        {formatCurrency({ amount: Math.abs(amt).toFixed(2), currency: "INR" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RedeemCashbackModal
        cardId={cardId}
        availableBalance={balance}
        isOpen={isRedeeming}
        onClose={() => setIsRedeeming(false)}
      />
    </div>
  );
};
