import React from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Budget } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface BudgetCardProps {
  budget: Budget;
  onSelect: (id: string) => void;
}

const GRADE_COLORS: Record<string, string> = {
  EXCELLENT: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  GOOD: "text-sky-400 border-sky-500/20 bg-sky-500/10",
  FAIR: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  WARNING: "text-orange-400 border-orange-500/20 bg-orange-500/10",
  CRITICAL: "text-rose-400 border-rose-500/20 bg-rose-500/10",
};

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onSelect }) => {
  const utilization = budget.utilizationPercent ?? 0;
  const barColor = utilization >= 100 ? "bg-rose-500" : utilization >= 85 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={() => onSelect(budget.id)}
      className="w-full text-left p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 shadow-lg transition-all duration-200 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 shrink-0">
            <Wallet className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-100 truncate">{budget.name}</h3>
            <span className="text-[11px] text-slate-500">{budget.period}</span>
          </div>
        </div>
        {budget.budgetHealthGrade && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${GRADE_COLORS[budget.budgetHealthGrade] ?? ""}`}>
            {budget.budgetHealthGrade}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-extrabold text-slate-100">{formatCurrency(budget.totalSpent)}</span>
          <span className="text-xs text-slate-500">of {formatCurrency(budget.totalLimit)}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(100, utilization)}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{formatCurrency(budget.remainingAmount)} remaining</span>
        {typeof budget.daysRemaining === "number" && <span>{budget.daysRemaining}d left</span>}
      </div>
    </motion.button>
  );
};

export default BudgetCard;
