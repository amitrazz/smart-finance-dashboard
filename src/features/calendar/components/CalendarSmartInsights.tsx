import React from "react";
import { TrendingUp, TrendingDown, DollarSign, CalendarCheck, Sparkles } from "lucide-react";
import { useFinancialCalendarSummary } from "../hooks/useFinancialCalendar";
import { formatCurrency } from "../../../utils/formatters";

export const CalendarSmartInsights: React.FC = () => {
  const summary = useFinancialCalendarSummary();

  const isNetPositive = parseFloat(summary.netCashFlow.amount || "0") >= 0;

  return (
    <div className="w-full rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 shadow-2xl space-y-5">
      {/* Top Banner Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Next 30 Days Financial Outlook</h3>
            <p className="text-xs text-slate-400">AI-projected cash flow commitments & expected inflows</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            30-Day Cash Projection
          </span>
        </div>
      </div>

      {/* Main Cash Flow Projection Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Outgoing Commitments */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Outgoing</span>
            <div className="text-xl font-extrabold text-rose-400 font-sans">
              {formatCurrency(summary.upcoming30DaysOutgoing)}
            </div>
            <p className="text-[10px] text-slate-400">Bills, EMIs, SIPs, Cards & Subscriptions</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Incoming Cash Flow */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Incoming</span>
            <div className="text-xl font-extrabold text-emerald-400 font-sans">
              {formatCurrency(summary.upcoming30DaysIncoming)}
            </div>
            <p className="text-[10px] text-slate-400">Salary, FD Maturities & Dividends</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Net Cash Surplus / Deficit */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Net Cash Position</span>
            <div className={`text-xl font-extrabold font-sans ${isNetPositive ? "text-indigo-400" : "text-amber-400"}`}>
              {isNetPositive ? "+" : ""}{formatCurrency(summary.netCashFlow)}
            </div>
            <p className="text-[10px] text-slate-400">Available cash surplus after all dues</p>
          </div>
          <div className={`p-3 rounded-xl ${isNetPositive ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Event Counts Breakdown Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
          <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
          Approaching Dues:
        </span>

        {summary.counts.bills > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {summary.counts.bills} {summary.counts.bills === 1 ? "Bill" : "Bills"}
          </span>
        )}

        {summary.counts.emis > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {summary.counts.emis} {summary.counts.emis === 1 ? "EMI" : "EMIs"}
          </span>
        )}

        {summary.counts.sips > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {summary.counts.sips} {summary.counts.sips === 1 ? "SIP" : "SIPs"}
          </span>
        )}

        {summary.counts.creditCards > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {summary.counts.creditCards} Credit Card
          </span>
        )}

        {summary.counts.salary > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {summary.counts.salary} Salary
          </span>
        )}

        {summary.counts.fdMaturity > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {summary.counts.fdMaturity} FD Maturity
          </span>
        )}

        {summary.counts.subscriptions > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
            {summary.counts.subscriptions} Subscriptions
          </span>
        )}

        {summary.counts.insurance > 0 && (
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            {summary.counts.insurance} Insurance Renewal
          </span>
        )}
      </div>
    </div>
  );
};
