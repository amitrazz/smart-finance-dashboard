import React from "react";
import { DebtAnalytics } from "../types/insightsTypes";
import { formatCurrency } from "../../../utils/formatters";
import { Award, Zap } from "lucide-react";

interface DebtPayoffChartProps {
  data: DebtAnalytics;
}

export const DebtPayoffChart: React.FC<DebtPayoffChartProps> = ({ data }) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Debt Payoff Strategy Engine
          </h3>
          <p className="text-xs text-slate-400">Snowball (Psychological wins) vs Avalanche (Math interest optimization)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Avalanche Strategy */}
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Award className="w-4 h-4" /> Avalanche Strategy (Recommended)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              Highest Savings
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Prioritizes paying off high-interest debt first (e.g. 42% Credit Card).
          </p>

          <div className="pt-2 border-t border-indigo-500/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Debt Free In</span>
              <span className="text-xl font-extrabold text-slate-100 font-mono">{data.avalanchePayoffMonths} Months</span>
            </div>
            <div>
              <span className="text-slate-400 block">Interest Saved</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatCurrency(data.interestSavedAvalanche)}
              </span>
            </div>
          </div>
        </div>

        {/* Snowball Strategy */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Snowball Strategy
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Quick Wins
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Prioritizes paying off smallest loan balance first regardless of interest rate.
          </p>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Debt Free In</span>
              <span className="text-xl font-bold text-slate-100 font-mono">{data.snowballPayoffMonths} Months</span>
            </div>
            <div>
              <span className="text-slate-400 block">Interest Saved</span>
              <span className="text-xl font-bold text-slate-300 font-mono">
                ₹85,000.00
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
