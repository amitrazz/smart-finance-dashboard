import React from "react";
import { BudgetCategoryLine } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { Settings2 } from "lucide-react";

interface BudgetCategoryCardProps {
  line: BudgetCategoryLine;
  onAdjust?: () => void;
}

const STATUS_COLORS: Record<BudgetCategoryLine["healthStatus"], string> = {
  HEALTHY: "bg-emerald-500",
  NEAR_LIMIT: "bg-amber-500",
  EXCEEDED: "bg-rose-500",
};

export const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({ line, onAdjust }) => (
  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-bold text-slate-100 truncate">{line.categoryName}</span>
      {onAdjust && (
        <button onClick={onAdjust} aria-label={`Adjust ${line.categoryName} budget`} className="text-slate-500 hover:text-slate-300">
          <Settings2 className="w-4 h-4" />
        </button>
      )}
    </div>
    <div className="flex items-baseline justify-between text-xs">
      <span className="font-bold text-slate-100">{formatCurrency(line.spentAmount)}</span>
      <span className="text-slate-500">of {formatCurrency(line.allocatedAmount)}</span>
    </div>
    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
      <div
        className={`h-full rounded-full ${STATUS_COLORS[line.healthStatus]} transition-all duration-500`}
        style={{ width: `${Math.min(100, line.utilizationPercent)}%` }}
      />
    </div>
    <div className="flex items-center justify-between text-[11px] text-slate-500">
      <span>{formatCurrency(line.remainingAmount)} left</span>
      <span>{line.utilizationPercent}% used</span>
    </div>
  </div>
);

export default BudgetCategoryCard;
