import React from "react";
import { Goal } from "../../../types";
import { formatCurrency } from "../../../utils/formatters";
import { Target, ArrowRight, Layers } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

interface GoalProgressCardProps {
  goal: Goal;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ goal }) => {
  const { setActiveTab } = useUIStore();

  const progress = Math.min(100, goal.progressPercent || 0);
  const currentAmount = goal.currentAmount || goal.currentCorpus;
  const linkedInvestmentCount = goal.linkedInvestmentIds?.length || 0;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            {(goal.category || goal.type || "").replace(/_/g, " ")}
          </span>
          <h4 className="text-base font-bold text-slate-100">{goal.name}</h4>
        </div>
        <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-indigo-400">
          <Target className="w-5 h-5" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Progress</span>
          <span className="text-slate-100 font-extrabold">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 90 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-indigo-500 to-sky-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Current</span>
          <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
            {currentAmount ? formatCurrency(currentAmount) : "—"}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Amount</span>
          <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {goal.status}
          </span>
          {linkedInvestmentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Layers className="w-3.5 h-3.5" /> {linkedInvestmentCount} linked holding{linkedInvestmentCount === 1 ? "" : "s"}
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
