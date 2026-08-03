import React, { useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { InvestmentsSubNav } from "./components/InvestmentsSubNav";
import { AddTradeModal } from "./components/AddTradeModal";
import { SearchAndFilterDrawer } from "./components/SearchAndFilterDrawer";
import { ImportWizardModal } from "./components/ImportWizardModal";
import { ReportsGeneratorModal } from "./components/ReportsGeneratorModal";
import { AssetDetailDrawer } from "./components/AssetDetailDrawer";

// Submodules
import { InvestmentDashboardView } from "./submodules/InvestmentDashboardView";
import { PortfolioOverviewView } from "./submodules/PortfolioOverviewView";
import { HoldingsView } from "./submodules/HoldingsView";
import { PerformanceView } from "./submodules/PerformanceView";
import { AllocationView } from "./submodules/AllocationView";
import { GoalsView } from "./submodules/GoalsView";
import { IncomeView } from "./submodules/IncomeView";
import { CorporateActionsView } from "./submodules/CorporateActionsView";
import { TransactionsView } from "./submodules/TransactionsView";
import { ImportWizardView } from "./submodules/ImportWizardView";
import { ReportsView } from "./submodules/ReportsView";
import { WatchlistView } from "./submodules/WatchlistView";
import { SettingsView } from "./submodules/SettingsView";

export const InvestmentsView: React.FC = () => {
  const { activeSubTab, showToast } = useUIStore();
  const queryClient = useQueryClient();

  // Modals & Drawers state
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [selectedSecurityId, setSelectedSecurityId] = useState<string | null>(null);

  const subTab = activeSubTab || "dashboard";

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["investments"] });
    showToast("Investment queries & projections refreshed", "success");
  };

  const renderSubmodule = () => {
    switch (subTab) {
      case "dashboard":
        return <InvestmentDashboardView onSelectAsset={(id) => setSelectedSecurityId(id)} />;
      case "portfolio":
        return <PortfolioOverviewView />;
      case "holdings":
        return <HoldingsView onSelectAsset={(id) => setSelectedSecurityId(id)} />;
      case "performance":
        return <PerformanceView />;
      case "allocation":
        return <AllocationView />;
      case "income":
        return <IncomeView />;
      case "goals":
        return <GoalsView />;
      case "corporate-actions":
        return <CorporateActionsView />;
      case "transactions":
        return <TransactionsView />;
      case "imports":
        return <ImportWizardView />;
      case "reports":
        return <ReportsView />;
      case "watchlist":
        return <WatchlistView />;
      case "settings":
        return <SettingsView />;
      default:
        return <InvestmentDashboardView onSelectAsset={(id) => setSelectedSecurityId(id)} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Submodule Navigation Header */}
      <InvestmentsSubNav
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenReports={() => setIsReportsOpen(true)}
        onOpenTrade={() => setIsTradeOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Render Active Feature Submodule */}
      {renderSubmodule()}

      {/* Global Investment Modals & Drawers */}
      <AddTradeModal isOpen={isTradeOpen} onClose={() => setIsTradeOpen(false)} />
      <SearchAndFilterDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ImportWizardModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ReportsGeneratorModal isOpen={isReportsOpen} onClose={() => setIsReportsOpen(false)} />
      <AssetDetailDrawer securityId={selectedSecurityId} onClose={() => setSelectedSecurityId(null)} />
    </div>
  );
};
