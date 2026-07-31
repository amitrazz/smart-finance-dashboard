import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useUIStore, NavTab } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useOnboardingProgress } from "../../hooks/useFinanceQueries";
import {
  LayoutDashboard,
  Landmark,
  ArrowUpRight,
  UploadCloud,
  PiggyBank,
  PieChart,
  ShieldAlert,
  Target,
  BarChart3,
  Lightbulb,
  Bell,
  Settings,
  Sparkles,
  CheckCircle2,
  LogOut,
} from "lucide-react";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, completedStepIds } = useUIStore();
  const { user, logout } = useAuthStore();
  const { data: onboardingProgress } = useOnboardingProgress();

  const isComplete = onboardingProgress?.isComplete ?? false;

  const backendCompletedSteps = onboardingProgress?.steps?.filter((s) => s.completed).length ?? 0;
  const backendCount = onboardingProgress?.completedCount ?? backendCompletedSteps;
  const completedCount = isComplete
    ? 10
    : Math.max(backendCount, completedStepIds.length);
  const totalCount = onboardingProgress?.totalCount ?? 10;

  const isCompletedFlow = isComplete || completedCount >= 10;

  const navItems: NavItem[] = useMemo(() => [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    ...(!isCompletedFlow
      ? [
          {
            id: "onboarding" as NavTab,
            label: "Setup Checklist",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            badge: `${completedCount}/${totalCount}`,
          },
        ]
      : []),
    { id: "accounts", label: "Accounts & Cash", icon: <Landmark className="w-5 h-5" /> },
    { id: "transactions", label: "Transactions", icon: <ArrowUpRight className="w-5 h-5" /> },
    { id: "imports", label: "File Import Wizard", icon: <UploadCloud className="w-5 h-5" />, badge: "CSV/PDF" },
    { id: "budgets", label: "Budgets & Spend", icon: <PiggyBank className="w-5 h-5" /> },
    { id: "investments", label: "Investments", icon: <PieChart className="w-5 h-5" /> },
    { id: "loans", label: "Loans & Debt", icon: <ShieldAlert className="w-5 h-5" /> },
    { id: "goals", label: "Financial Goals", icon: <Target className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics & Trends", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "insights", label: "Insights & Health", icon: <Lightbulb className="w-5 h-5" />, badge: "AI" },
    { id: "notifications", label: "Calendar & Alerts", icon: <Bell className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ], [isCompletedFlow, completedCount, totalCount]);

  return (
    <aside className="w-64 bg-slate-900/90 dark:bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 backdrop-blur-xl z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-tight">Monarch OS</h1>
          <p className="text-xs text-emerald-400 font-medium">Personal Finance Platform</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={() => {
                // Preload chunk on hover for smooth instant transition
                switch (item.id) {
                  case "accounts": import("../../features/accounts/AccountsView"); break;
                  case "transactions": import("../../features/transactions/TransactionsView"); break;
                  case "imports": import("../../features/imports/ImportsView"); break;
                  case "budgets": import("../../features/budgets/BudgetsView"); break;
                  case "investments": import("../../features/investments/InvestmentsView"); break;
                  case "loans": import("../../features/loans/LoansView"); break;
                  case "goals": import("../../features/goals/GoalsView"); break;
                  case "analytics": import("../../features/analytics/AnalyticsView"); break;
                  case "insights": import("../../features/insights/InsightsView"); break;
                  case "notifications": import("../../features/notifications/NotificationsView"); break;
                  case "settings": import("../../features/settings/SettingsView"); break;
                }
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 ${
                isActive
                  ? "text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/5 border border-emerald-500/30 shadow-md shadow-emerald-950/40"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <span className={isActive ? "text-emerald-400" : "text-slate-400"} aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  }`}
                  aria-label={`badge: ${item.badge}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0" aria-hidden="true">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || user?.email?.split("@")[0] || "User"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || "Authenticated User"}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          aria-label="Sign out of your account"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
