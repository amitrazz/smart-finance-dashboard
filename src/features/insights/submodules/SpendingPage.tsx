import React from "react";
import { useSpendingAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { SpendingHeatmap } from "../components/SpendingHeatmap";
import { formatCurrency } from "../../../utils/formatters";
import { CreditCard, ShoppingBag, AlertTriangle, Layers } from "lucide-react";

export const SpendingPage: React.FC = () => {
  const { data: spending, isLoading } = useSpendingAnalytics();

  if (isLoading || !spending) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Spending Intelligence & Velocity"
        description="Drill down into category breakdowns, merchant patterns, needs vs wants, and spend anomalies"
      />

      {/* Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Monthly Expenditure"
          value={spending.totalSpent}
          icon={<CreditCard className="w-6 h-6 text-amber-400" />}
          accentColor="amber"
        />

        <MetricCard
          title="Essential Needs Outflow"
          value={spending.needsTotal}
          subtitle={`${spending.needsPercent.toFixed(1)}% of total monthly spend`}
          icon={<Layers className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Discretionary Wants Outflow"
          value={spending.wantsTotal}
          subtitle={`${spending.wantsPercent.toFixed(1)}% of total monthly spend`}
          icon={<ShoppingBag className="w-6 h-6 text-rose-400" />}
          accentColor="rose"
        />
      </div>

      {/* Calendar Heatmap */}
      <SpendingHeatmap data={spending.dailyVelocity} />

      {/* Categories & Top Merchants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Drill-down */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100">Category Outflow Drill-Down</h3>
          <div className="space-y-3">
            {spending.categories.map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{cat.categoryName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cat.needsVsWants === "NEEDS" ? "bg-indigo-500/10 text-indigo-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {cat.needsVsWants}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{cat.percentage.toFixed(1)}% of budget</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-100 font-mono text-sm block">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className={`text-xs font-semibold ${cat.monthOverMonthPercent > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {cat.monthOverMonthPercent > 0 ? "+" : ""}{cat.monthOverMonthPercent.toFixed(1)}% MoM
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Merchants & Anomalies */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100">Top Outflow Merchants</h3>
            <div className="space-y-3">
              {spending.topMerchants.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <h5 className="font-bold text-slate-100 text-sm">{m.merchantName}</h5>
                    <span className="text-xs text-slate-400">{m.transactionCount} Txns • {m.category}</span>
                  </div>
                  <span className="font-extrabold text-slate-100 font-mono text-sm">
                    {formatCurrency(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies Warning Card */}
          {spending.detectedAnomalies.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Detected Spending Anomaly
              </h4>
              <p className="text-xs text-slate-200">{spending.detectedAnomalies[0].description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
