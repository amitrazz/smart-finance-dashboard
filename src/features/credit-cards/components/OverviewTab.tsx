import React from "react";
import { ShieldCheck } from "lucide-react";
import { CreditCard } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { useCreditCard } from "../hooks/useCreditCardQueries";

interface OverviewTabProps {
  cardId: string;
  card?: CreditCard;
  onPayCard?: () => void;
  onEditCard?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ cardId, card: propCard }) => {
  const { data: fetchedCard } = useCreditCard(cardId);
  const card = propCard || fetchedCard;

  if (!card) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mx-auto mb-4" />
        <div className="h-24 bg-slate-800/50 rounded-2xl w-full" />
      </div>
    );
  }

  const getVal = (val: unknown): number => {
    if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseFloat(val) || 0;
    return 0;
  };

  const outstanding = getVal(card.currentOutstanding);
  const limit = getVal(card.creditLimit);
  const available = getVal(card.availableCredit) || Math.max(0, limit - outstanding);
  const annualFee = getVal(card.annualFee);
  const joiningFee = getVal(card.joiningFee);
  const utilization = limit > 0 ? (outstanding / limit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Utilization & Billing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Utilization Meter */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Credit Utilization</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                utilization > 50
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : utilization > 30
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilization > 50 ? "bg-rose-500" : utilization > 30 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, utilization)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Used: <span className="font-bold text-slate-200">{formatCurrency({ amount: outstanding.toFixed(2), currency: card.currency || "INR" })}</span></span>
            <span className="text-slate-400">Available: <span className="font-bold text-emerald-400">{formatCurrency({ amount: available.toFixed(2), currency: card.currency || "INR" })}</span></span>
          </div>
        </div>

        {/* Billing Schedule */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Billing Cycle & Due Schedule</span>
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Statement Cut-off:</span>
              <span className="font-bold text-slate-200">Day {card.billingCycleDay || 5} of month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Payment Due Day:</span>
              <span className="font-bold text-slate-200">Day {card.paymentDueDay || 25} of month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Next Payment Due:</span>
              <span className="font-bold text-cyan-400">{card.nextDueDate || "Upcoming"}</span>
            </div>
          </div>
        </div>

        {/* APR & Fees */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-400">Interest & Fees</span>
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">APR Interest Rate:</span>
              <span className="font-bold text-rose-400">{card.interestRate || "42.0"}% p.a.</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Annual Renewal Fee:</span>
              <span className="font-bold text-slate-200">{annualFee > 0 ? formatCurrency({ amount: annualFee.toFixed(2), currency: card.currency || "INR" }) : "Free / Waived"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Joining Fee:</span>
              <span className="font-bold text-slate-200">{joiningFee > 0 ? formatCurrency({ amount: joiningFee.toFixed(2), currency: card.currency || "INR" }) : "Free"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Specifications & Configurations */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Card Specifications & Configurations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Reward Program:</span>
            <span className="font-bold text-slate-200 truncate block mt-0.5">{card.rewardProgram || "Standard Rewards"}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Reward Balance:</span>
            <span className="font-bold text-amber-400 block mt-0.5">{(card.rewardPoints || 0).toLocaleString()} Pts</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Auto-Pay Enabled:</span>
            <span className={`font-bold block mt-0.5 ${card.autoPayEnabled ? "text-emerald-400" : "text-slate-400"}`}>
              {card.autoPayEnabled ? "Active" : "Disabled"}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Account Status:</span>
            <span className="font-bold text-emerald-400 block mt-0.5">{card.status || "ACTIVE"}</span>
          </div>
        </div>
        {card.notes && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-slate-400 block mb-1">Notes & Perks:</span>
            <p>{card.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
