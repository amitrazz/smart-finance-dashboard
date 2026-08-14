import React from "react";
import { InsightsRoute, INSIGHTS_SECTIONS } from "../insightsNav";
import { ContextSelector } from "../components/primitives/ContextSelector";
import { NetWorthSection } from "./analytics/NetWorthSection";
import { CashFlowSection } from "./analytics/CashFlowSection";
import { SpendingSection } from "./analytics/SpendingSection";
import { IncomeSection } from "./analytics/IncomeSection";
import { BudgetSection } from "./analytics/BudgetSection";
import { GoalsSection } from "./analytics/GoalsSection";
import { InvestmentsSection } from "./analytics/InvestmentsSection";
import { DebtSection } from "./analytics/DebtSection";
import { SubscriptionsSection } from "./analytics/SubscriptionsSection";

const ANALYTICS_VIEWS = INSIGHTS_SECTIONS.find((section) => section.id === "analytics")?.views ?? [];

/**
 * Analytics: the exploration layer, one domain at a time.
 *
 * Two things decide this page's shape.
 *
 * **The domain is a choice, not a destination.** Nine domains used to occupy a
 * full-width scrolling pill row directly under the section tabs — a third
 * navigation layer, with options four through nine off the right edge of a
 * laptop screen. As a selector, all nine are visible at once with their
 * descriptions, and the page below starts a row higher.
 *
 * **One domain at a time, still.** Rendering all nine would fire every analytics
 * endpoint on mount for a page nobody reads end to end. Only the selected
 * domain's queries run, and the selection lives in the route, so a link to
 * `#/insights/analytics/spending` still opens spending.
 */
export const AnalyticsPage: React.FC<{
  view: string | null;
  onNavigate: (route: InsightsRoute) => void;
}> = ({ view, onNavigate }) => {
  const active = ANALYTICS_VIEWS.find((v) => v.id === view) ?? ANALYTICS_VIEWS[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ContextSelector
          label="Analytics domain"
          showLabel
          value={active?.id ?? "net-worth"}
          options={ANALYTICS_VIEWS.map((v) => ({ id: v.id, label: v.label, hint: v.hint }))}
          onChange={(id) => onNavigate({ section: "analytics", view: id })}
        />
        {active?.hint && (
          <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-right">
            {active.hint}. The period selector in the header applies here.
          </p>
        )}
      </div>

      <AnalyticsDomain view={active?.id ?? null} />
    </div>
  );
};

const AnalyticsDomain: React.FC<{ view: string | null }> = ({ view }) => {
  switch (view) {
    case "cash-flow":
      return <CashFlowSection />;
    case "spending":
      return <SpendingSection />;
    case "income":
      return <IncomeSection />;
    case "budget":
      return <BudgetSection />;
    case "goals":
      return <GoalsSection />;
    case "investments":
      return <InvestmentsSection />;
    case "debt":
      return <DebtSection />;
    case "subscriptions":
      return <SubscriptionsSection />;
    case "net-worth":
    default:
      return <NetWorthSection />;
  }
};
