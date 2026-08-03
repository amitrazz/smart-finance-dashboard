import React from "react";

import { motion } from "framer-motion";
import { useCashPosition } from "../../../hooks/useFinanceQueries";
import { formatCurrency } from "../../../utils/formatters";
import { BalanceCard } from "../components/BalanceCard";
import { LiquidityCard } from "../components/LiquidityCard";
import { CashAllocationChart } from "../components/CashAllocationChart";
import { Building2, DollarSign, Lock, Clock, ShieldCheck, TrendingUp } from "lucide-react";

export const CashPositionView: React.FC = () => {
  const { data: cashPos, isLoading } = useCashPosition();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array(3).fill(null).map((_, i) => <div key={i} className="h-36 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
        </div>
        <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  const totalNum = parseFloat(cashPos?.totalCash?.amount || "0");
  const availNum = parseFloat(cashPos?.availableCash?.amount || "0");
  const pendNum = parseFloat(cashPos?.pendingCash?.amount || "0");
  const lockNum = parseFloat(cashPos?.lockedFunds?.amount || "0");
  const emgNum = parseFloat(cashPos?.emergencyFund?.amount || "0");
  const invNum = parseFloat(cashPos?.investmentCash?.amount || "0");
  const currency = cashPos?.totalCash?.currency || "INR";

  const kpis = [
    { title: "Total Cash", amount: formatCurrency(totalNum, currency), icon: <DollarSign className="w-5 h-5" />, gradient: "from-emerald-500/20 to-teal-500/20", trend: { value: 3.2, isPositive: true } },
    { title: "Available Now", amount: formatCurrency(availNum, currency), icon: <TrendingUp className="w-5 h-5" />, gradient: "from-indigo-500/20 to-blue-500/20", trend: { value: 1.4, isPositive: true } },
    { title: "Pending Clearing", amount: formatCurrency(pendNum, currency), icon: <Clock className="w-5 h-5" />, gradient: "from-amber-500/20 to-orange-500/20", trend: { value: 0.8, isPositive: false } },
    { title: "Locked in FDs", amount: formatCurrency(lockNum, currency), icon: <Lock className="w-5 h-5" />, gradient: "from-purple-500/20 to-violet-500/20", trend: { value: 5.0, isPositive: true } },
    { title: "Emergency Reserve", amount: formatCurrency(emgNum, currency), icon: <ShieldCheck className="w-5 h-5" />, gradient: "from-teal-500/20 to-cyan-500/20", trend: { value: 2.1, isPositive: true } },
    { title: "Investment Cash", amount: formatCurrency(invNum, currency), icon: <Building2 className="w-5 h-5" />, gradient: "from-rose-500/20 to-pink-500/20", trend: { value: 7.2, isPositive: true } },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <BalanceCard
              title={kpi.title}
              amount={kpi.amount}
              currency=""
              icon={kpi.icon}
              gradient={kpi.gradient}
              trend={kpi.trend}
            />
          </motion.div>
        ))}
      </div>

      {/* Liquidity Spectrum */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <LiquidityCard
          available={cashPos?.availableCash?.amount || "0"}
          pending={cashPos?.pendingCash?.amount || "0"}
          locked={cashPos?.lockedFunds?.amount || "0"}
          emergency={cashPos?.emergencyFund?.amount || "0"}
          currency={currency}
        />
      </motion.div>

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <CashAllocationChart
          trendData={cashPos?.historical30DayTrend || []}
          allocationData={cashPos?.cashAllocation || []}
          currencyData={cashPos?.currencyBreakdown || []}
        />
      </motion.div>

      {/* Institution Breakdown */}
      {(cashPos?.institutionBreakdown?.length || 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Cash by Institution
              </h3>
              <p className="text-xs text-slate-400">Distribution of liquid cash across connected banks and institutions</p>
            </div>

            <div className="space-y-4">
              {(cashPos?.institutionBreakdown || []).map((inst) => {
                const amt = parseFloat(inst.amount?.amount || "0");
                return (
                  <div key={inst.institutionId} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      {inst.logoUrl ? (
                        <img src={inst.logoUrl} alt={inst.institutionName} className="w-6 h-6 object-contain" />
                      ) : (
                        <Building2 className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-100 truncate">{inst.institutionName}</span>
                        <span className="font-extrabold text-slate-100 ml-4 shrink-0">{formatCurrency(amt, currency)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                          style={{ width: `${inst.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{inst.percentage}% of total liquid cash</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
