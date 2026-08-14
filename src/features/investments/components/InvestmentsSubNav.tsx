import React, { useState } from "react";
import { useUIStore } from "../../../store/useUIStore";
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  UploadCloud,
  Plus,
  RefreshCw,
  Menu,
} from "lucide-react";
import { InvestmentsBreadcrumb } from "./InvestmentsBreadcrumb";
import { InvestmentsMobileNavDrawer, NavCategoryConfig } from "./InvestmentsMobileNavDrawer";
import { Button } from "../../../components/ui/Button";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

interface InvestmentsSubNavProps {
  onOpenTrade: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Backend-accurate navigation — every leaf tab maps to a real, live
// finance-service endpoint (see src/hooks/useFinanceQueries.ts). Watchlists,
// corporate actions, dividend/income tracking, and advanced performance
// metrics (Sharpe/Alpha/Beta/CAGR/benchmark) have no backend support and
// were removed rather than kept as dead tabs.
const NAVIGATION_CATEGORIES: NavCategoryConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    defaultSubTab: "dashboard",
    icon: LayoutDashboard,
    subTabs: [{ id: "dashboard", label: "Wealth Summary" }],
  },
  {
    id: "portfolio",
    label: "Portfolio & Holdings",
    defaultSubTab: "portfolio",
    icon: PieChart,
    subTabs: [
      { id: "portfolio", label: "Portfolio Overview" },
      { id: "holdings", label: "Holdings & FIFO Lots" },
    ],
  },
  {
    id: "insights",
    label: "Performance & Allocation",
    defaultSubTab: "performance",
    icon: TrendingUp,
    subTabs: [
      { id: "performance", label: "XIRR & Returns" },
      { id: "allocation", label: "Asset Class Allocation" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    defaultSubTab: "transactions",
    icon: Activity,
    subTabs: [
      { id: "transactions", label: "Trade Log & SIPs" },
      { id: "realized-gains", label: "Realized Gains" },
    ],
  },
  {
    id: "goals",
    label: "Goals",
    defaultSubTab: "goals",
    icon: Target,
    subTabs: [{ id: "goals", label: "Investment-Linked Goals" }],
  },
  {
    id: "imports",
    label: "Import",
    defaultSubTab: "imports",
    icon: UploadCloud,
    subTabs: [{ id: "imports", label: "CAS / MF Statement Import" }],
  },
];

export const InvestmentsSubNav: React.FC<InvestmentsSubNavProps> = ({
  onOpenTrade,
  onRefresh,
  isRefreshing = false,
}) => {
  const { activeSubTab, setActiveSubTab } = useUIStore();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const currentSubTab = activeSubTab || "dashboard";

  const activeCategory =
    NAVIGATION_CATEGORIES.find((cat) => cat.subTabs.some((s) => s.id === currentSubTab)) ||
    NAVIGATION_CATEGORIES[0];

  const activeSubTabItem = activeCategory.subTabs.find((s) => s.id === currentSubTab);

  return (
    <div className="space-y-4">
      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Investments</h2>
          <p className="text-xs text-slate-400">
            Portfolio positions, tax lots, returns & goal-linked holdings — backed entirely by live data
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
            <span>Navigation Menu</span>
          </button>

          {onRefresh && (
            <Button
              variant="neutral"
              hierarchy="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh market prices for all your holdings"
              aria-label="Refresh market prices for all your holdings"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
            </Button>
          )}

          <Button
            variant="primary"
            hierarchy="filled"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onOpenTrade}
          >
            <span>Record Trade</span>
          </Button>
        </div>
      </div>

      {/* Tier 1: Primary Category Tabs */}
      <div className="hidden md:grid grid-cols-6 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl">
        {NAVIGATION_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveSubTab(cat.defaultSubTab)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-nav-tab-l1-bg text-nav-tab-l1-fg shadow-lg shadow-nav-tab-l1-shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-nav-tab-l1-fg" : "text-slate-500"}`} />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tier 2: Contextual Secondary Sub-Nav (Pills) */}
      {activeCategory.subTabs.length > 1 && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            Section Views:
          </span>
          {activeCategory.subTabs.map((sub) => {
            const isSubActive = currentSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSubActive
                    ? `${NAV_TAB_L2}`
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Breadcrumbs Trail */}
      <InvestmentsBreadcrumb categoryLabel={activeCategory.label} subTabLabel={activeSubTabItem?.label} />

      {/* Mobile Drawer Component */}
      <InvestmentsMobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        categories={NAVIGATION_CATEGORIES}
        currentSubTab={currentSubTab}
      />
    </div>
  );
};
