import React from "react";

import { CreditCard } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { CreditCard as CardIcon, Calendar, ArrowUpRight, Gift } from "lucide-react";

interface CreditCardWidgetProps {
  card: CreditCard;
  onPay?: (card: CreditCard) => void;
  onViewStatement?: (card: CreditCard) => void;
}

export const CreditCardWidget: React.FC<CreditCardWidgetProps> = ({ card, onPay, onViewStatement }) => {
  const outstanding = typeof card.currentOutstanding === "number"
    ? card.currentOutstanding
    : parseFloat(typeof card.currentOutstanding === "object" ? card.currentOutstanding?.amount || "0" : card.currentOutstanding || "0");

  const limit = typeof card.creditLimit === "number"
    ? card.creditLimit
    : parseFloat(typeof card.creditLimit === "object" ? card.creditLimit?.amount || "0" : card.creditLimit || "100000");

  const available = limit - outstanding;
  const utilization = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-5">
      {/* Top Card Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <CardIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-base">{card.name}</h4>
            <p className="text-xs text-slate-400 font-medium">{card.issuer} •••• {card.last4Digits || "4892"}</p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            utilization > 50 ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {utilization}% Utilized
        </span>
      </div>

      {/* Balance & Utilization */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <div>
            <p className="text-xs text-slate-400">Outstanding Balance</p>
            <h3 className="text-2xl font-extrabold text-slate-100">{formatCurrency(outstanding, card.currency || "INR")}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Available Limit</p>
            <p className="text-sm font-bold text-slate-200">{formatCurrency(available, card.currency || "INR")}</p>
          </div>
        </div>

        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            style={{ width: `${utilization}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              utilization > 50 ? "bg-rose-500" : "bg-purple-500"
            }`}
          />
        </div>
      </div>

      {/* Due Date & Rewards */}
      <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/60">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-4 h-4 text-amber-400" />
          <div>
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Payment Due</span>
            <span className="text-slate-200 font-bold">{card.nextDueDate ? formatDate(card.nextDueDate) : "15th of month"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Gift className="w-4 h-4 text-purple-400" />
          <div>
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Reward Points</span>
            <span className="text-slate-200 font-bold">{card.rewardBalance || 12450} pts</span>
          </div>
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => onViewStatement?.(card)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          View Statement
        </button>

        <button
          onClick={() => onPay?.(card)}
          className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-lg shadow-purple-500/20"
        >
          <span>Pay Bill</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
