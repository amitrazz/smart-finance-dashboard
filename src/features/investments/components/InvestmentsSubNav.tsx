import React, { useState } from "react";
import { useUIStore } from "../../../store/useUIStore";
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  FileText,
  Search,
  UploadCloud,
  Plus,
  RefreshCw,
  Menu,
} from "lucide-react";
import { InvestmentsBreadcrumb } from "./InvestmentsBreadcrumb";
import { InvestmentsMobileNavDrawer, NavCategoryConfig } from "./InvestmentsMobileNavDrawer";

interface InvestmentsSubNavProps {
  onOpenSearch: () => void;
  onOpenImport: () => void;
  onOpenReports: () => void;
  onOpenTrade: () => void;
  onRefresh?: () => void;
}

export const NAVIGATION_CATEGORIES: NavCategoryConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    defaultSubTab: "dashboard",
    icon: LayoutDashboard,
    subTabs: [{ id: "dashboard", label: "Executive Wealth Summary" }],
  },
  {
    id: "portfolio",
    label: "Portfolio & Holdings",
    defaultSubTab: "portfolio",
    icon: PieChart,
    subTabs: [
      { id: "portfolio", label: "Overview & Cash" },
      { id: "holdings", label: "Holdings & FIFO Lots" },
      { id: "watchlist", label: "Target Watchlist" },
    ],
  },
  {
    id: "insights",
    label: "Performance & Insights",
    defaultSubTab: "performance",
    icon: TrendingUp,
    subTabs: [
      { id: "performance", label: "CAGR, XIRR & Analytics" },
      { id: "allocation", label: "Asset & Sector Allocation" },
    ],
  },
  {
    id: "activity",
    label: "Activity & Income",
    defaultSubTab: "transactions",
    icon: Activity,
    subTabs: [
      { id: "transactions", label: "Trade Log & Transactions" },
      { id: "income", label: "Passive Income & Dividends" },
      { id: "corporate-actions", label: "Corporate Actions Timeline" },
    ],
  },
  {
    id: "goals",
    label: "Goal Mapping",
    defaultSubTab: "goals",
    icon: Target,
    subTabs: [{ id: "goals", label: "Goal Progress & Funding Gaps" }],
  },
  {
    id: "tools",
    label: "Tools & Reports",
    defaultSubTab: "imports",
    icon: FileText,
    subTabs: [
      { id: "imports", label: "Statement Import Wizard" },
      { id: "reports", label: "Tax & Capital Gains Reports" },
      { id: "settings", label: "Preferences & Guardrails" },
    ],
  },
];

export const InvestmentsSubNav: React.FC<InvestmentsSubNavProps> = ({
  onOpenSearch,
  onOpenImport,
  onOpenReports,
  onOpenTrade,
  onRefresh,
}) => {
  const { activeSubTab, setActiveSubTab } = useUIStore();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const currentSubTab = activeSubTab || "dashboard";

  // Active Category finding
  const activeCategory =
    NAVIGATION_CATEGORIES.find((cat) => cat.subTabs.some((s) => s.id === currentSubTab)) ||
    NAVIGATION_CATEGORIES[0];

  const activeSubTabItem = activeCategory.subTabs.find((s) => s.id === currentSubTab);

  return (
    <div className="space-y-4">
      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Investments & Wealth Hub</h2>
          <p className="text-xs text-slate-400">
            Hierarchical domain navigation across portfolio positions, tax lots, performance & income
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Menu Drawer Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
          >
            <Menu className="w-4 h-4 text-indigo-400" />
            <span>Navigation Menu</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Search Assets & Goals</span>
          </button>

          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Import Statement</span>
          </button>

          <button
            onClick={onOpenReports}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Tax Reports</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenTrade}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Trade</span>
          </button>
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
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-indigo-400"}`} />
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
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md"
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
      <InvestmentsBreadcrumb
        categoryLabel={activeCategory.label}
        subTabLabel={activeSubTabItem?.label}
        onSearchClick={onOpenSearch}
      />

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
