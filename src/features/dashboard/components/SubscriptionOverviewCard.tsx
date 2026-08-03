import React from "react";
import { RefreshCcw, ArrowRight, PlusCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { useSubscriptions } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";

export const SubscriptionOverviewCard: React.FC = () => {
  const { data: subscriptionsData, isLoading } = useSubscriptions({ limit: 5 });
  const { setActiveTab } = useUIStore();

  const subsList = Array.isArray(subscriptionsData) ? subscriptionsData : [];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-md">
            <RefreshCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Subscriptions & Recurring Outflows
            </h3>
            <p className="text-xs text-slate-400">Automated recurring billing & potential savings</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("accounts")}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>All Subscriptions</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Subscriptions List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse flex-1">
          <div className="h-14 bg-slate-950 rounded-2xl border border-slate-800" />
          <div className="h-14 bg-slate-950 rounded-2xl border border-slate-800" />
        </div>
      ) : subsList.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
          <p className="text-xs text-slate-300 font-bold">No Subscriptions Tracked</p>
          <p className="text-[11px] text-slate-400 max-w-xs">Track recurring software, streaming, and membership charges.</p>
          <button
            onClick={() => setActiveTab("accounts")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Subscription</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 flex flex-col justify-center">
          {subsList.slice(0, 4).map((sub) => (
            <div
              key={sub.id}
              className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0 font-extrabold text-xs">
                  {sub.name[0]}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{sub.name}</h4>
                  <span className="text-[10px] text-slate-400">Next due: {sub.nextDueDate || "Upcoming"}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-white block">{formatCurrency(sub.amount)}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">{sub.billingCycle || "MONTHLY"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
