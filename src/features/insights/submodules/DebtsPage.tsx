import React from "react";
import { useDebtAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { DebtPayoffChart } from "../components/DebtPayoffChart";
import { formatCurrency } from "../../../utils/formatters";
import { ShieldAlert, DollarSign, Award } from "lucide-react";

export const DebtsPage: React.FC = () => {
  const { data: debt, isLoading } = useDebtAnalytics();

  if (isLoading || !debt) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Debt Analytics & Payoff Strategy"
        description="Loan summary, credit card balances, debt-to-income ratios, and Snowball vs Avalanche optimization"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Debt Outstanding"
          value={debt.totalDebt}
          subtitle={`Monthly EMI: ${formatCurrency(debt.totalMonthlyEMI)}`}
          icon={<ShieldAlert className="w-6 h-6 text-rose-400" />}
          accentColor="rose"
        />

        <MetricCard
          title="Debt-to-Income Ratio"
          value={`${debt.debtToIncomeRatioPercent.toFixed(1)}%`}
          subtitle="Safe Ceiling: ≤ 35%"
          icon={<DollarSign className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Avalanche Interest Savings"
          value={debt.interestSavedAvalanche}
          subtitle={`Debt-free in ${debt.avalanchePayoffMonths} months`}
          icon={<Award className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />
      </div>

      {/* Payoff Comparison Component */}
      <DebtPayoffChart data={debt} />

      {/* Active Loans & Credit Cards List */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Outstanding Loans & Debt Balances</h3>
        <div className="space-y-3">
          {debt.debts.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <h5 className="font-bold text-slate-100 text-sm">{item.name}</h5>
                <span className="text-xs text-slate-400">{item.type} • {item.interestRatePercent}% p.a. interest</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-100 font-mono text-sm block">
                  {formatCurrency(item.principalOutstanding)}
                </span>
                <span className="text-xs text-indigo-400 font-semibold">
                  EMI: {formatCurrency(item.monthlyEMI)} / mo ({item.remainingTenureMonths} mo left)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
