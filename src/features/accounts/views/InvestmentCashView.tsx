import React from "react";

import { motion } from "framer-motion";
import { useInvestmentCash } from "../../../hooks/useFinanceQueries";
import { formatCurrency } from "../../../utils/formatters";
import { DollarSign, Clock, Download, BarChart2 } from "lucide-react";

export const InvestmentCashView: React.FC = () => {
  const { data: brokers = [], isLoading } = useInvestmentCash();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(3).fill(null).map((_, i) => <div key={i} className="h-56 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  const totalCash = brokers.reduce((s, b) => s + parseFloat(b.totalCash?.amount || "0"), 0);
  const totalWithdrawable = brokers.reduce((s, b) => {
    if (b.currency === "INR") return s + parseFloat(b.withdrawable?.amount || "0");
    return s;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-center">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Total Broker Cash (INR)</p>
          <p className="text-2xl font-extrabold text-slate-100">₹{(totalCash / 1000).toFixed(0)}K</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Withdrawable (INR)</p>
          <p className="text-2xl font-extrabold text-emerald-400">₹{(totalWithdrawable / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Broker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {brokers.map((broker, i) => {
          const total = parseFloat(broker.totalCash?.amount || "0");
          const avail = parseFloat(broker.availableToTrade?.amount || "0");
          const pending = parseFloat(broker.pendingSettlement?.amount || "0");
          const withdraw = parseFloat(broker.withdrawable?.amount || "0");
          const availPct = total > 0 ? Math.round((avail / total) * 100) : 0;

          return (
            <motion.div key={broker.brokerId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/30 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100">{broker.brokerName}</h4>
                      <p className="text-xs text-slate-400">{broker.recentTradesCount} recent trades</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    {broker.currency}
                  </span>
                </div>

                {/* Cash Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Available to Trade</span>
                      <span className="font-bold text-slate-100">{availPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${availPct}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Total", value: formatCurrency(total, broker.currency), icon: <DollarSign className="w-3 h-3 text-slate-400" /> },
                      { label: "Pending", value: formatCurrency(pending, broker.currency), icon: <Clock className="w-3 h-3 text-amber-400" /> },
                      { label: "Withdraw", value: formatCurrency(withdraw, broker.currency), icon: <Download className="w-3 h-3 text-emerald-400" /> },
                    ].map((m) => (
                      <div key={m.label} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                        <div className="flex justify-center mb-1">{m.icon}</div>
                        <p className="text-[9px] text-slate-500 uppercase font-semibold">{m.label}</p>
                        <p className="text-xs font-extrabold text-slate-100 mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
