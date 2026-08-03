import React, { useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { InsightsSubNav } from "./components/InsightsSubNav";
import { OverviewPage } from "./submodules/OverviewPage";
import { FinancialHealthPage } from "./submodules/FinancialHealthPage";
import { NetWorthPage } from "./submodules/NetWorthPage";
import { CashFlowPage } from "./submodules/CashFlowPage";
import { SpendingPage } from "./submodules/SpendingPage";
import { IncomePage } from "./submodules/IncomePage";
import { BudgetsPage } from "./submodules/BudgetsPage";
import { GoalsPage } from "./submodules/GoalsPage";
import { InvestmentsPage } from "./submodules/InvestmentsPage";
import { DebtsPage } from "./submodules/DebtsPage";
import { SubscriptionsPage } from "./submodules/SubscriptionsPage";
import { TrendsPage } from "./submodules/TrendsPage";
import { ForecastsPage } from "./submodules/ForecastsPage";
import { RecommendationsPage } from "./submodules/RecommendationsPage";
import { RisksPage } from "./submodules/RisksPage";
import { ReportsPage } from "./submodules/ReportsPage";
import { TimeHorizon } from "./types/insightsTypes";
import { useQueryClient } from "@tanstack/react-query";

export const InsightsView: React.FC = () => {
  const { activeSubTab, showToast } = useUIStore();
  const [horizon, setHorizon] = useState<TimeHorizon>("1Y");
  const queryClient = useQueryClient();

  const currentTab = activeSubTab || "overview";

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["insights"] });
    showToast("Analytics workspace data refreshed", "success");
  };

  const handleExportPdf = () => {
    // There's no backend PDF/print generation yet (see ReportsPage), so this
    // takes the user to the Reports tab where that gap is explained honestly,
    // instead of claiming a download started.
    useUIStore.getState().setActiveSubTab("reports");
  };

  const renderActiveSubModule = () => {
    switch (currentTab) {
      case "financial-health":
        return <FinancialHealthPage />;
      case "net-worth":
        return <NetWorthPage horizon={horizon} onHorizonChange={setHorizon} />;
      case "cash-flow":
        return <CashFlowPage />;
      case "spending":
        return <SpendingPage />;
      case "income":
        return <IncomePage />;
      case "budgets":
        return <BudgetsPage />;
      case "goals":
        return <GoalsPage />;
      case "investments":
        return <InvestmentsPage />;
      case "debts":
        return <DebtsPage />;
      case "subscriptions":
        return <SubscriptionsPage />;
      case "trends":
        return <TrendsPage />;
      case "forecasts":
        return <ForecastsPage horizon={horizon} onHorizonChange={setHorizon} />;
      case "recommendations":
        return <RecommendationsPage />;
      case "risks":
        return <RisksPage />;
      case "reports":
        return <ReportsPage />;
      case "overview":
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Level 1 & Level 2 Hierarchical SubNav + Persistent Filter Toolbar */}
      <InsightsSubNav
        onExportPdf={handleExportPdf}
        onRefresh={handleRefresh}
      />

      {/* Active Submodule Workspace View */}
      {renderActiveSubModule()}
    </div>
  );
};
