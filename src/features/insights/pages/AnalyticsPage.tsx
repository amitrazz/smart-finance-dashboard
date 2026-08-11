import React from "react";
import { NetWorthSection } from "./analytics/NetWorthSection";
import { CashFlowSection } from "./analytics/CashFlowSection";
import { SpendingSection } from "./analytics/SpendingSection";
import { IncomeSection } from "./analytics/IncomeSection";
import { BudgetSection } from "./analytics/BudgetSection";
import { GoalsSection } from "./analytics/GoalsSection";
import { InvestmentsSection } from "./analytics/InvestmentsSection";
import { DebtSection } from "./analytics/DebtSection";
import { SubscriptionsSection } from "./analytics/SubscriptionsSection";

/**
 * The analytics workspace: one domain at a time.
 *
 * Rendering all nine domains at once is the failure mode this avoids. It would
 * fire every analytics endpoint on mount for a page nobody reads end to end,
 * and it would bury the domain someone actually came for under eight others.
 * The sub-nav picks one; only that one's queries run.
 *
 * Every section follows the same rhythm — heading, KPI row, primary chart,
 * breakdown — so the second domain you visit is already familiar.
 */
export const AnalyticsPage: React.FC<{ view: string | null }> = ({ view }) => {
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
