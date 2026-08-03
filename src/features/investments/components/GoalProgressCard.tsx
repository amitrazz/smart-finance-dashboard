import React from "react";
import { InvestmentGoalLink } from "../types/investmentTypes";
import { formatCurrency } from "../../../utils/formatters";
import { Target, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface GoalProgressCardProps {
  goal: InvestmentGoalLink;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ goal }) => {
  const { setActiveTab } = useUIStore();

  const isBehind = goal.isBehindSchedule;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            {goal.goalCategory.replace("_", " ")}
          </span>
          <h4 className="text-base font-bold text-slate-100">{goal.goalName}</h4>
        </div>
        <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-indigo-400">
          <Target className="w-5 h-5" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Progress</span>
          <span className="text-slate-100 font-extrabold">{goal.goalProgressPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goal.goalProgressPercent >= 90
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : isBehind
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-indigo-500 to-sky-400"
            }`}
            style={{ width: `${Math.min(100, goal.goalProgressPercent)}%` }}
          />
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Allocated</span>
          <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
            {formatCurrency(goal.currentValue)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Amount</span>
          <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Funding Gap</span>
          <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">
            {formatCurrency(goal.fundingGap)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Req. Monthly SIP</span>
          <span className="text-sm font-bold text-indigo-400 font-mono mt-0.5 block">
            {formatCurrency(goal.requiredMonthlyContribution)}
          </span>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          {isBehind ? (
            <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" /> Behind by ~9 months
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> On Track ({goal.targetDate})
            </span>
          )}
        </div>

        <button
          onClick={() => setActiveTab("planning", "goals")}
          className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>Goal Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
