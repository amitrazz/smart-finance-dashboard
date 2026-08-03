import React from "react";
import { useSubscriptionAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { MetricCard } from "../components/MetricCard";
import { formatCurrency } from "../../../utils/formatters";
import { Repeat, AlertTriangle, CheckCircle2 } from "lucide-react";

export const SubscriptionsPage: React.FC = () => {
  const { data: sub, isLoading } = useSubscriptionAnalytics();

  if (isLoading || !sub) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Subscription Audit & Savings Opportunities"
        description="Track recurring SaaS services, unused memberships, price increases, and potential annual savings"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Monthly Subscription Outflow"
          value={sub.totalMonthlyCost}
          subtitle={`Annual Total: ${formatCurrency(sub.totalAnnualCost)}`}
          icon={<Repeat className="w-6 h-6 text-indigo-400" />}
          accentColor="indigo"
        />

        <MetricCard
          title="Unused Subscriptions"
          value={`${sub.unusedCount} Unused`}
          subtitle="Zero usage detected in last 60 days"
          icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
          accentColor="amber"
        />

        <MetricCard
          title="Potential Annual Savings"
          value={sub.potentialAnnualSavings}
          subtitle="If unused memberships canceled"
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          accentColor="emerald"
        />
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-slate-100">Monitored Subscription Services</h3>
        <div className="space-y-3">
          {sub.subscriptions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-slate-100 text-sm">{s.name}</h5>
                  {s.isUnused && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      UNUSED
                    </span>
                  )}
                  {s.priceIncreaseFlag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                      PRICE HIKE
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{s.category} • Last used: {s.lastUsedDate}</span>
              </div>
              <span className="font-extrabold text-slate-100 font-mono text-sm">
                {formatCurrency(s.monthlyCost)} / mo
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
