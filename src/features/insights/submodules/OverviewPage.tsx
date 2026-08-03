import React from "react";
import {
  useFinancialHealthAnalytics,
  useNetWorthAnalytics,
  useCashFlowAnalytics,
  useSpendingAnalytics,
  useRecommendationInbox,
  useRiskMatrixAnalytics,
  useForecastAnalytics,
} from "../hooks/useInsightsQueries";
import { MetricCard } from "../components/MetricCard";
import { HealthScoreWidget } from "../components/HealthScoreWidget";
import { RecommendationCard } from "../components/RecommendationCard";
import { RiskCard } from "../components/RiskCard";
import { ForecastChart } from "../components/ForecastChart";
import { Wallet, DollarSign, CreditCard, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export const OverviewPage: React.FC = () => {
  const { data: health } = useFinancialHealthAnalytics();
  const { data: netWorth } = useNetWorthAnalytics();
  const { data: cashFlow } = useCashFlowAnalytics();
  const { data: spending } = useSpendingAnalytics();
  const { data: recommendations = [] } = useRecommendationInbox();
  const { data: risks } = useRiskMatrixAnalytics();
  const { data: forecasts } = useForecastAnalytics();
  const { setActiveSubTab } = useUIStore();

  return (
    <div className="space-y-8">
      {/* Hero Financial Intelligence Command Banner */}
      {health && <HealthScoreWidget data={health} />}

      {/* Primary Financial Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {netWorth && (
          <MetricCard
            title="Current Net Worth"
            value={netWorth.currentNetWorth}
            deltaPercent={netWorth.monthlyChangePercent}
            deltaLabel="vs last month"
            icon={<Wallet className="w-6 h-6 text-emerald-400" />}
            accentColor="emerald"
          />
        )}

        {cashFlow && (
          <MetricCard
            title="Monthly Cash Surplus"
            value={cashFlow.netCashFlowThisMonth}
            subtitle={`Savings Rate: ${cashFlow.savingsRatePercent.toFixed(1)}%`}
            icon={<DollarSign className="w-6 h-6 text-indigo-400" />}
            accentColor="indigo"
          />
        )}

        {spending && (
          <MetricCard
            title="Monthly Expenditures"
            value={spending.totalSpent}
            subtitle={`Needs: ${spending.needsPercent.toFixed(0)}% | Wants: ${spending.wantsPercent.toFixed(0)}%`}
            icon={<CreditCard className="w-6 h-6 text-amber-400" />}
            accentColor="amber"
          />
        )}

        {risks && (
          <MetricCard
            title="Risk Matrix Status"
            value={`${risks.highCount + risks.criticalCount} Active Warnings`}
            subtitle={`${risks.risks.length} Total Monitored Risks`}
            icon={<ShieldAlert className="w-6 h-6 text-rose-400" />}
            accentColor="rose"
          />
        )}
      </div>

      {/* Priority Recommendations & Active Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> High-Impact Action Items
            </h3>
            <button
              onClick={() => setActiveSubTab("recommendations")}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {recommendations.slice(0, 2).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Risk Matrix & Financial Warnings
            </h3>
            <button
              onClick={() => setActiveSubTab("risks")}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {risks?.risks.slice(0, 2).map((risk) => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </div>
      </div>

      {/* 30D - 3Y Forecast Area Chart */}
      {forecasts && <ForecastChart data={forecasts.forecasts} />}
    </div>
  );
};
