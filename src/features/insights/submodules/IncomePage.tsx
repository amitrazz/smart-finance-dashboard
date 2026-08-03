import React from "react";
import { useIncomeAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { formatCurrency } from "../../../utils/formatters";
import { Wallet, TrendingUp, DollarSign } from "lucide-react";

export const IncomePage: React.FC = () => {
  const { data: income, isLoading } = useIncomeAnalytics();

  if (isLoading || !income) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Income Streams & Run Rate"
        description="Salary, passive dividends, freelance earnings, and YoY growth rate"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          title="Monthly Income Total"
          value={income.totalMonthlyIncome}
          deltaPercent={income.incomeGrowthPercent1Y}
          deltaLabel="1Y Growth"
          icon={<Wallet className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />

        <MetricCard
          title="Annualized Income Run Rate"
          value={income.annualIncomeRunRate}
          subtitle="Based on current monthly inflows"
          icon={<TrendingUp className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" /> Active Income Sources
        </h3>
        <div className="space-y-3">
          {income.sources.map((src) => (
            <div key={src.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <h5 className="font-bold text-slate-100 text-sm">{src.name}</h5>
                <span className="text-xs text-slate-400">{src.type} • Volatility: {src.volatilityRating}</span>
              </div>
              <span className="font-extrabold text-emerald-400 font-mono text-sm">
                {formatCurrency(src.monthlyAmount)} / mo
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
