import React, { useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useQueryClient } from "@tanstack/react-query";
import { useRefreshHoldingPrices } from "../../hooks/useFinanceQueries";
import { InvestmentsSubNav } from "./components/InvestmentsSubNav";
import { AddTradeModal } from "./components/AddTradeModal";
import { AssetDetailDrawer } from "./components/AssetDetailDrawer";
import { Holding } from "../../types";

// Submodules
import { InvestmentDashboardView } from "./submodules/InvestmentDashboardView";
import { PortfolioOverviewView } from "./submodules/PortfolioOverviewView";
import { HoldingsView } from "./submodules/HoldingsView";
import { PerformanceView } from "./submodules/PerformanceView";
import { AllocationView } from "./submodules/AllocationView";
import { GoalsView } from "./submodules/GoalsView";
import { TransactionsView } from "./submodules/TransactionsView";
import { ImportView } from "./submodules/ImportView";
import { RealizedGainsView } from "./submodules/RealizedGainsView";

export const InvestmentsView: React.FC = () => {
  const { activeSubTab } = useUIStore();
  const queryClient = useQueryClient();
  const refreshPrices = useRefreshHoldingPrices();

  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  const subTab = activeSubTab || "dashboard";

  // Fetches fresh market prices (Yahoo Finance) for every held asset via
  // useRefreshHoldingPrices — which already invalidates holdings/portfolios/
  // investmentReturns/assetAllocation/netWorth and shows a toast reflecting
  // the real outcome. Goals/health score depend on the resulting corpus
  // value too, so they're invalidated alongside, once the refresh settles.
  const handleRefresh = () => {
    refreshPrices.mutate(undefined, {
      onSettled: () => {
        ["goals", "healthScore"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      },
    });
  };

  const renderSubmodule = () => {
    switch (subTab) {
      case "dashboard":
        return <InvestmentDashboardView onSelectAsset={setSelectedHolding} />;
      case "portfolio":
        return <PortfolioOverviewView />;
      case "holdings":
        return <HoldingsView onSelectAsset={setSelectedHolding} />;
      case "performance":
        return <PerformanceView />;
      case "allocation":
        return <AllocationView />;
      case "goals":
        return <GoalsView />;
      case "transactions":
        return <TransactionsView />;
      case "realized-gains":
        return <RealizedGainsView />;
      case "imports":
        return <ImportView />;
      default:
        return <InvestmentDashboardView onSelectAsset={setSelectedHolding} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Submodule Navigation Header */}
      <InvestmentsSubNav
        onOpenTrade={() => setIsTradeOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={refreshPrices.isPending}
      />

      {/* Render Active Feature Submodule */}
      {renderSubmodule()}

      {/* Global Investment Modals & Drawers */}
      <AddTradeModal isOpen={isTradeOpen} onClose={() => setIsTradeOpen(false)} />
      <AssetDetailDrawer holding={selectedHolding} onClose={() => setSelectedHolding(null)} />
    </div>
  );
};
