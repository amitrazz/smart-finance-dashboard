import React from "react";
import { Target, ArrowRight, PlusCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { useGoals } from "../../../hooks/useFinanceQueries";
import { useUIStore } from "../../../store/useUIStore";
import { Goal } from "../../../types";

export const GoalsGrid: React.FC = () => {
  const { data: goalsRaw = [], isLoading } = useGoals();
  const { setActiveTab } = useUIStore();

  const goals = goalsRaw;

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-md">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Financial Goals & Wealth Targets
            </h3>
            <p className="text-xs text-slate-400">Target milestones & accumulated reserves</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("planning", "goals")}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>All Goals</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Goals Cards Stack */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse flex-1">
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
          <div className="h-16 bg-slate-950 rounded-2xl border border-slate-800" />
        </div>
      ) : goals.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
          <p className="text-xs text-slate-300 font-bold">No Financial Goals Defined</p>
          <p className="text-[11px] text-slate-400 max-w-xs">Create goals (e.g. Emergency Fund, House Downpayment) to track savings progress.</p>
          <button
            onClick={() => setActiveTab("planning", "goals")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 items-center">
          {goals.slice(0, 3).map((g: Goal) => {
            const target = parseFloat(g.targetAmount?.amount || "0");
            const current = parseFloat(g.currentAmount?.amount || "0");
            const percent = target > 0 ? (current / target) * 100 : 0;
            const currency = g.targetAmount?.currency || "INR";

            return (
              <div
                key={g.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-100 truncate">{g.name}</span>
                  <span className="text-[10px] font-extrabold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                    {percent.toFixed(0)}%
                  </span>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-white font-sans truncate">
                    {formatCurrency({ amount: String(current), currency })}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Target: {formatCurrency({ amount: String(target), currency })}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
