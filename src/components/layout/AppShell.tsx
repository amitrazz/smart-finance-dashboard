import React, { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Toast } from "../common/Toast";
import { CommandPaletteModal } from "../../features/search/CommandPaletteModal";
import { useUIStore } from "../../store/useUIStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useAuthStore } from "../../store/useAuthStore";

import { AuthView } from "../../features/auth/AuthView";
import { OnboardingView } from "../../features/onboarding/OnboardingView";
import { DashboardView } from "../../features/dashboard/DashboardView";
import { AccountsView } from "../../features/accounts/AccountsView";
import { TransactionsView } from "../../features/transactions/TransactionsView";
import { ImportsView } from "../../features/imports/ImportsView";
import { BudgetsView } from "../../features/budgets/BudgetsView";
import { InvestmentsView } from "../../features/investments/InvestmentsView";
import { LoansView } from "../../features/loans/LoansView";
import { GoalsView } from "../../features/goals/GoalsView";
import { AnalyticsView } from "../../features/analytics/AnalyticsView";
import { InsightsView } from "../../features/insights/InsightsView";
import { NotificationsView } from "../../features/notifications/NotificationsView";
import { SettingsView } from "../../features/settings/SettingsView";

export const AppShell: React.FC = () => {
  const { activeTab } = useUIStore();
  const { theme } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();

  // Theme Sync to HTML Root & Body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "onboarding":
        return <OnboardingView />;
      case "accounts":
        return <AccountsView />;
      case "transactions":
        return <TransactionsView />;
      case "imports":
        return <ImportsView />;
      case "budgets":
        return <BudgetsView />;
      case "investments":
        return <InvestmentsView />;
      case "loans":
        return <LoansView />;
      case "goals":
        return <GoalsView />;
      case "analytics":
        return <AnalyticsView />;
      case "insights":
        return <InsightsView />;
      case "notifications":
        return <NotificationsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-200 flex ${
        theme === "dark" ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-900"
      }`}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <CommandPaletteModal />
      <Toast />
    </div>
  );
};
