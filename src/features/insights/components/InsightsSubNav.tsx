import React, { useState } from "react";
import { useUIStore } from "../../../store/useUIStore";
import {
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  BrainCircuit,
  FileText,
  Menu,
} from "lucide-react";
import { InsightsBreadcrumbs } from "./InsightsBreadcrumbs";
import { InsightsAnalyticsToolbar } from "./InsightsAnalyticsToolbar";
import { InsightsMobileNavDrawer, InsightsSectionConfig } from "./InsightsMobileNavDrawer";
import { NAV_TAB_L2 } from "../../../styles/navTabTokens";

const INSIGHTS_SECTIONS: InsightsSectionConfig[] = [
  {
    id: "overview",
    label: "Overview",
    defaultSubTab: "overview",
    icon: LayoutDashboard,
    subTabs: [{ id: "overview", label: "Executive Command Center" }],
  },
  {
    id: "financial",
    label: "Financial",
    defaultSubTab: "financial-health",
    icon: ShieldCheck,
    subTabs: [
      { id: "financial-health", label: "Financial Health Score" },
      { id: "net-worth", label: "Net Worth Growth" },
      { id: "cash-flow", label: "Cash Flow Analytics" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    defaultSubTab: "spending",
    icon: BarChart3,
    subTabs: [
      { id: "spending", label: "Spending Intelligence" },
      { id: "income", label: "Income Analytics" },
      { id: "budgets", label: "Budget Health" },
      { id: "goals", label: "Goal Progress" },
      { id: "investments", label: "Investment Analytics" },
      { id: "debts", label: "Debt & EMI Analytics" },
      { id: "subscriptions", label: "Subscription Audit" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    defaultSubTab: "trends",
    icon: BrainCircuit,
    subTabs: [
      { id: "trends", label: "Multi-Period Trends" },
      { id: "forecasts", label: "Predictive Forecasts" },
      { id: "recommendations", label: "Recommendations Inbox" },
      { id: "risks", label: "Risk Matrix & Warnings" },
      { id: "ask", label: "Ask Your Finances" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    defaultSubTab: "reports",
    icon: FileText,
    subTabs: [{ id: "reports", label: "Financial Reports & PDF Export" }],
  },
];

interface InsightsSubNavProps {
  onExportPdf?: () => void;
  onRefresh?: () => void;
}

export const InsightsSubNav: React.FC<InsightsSubNavProps> = ({
  onExportPdf,
  onRefresh,
}) => {
  const { activeSubTab, setActiveSubTab } = useUIStore();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const currentSubTab = activeSubTab || "overview";

  // Active Section finding
  const activeSection =
    INSIGHTS_SECTIONS.find((sec) => sec.subTabs.some((s) => s.id === currentSubTab)) ||
    INSIGHTS_SECTIONS[0];

  const activeSubTabItem = activeSection.subTabs.find((s) => s.id === currentSubTab);

  return (
    <div className="space-y-4">
      {/* Header Title & Mobile Drawer Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Financial Intelligence Workspace</h2>
          <p className="text-xs text-slate-400">
            Multi-level analytics platform for health diagnostic, cash flow run-rates, forecasts & risk matrices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Menu Drawer Trigger */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
          >
            <Menu className="w-4 h-4 text-indigo-400" />
            <span>Analytics Navigation Menu</span>
          </button>
        </div>
      </div>

      {/* Level 1: Primary Segmented Navigation */}
      <div className="hidden md:grid grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl">
        {INSIGHTS_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = sec.id === activeSection.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSubTab(sec.defaultSubTab)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-nav-tab-l1-bg text-nav-tab-l1-fg shadow-lg shadow-nav-tab-l1-shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-nav-tab-l1-fg" : "text-slate-500"}`} />
              <span className="truncate">{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Level 2: Contextual Secondary Navigation (Pills) */}
      {activeSection.subTabs.length > 1 && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            {activeSection.label} Views:
          </span>
          {activeSection.subTabs.map((sub) => {
            const isSubActive = currentSubTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
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

      {/* Breadcrumb Trail */}
      <InsightsBreadcrumbs
        sectionLabel={activeSection.label}
        subTabLabel={activeSubTabItem?.label}
      />

      {/* Persistent Global Analytics Toolbar */}
      <InsightsAnalyticsToolbar
        onExportPdf={onExportPdf}
        onRefresh={onRefresh}
      />

      {/* Mobile Drawer Component */}
      <InsightsMobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        sections={INSIGHTS_SECTIONS}
        currentSubTab={currentSubTab}
      />
    </div>
  );
};
