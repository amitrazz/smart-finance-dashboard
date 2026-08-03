import React from "react";
import { motion } from "framer-motion";
import { Target, Calendar, AlertTriangle } from "lucide-react";
import { Goal } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { ProgressRing } from "./ProgressRing";

interface GoalCardProps {
  goal: Goal;
  onSelect: (id: string) => void;
  compact?: boolean;
}

const PRIORITY_COLORS: Record<Goal["priority"], string> = {
  CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  HIGH: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  MEDIUM: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  LOW: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onSelect, compact = false }) => {
  const current = goal.currentAmount ?? goal.currentCorpus;
  const isBehind = goal.forecast?.isBehindSchedule;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={() => onSelect(goal.id)}
      className="w-full text-left p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 shadow-lg transition-all duration-200 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 shrink-0">
            <Target className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate">{goal.name}</h3>
            <span
              className={`inline-flex mt-1 items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${PRIORITY_COLORS[goal.priority]}`}
            >
              {goal.priority}
            </span>
          </div>
        </div>
        {!compact && <ProgressRing percent={goal.progressPercent} size={52} strokeWidth={5} />}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-extrabold text-slate-100">{formatCurrency(current)}</span>
          <span className="text-xs text-slate-500">of {formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, goal.progressPercent))}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          {goal.targetDate ? formatDate(goal.targetDate) : "No target date"}
        </span>
        {isBehind && (
          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            Behind schedule
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default GoalCard;
