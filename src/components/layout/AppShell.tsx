import React, { useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Toast } from "../common/Toast";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { CommandPaletteModal } from "../../features/search/CommandPaletteModal";
import { useUIStore, VALID_TABS, NavTab } from "../../store/useUIStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useOnboardingProgress } from "../../hooks/useFinanceQueries";

import { AuthView } from "../../features/auth/AuthView";
import { OnboardingView } from "../../features/onboarding/OnboardingView";
import { DashboardView } from "../../features/dashboard/DashboardView";

// Lazy-loaded routes for optimal bundle code-splitting
const AccountsView = lazy(() => import("../../features/accounts/AccountsView").then(m => ({ default: m.AccountsView })));
const TransactionsView = lazy(() => import("../../features/transactions/TransactionsView").then(m => ({ default: m.TransactionsView })));
const ImportsView = lazy(() => import("../../features/imports/ImportsView").then(m => ({ default: m.ImportsView })));
const BudgetsView = lazy(() => import("../../features/budgets/BudgetsView").then(m => ({ default: m.BudgetsView })));
const InvestmentsView = lazy(() => import("../../features/investments/InvestmentsView").then(m => ({ default: m.InvestmentsView })));
const LoansView = lazy(() => import("../../features/loans/LoansView").then(m => ({ default: m.LoansView })));
const GoalsView = lazy(() => import("../../features/goals/GoalsView").then(m => ({ default: m.GoalsView })));
const AnalyticsView = lazy(() => import("../../features/analytics/AnalyticsView").then(m => ({ default: m.AnalyticsView })));
const InsightsView = lazy(() => import("../../features/insights/InsightsView").then(m => ({ default: m.InsightsView })));
const NotificationsView = lazy(() => import("../../features/notifications/NotificationsView").then(m => ({ default: m.NotificationsView })));
const SettingsView = lazy(() => import("../../features/settings/SettingsView").then(m => ({ default: m.SettingsView })));

const TabFallbackSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="h-8 bg-slate-800/80 rounded-xl w-1/3" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
      <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
      <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
    </div>
    <div className="h-80 bg-slate-900/60 rounded-3xl border border-slate-800" />
  </div>
);

export const AppShell: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const { theme } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const { data: onboardingProgress } = useOnboardingProgress();

  // Listen to Network Online / Offline status changes
  useEffect(() => {
    const handleOnline = () => {
      useUIStore.getState().showToast("Internet connection restored", "success");
    };
    const handleOffline = () => {
      useUIStore.getState().showToast("You are offline. Network requests may fail.", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Listen to Browser Back / Forward & URL Hash navigation changes
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash && VALID_TABS.includes(hash as NavTab)) {
        useUIStore.setState({ activeTab: hash as NavTab });
      }
    };

    window.addEventListener("hashchange", handlePopState);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("hashchange", handlePopState);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Theme Sync to HTML Root & Body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Auto-navigate newly registered/un-onboarded users to Setup Checklist on initial session load if no hash set
  useEffect(() => {
    const hasHash = Boolean(window.location.hash.replace(/^#\/?/, ""));
    if (!hasHash && isAuthenticated && onboardingProgress && !onboardingProgress.isComplete && onboardingProgress.completedCount === 0) {
      const hasPrompted = sessionStorage.getItem("pf_prompted_onboarding");
      if (!hasPrompted) {
        sessionStorage.setItem("pf_prompted_onboarding", "true");
        setActiveTab("onboarding");
      }
    }
  }, [isAuthenticated, onboardingProgress, setActiveTab]);

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
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <ErrorBoundary key={activeTab}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.995 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-8"
              >
                <Suspense fallback={<TabFallbackSkeleton />}>
                  {renderActiveTab()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <CommandPaletteModal />
      <Toast />
    </div>
  );
};
