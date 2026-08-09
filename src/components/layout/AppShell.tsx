import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React, { lazy, Suspense, useEffect } from 'react';
import { useOnboardingStatus } from '../../features/onboarding/hooks/useOnboarding';
import { CommandPaletteModal } from '../../features/search/CommandPaletteModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { parseHashRoute, useUIStore } from '../../store/useUIStore';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Toast } from '../common/Toast';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

import { AuthView } from '../../features/auth/AuthView';
import { DashboardView } from '../../features/dashboard/DashboardView';
import { OnboardingView } from '../../features/onboarding/OnboardingView';

// Lazy-loaded routes for optimal bundle code-splitting
const AccountsView = lazy(() =>
  import('../../features/accounts/AccountsView').then((m) => ({ default: m.AccountsView })),
);
const CreditCardsView = lazy(() =>
  import('../../features/credit-cards/CreditCardsView').then((m) => ({
    default: m.CreditCardsView,
  })),
);
const TransactionsView = lazy(() =>
  import('../../features/transactions/TransactionsView').then((m) => ({
    default: m.TransactionsView,
  })),
);
const ImportsView = lazy(() =>
  import('../../features/imports/ImportsView').then((m) => ({ default: m.ImportsView })),
);
const PlanningView = lazy(() =>
  import('../../features/planning/PlanningView').then((m) => ({ default: m.PlanningView })),
);
const InvestmentsView = lazy(() =>
  import('../../features/investments/InvestmentsView').then((m) => ({
    default: m.InvestmentsView,
  })),
);
const LoansView = lazy(() =>
  import('../../features/loans/LoansView').then((m) => ({ default: m.LoansView })),
);
const AnalyticsView = lazy(() =>
  import('../../features/analytics/AnalyticsView').then((m) => ({ default: m.AnalyticsView })),
);
const InsightsView = lazy(() =>
  import('../../features/insights/InsightsView').then((m) => ({ default: m.InsightsView })),
);
const NotificationsView = lazy(() =>
  import('../../features/notifications/NotificationsView').then((m) => ({
    default: m.NotificationsView,
  })),
);
const SettingsView = lazy(() =>
  import('../../features/settings/SettingsView').then((m) => ({ default: m.SettingsView })),
);

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
  const { activeTab, activeSubTab, setActiveTab } = useUIStore();
  const { theme } = useSettingsStore();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { data: onboardingStatus } = useOnboardingStatus();

  // Listen to Network Online / Offline status changes
  useEffect(() => {
    const handleOnline = () => {
      useUIStore.getState().showToast('Internet connection restored', 'success');
    };
    const handleOffline = () => {
      useUIStore.getState().showToast('You are offline. Network requests may fail.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Browser Back / Forward & URL Hash navigation changes
  useEffect(() => {
    const handlePopState = () => {
      const { tab, subTab } = parseHashRoute();
      useUIStore.setState({ activeTab: tab, activeSubTab: subTab });
    };

    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Dynamic document title update based on activeTab & activeSubTab
  useEffect(() => {
    const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ');
    // activeSubTab may carry extra route segments after the base name (e.g.
    // imports' "staged-preview/<jobId>") — only the base belongs in the title.
    const subTabBase = activeSubTab?.split('/')[0] ?? null;
    const subName = subTabBase
      ? ` > ${subTabBase.charAt(0).toUpperCase() + subTabBase.slice(1).replace('-', ' ')}`
      : '';
    document.title = `Cashflow | ${tabName}${subName}`;
  }, [activeTab, activeSubTab]);

  // Theme Sync to HTML Root & Body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Auto-navigate newly registered/un-onboarded users to Setup Checklist on initial session load if no hash set
  useEffect(() => {
    const hasHash = Boolean(window.location.hash.replace(/^#\/?/, ''));
    if (
      !hasHash &&
      isAuthenticated &&
      onboardingStatus &&
      !onboardingStatus.isCompleted &&
      onboardingStatus.completedCount === 0
    ) {
      const hasPrompted = sessionStorage.getItem('pf_prompted_onboarding');
      if (!hasPrompted) {
        sessionStorage.setItem('pf_prompted_onboarding', 'true');
        setActiveTab('onboarding');
      }
    }
  }, [isAuthenticated, onboardingStatus, setActiveTab]);

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" aria-hidden="true" />
        <span className="sr-only">Checking session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'onboarding':
        return <OnboardingView />;
      case 'accounts':
        return <AccountsView />;
      case 'credit-cards':
        return <CreditCardsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'imports':
        return <ImportsView />;
      case 'planning':
        return <PlanningView />;
      case 'investments':
        return <InvestmentsView />;
      case 'loans':
        return <LoansView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'insights':
        return <InsightsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-200 flex ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-900'
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
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-8"
              >
                <Suspense fallback={<TabFallbackSkeleton />}>{renderActiveTab()}</Suspense>
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
