import React from "react";
import { useSubscriptionAnalytics } from "../../hooks/useInsightsQueries";
import { AnalyticsSection } from "../../components/common/AnalyticsSection";
import { AnalyticsKpi, AnalyticsKpiRow } from "../../components/common/AnalyticsKpi";
import { Money } from "../../../../components/common/Money";
import { formatDate } from "../../../../utils/formatters";
import { useUIStore } from "../../../../store/useUIStore";

/**
 * Recurring commitments.
 *
 * The previous version led with "0 Unused" and "₹0.00 Potential Annual
 * Savings", both hardcoded, plus per-row "Last used: " with an empty value —
 * usage tracking that does not exist anywhere in the backend, presented as a
 * finding of zero waste. Detected subscriptions and their cycles are what the
 * endpoint returns, so that is what this shows.
 */
export const SubscriptionsSection: React.FC = () => {
  const subscriptions = useSubscriptionAnalytics();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  return (
    <AnalyticsSection
      title="Subscriptions"
      description="Recurring payments detected against your accounts."
      result={subscriptions}
      link={{ label: "Calendar & Alerts", onClick: () => navigateToRoute("notifications") }}
      emptyTitle="No subscriptions detected"
      emptyMessage="Recurring payments are detected from your transaction history."
    >
      {(data) => (
        <div className="space-y-6">
          <AnalyticsKpiRow columns={2}>
            <AnalyticsKpi
              label="Monthly cost"
              value={data.totalMonthlyCost}
              money
              upIsGood={false}
              caption="Monthly-billed subscriptions only"
            />
            <AnalyticsKpi
              label="Subscriptions"
              value={data.totalSubscriptionsCount}
              precision={0}
            />
          </AnalyticsKpiRow>

          <ul className="divide-y divide-slate-800/70">
            {data.subscriptions.map((subscription) => (
              <li
                key={subscription.id}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-200">{subscription.name}</p>
                  <p className="truncate text-[11px] capitalize text-slate-500">
                    {[
                      subscription.billingCycle?.toLowerCase(),
                      subscription.nextDueDate
                        ? `next ${formatDate(subscription.nextDueDate)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums text-slate-200">
                  <Money value={subscription.amount} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AnalyticsSection>
  );
};
