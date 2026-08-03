import React from "react";
import { PiggyBank } from "lucide-react";
import { Money } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface SavingsWidgetProps {
  totalCurrentCorpus?: Money;
  totalTargetCorpus?: Money;
  monthlyContribution?: Money;
}

export const SavingsWidget: React.FC<SavingsWidgetProps> = ({ totalCurrentCorpus, totalTargetCorpus, monthlyContribution }) => {
  const current = parseFloat(totalCurrentCorpus?.amount ?? "0") || 0;
  const target = parseFloat(totalTargetCorpus?.amount ?? "0") || 0;
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/5 via-slate-900/60 to-slate-900/80 border border-emerald-500/20 space-y-4">
      <div className="flex items-center gap-2">
        <PiggyBank className="w-4 h-4 text-emerald-400" aria-hidden="true" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Savings Progress</p>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-slate-100">{formatCurrency(totalCurrentCorpus)}</span>
        <span className="text-xs text-slate-500">of {formatCurrency(totalTargetCorpus)}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/60">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-slate-400">{formatCurrency(monthlyContribution)}/mo contributed across all goals</p>
    </div>
  );
};

export default SavingsWidget;
