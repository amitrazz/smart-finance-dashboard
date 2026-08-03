import React from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Scale } from "lucide-react";
import { formatCurrency, formatPercent } from "../../../utils/formatters";
import { Money } from "../../../types";

interface CashFlowCardProps {
  monthlyIncome?: Money;
  monthlySpend?: Money;
  savingsRate?: number;
}

export const CashFlowCard: React.FC<CashFlowCardProps> = ({
  monthlyIncome,
  monthlySpend,
  savingsRate = 0,
}) => {
  const incomeVal = parseFloat(monthlyIncome?.amount || "0");
  const spendVal = parseFloat(monthlySpend?.amount || "0");
  const surplusVal = Math.max(0, incomeVal - spendVal);
  const currency = monthlyIncome?.currency || "INR";

  const spendPercent = incomeVal > 0 ? Math.min(100, (spendVal / incomeVal) * 100) : 0;
  const surplusPercent = incomeVal > 0 ? Math.max(0, 100 - spendPercent) : 0;

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 h-full flex flex-col justify-between w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-md">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 font-sans tracking-tight">
              Cash Flow & Net Surplus Ratio
            </h3>
            <p className="text-xs text-slate-400">Monthly Inflow vs Outflow & Allocation Balance</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
            Savings: {formatPercent(savingsRate)}
          </span>
        </div>
      </div>

      {/* 4 Stat Breakdown Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 items-center">
        {/* Income */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Income</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-emerald-400 font-sans truncate">
            +{formatCurrency({ amount: String(incomeVal), currency })}
          </p>
          <span className="text-[10px] text-slate-500 block truncate">100% Inflow Base</span>
        </div>

        {/* Expenses */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Expenses</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-rose-400 font-sans truncate">
            -{formatCurrency({ amount: String(spendVal), currency })}
          </p>
          <span className="text-[10px] text-slate-500 block truncate">{spendPercent.toFixed(0)}% Outflow</span>
        </div>

        {/* Net Surplus */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Net Surplus</span>
            <PiggyBank className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-teal-400 font-sans truncate">
            +{formatCurrency({ amount: String(surplusVal), currency })}
          </p>
          <span className="text-[10px] text-slate-500 block truncate">{surplusPercent.toFixed(0)}% Retained</span>
        </div>

        {/* Remaining Balance */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Flow Balance</span>
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-indigo-400 font-sans truncate">
            {formatCurrency({ amount: String(surplusVal), currency })}
          </p>
          <span className="text-[10px] text-slate-500 block truncate">Available for Goals</span>
        </div>
      </div>

      {/* Visual Stacked Cash Flow Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Inflow Allocation Bar</span>
          <span>
            <strong className="text-rose-400">{spendPercent.toFixed(0)}% Outflow</strong> •{" "}
            <strong className="text-emerald-400">{surplusPercent.toFixed(0)}% Surplus</strong>
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 flex">
          <div
            className="h-full bg-rose-500/80 transition-all duration-500"
            style={{ width: `${spendPercent}%` }}
            title={`Expenses: ${spendPercent.toFixed(1)}%`}
          />
          <div
            className="h-full bg-emerald-500/80 transition-all duration-500"
            style={{ width: `${surplusPercent}%` }}
            title={`Savings: ${surplusPercent.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
};
