import React from "react";

import { motion } from "framer-motion";
import { useFixedDeposits } from "../../../hooks/useFinanceQueries";
import { formatCurrency } from "../../../utils/formatters";
import { StatusBadge } from "../components/StatusBadge";
import { Lock, Calendar, TrendingUp, Percent } from "lucide-react";

export const FixedDepositsView: React.FC = () => {
  const { data: fds = [], isLoading } = useFixedDeposits();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        {Array(2).fill(null).map((_, i) => <div key={i} className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  const totalPrincipal = fds.reduce((s, f) => s + parseFloat(f.principal?.amount || "0"), 0);
  const totalValue = fds.reduce((s, f) => s + parseFloat(f.currentValue?.amount || "0"), 0);
  const totalInterest = fds.reduce((s, f) => s + parseFloat(f.interestEarned?.amount || "0"), 0);
  const avgRate = fds.length > 0 ? (fds.reduce((s, f) => s + f.interestRate, 0) / fds.length).toFixed(2) : "0";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Principal", value: formatCurrency(totalPrincipal, "INR"), icon: <Lock className="w-4 h-4 text-indigo-400" /> },
          { label: "Current Value", value: formatCurrency(totalValue, "INR"), icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
          { label: "Interest Earned", value: formatCurrency(totalInterest, "INR"), icon: <TrendingUp className="w-4 h-4 text-teal-400" /> },
          { label: "Avg Interest Rate", value: `${avgRate}% p.a.`, icon: <Percent className="w-4 h-4 text-amber-400" /> },
        ].map((item) => (
          <div key={item.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="p-2 rounded-xl bg-slate-800/80 w-fit">{item.icon}</div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">{item.label}</p>
            <p className="font-extrabold text-sm text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>

      {/* FD Cards */}
      {fds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fds.map((fd, i) => {
            const principal = parseFloat(fd.principal?.amount || "0");
            const currentValue = parseFloat(fd.currentValue?.amount || "0");
            const interest = parseFloat(fd.interestEarned?.amount || "0");
            const growth = principal > 0 ? ((currentValue - principal) / principal * 100).toFixed(1) : "0";

            const maturityDate = new Date(fd.maturityDate);
            const now = new Date();
            const daysToMaturity = Math.max(0, Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 86400)));
            const progressPct = fd.tenureMonths > 0
              ? Math.min(100, Math.round((1 - daysToMaturity / (fd.tenureMonths * 30)) * 100))
              : 50;

            return (
              <motion.div key={fd.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-base">{fd.accountName}</h4>
                        <p className="text-xs text-slate-400">{fd.institutionName} • {fd.accountNumber}</p>
                      </div>
                    </div>
                    <StatusBadge status={fd.status} size="sm" />
                  </div>

                  {/* Value Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Principal</p>
                      <p className="text-sm font-extrabold text-slate-100">₹{(principal / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Current</p>
                      <p className="text-sm font-extrabold text-emerald-400">₹{(currentValue / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-teal-500/5 border border-teal-500/20">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Earned</p>
                      <p className="text-sm font-extrabold text-teal-400">₹{(interest / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  {/* Interest Rate & Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Percent className="w-3 h-3 text-amber-400" />
                        {fd.interestRate}% p.a. • {fd.tenureMonths}M tenure
                      </span>
                      <span className="font-bold text-emerald-400">+{growth}% growth</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Started {fd.startDate}</span>
                      <span>{daysToMaturity > 0 ? `Matures in ${daysToMaturity} days` : "Matured"}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-300">No Fixed Deposits</h3>
          <p className="text-sm text-slate-400">Add fixed deposits to track locked capital, interest earned, and maturity dates.</p>
        </div>
      )}
    </div>
  );
};
