/**
 * AccountsView — Financial Control Center
 *
 * Two-level navigation architecture:
 *   Level 1: Overview | Accounts | Cash | Operations | Statements  (5 fixed tabs)
 *   Level 2: Contextual sub-tabs per active section
 *
 * Features: deep-link routing, breadcrumbs, persistent secondary tab memory,
 *            lazy-loaded views, AnimatePresence transitions, global toolbar
 */
import React, { useState, lazy, Suspense, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useUIStore } from "../../store/useUIStore";
import { useAccounts } from "../../hooks/useFinanceQueries";
import { Account } from "../../types";

import {
  AccountsNavigation,
  type ActiveRoute,
} from "./components/AccountsNavigation";
import { ROUTE_TO_SECTION } from "./components/AccountsNavigation.constants";
import { AccountsGlobalToolbar } from "./components/AccountsGlobalToolbar";
import { QuickActions } from "./components/QuickActions";
import { AddAccountModal } from "./components/AddAccountModal";
import { NewTransferModal } from "./components/NewTransferModal";
import { AddInstitutionModal } from "../institutions/components/AddInstitutionModal";

// ─── Lazy Sub-Views ──────────────────────────────────────────────────────────

const AccountsOverviewView = lazy(() =>
  import("./views/AccountsOverviewView").then((m) => ({ default: m.AccountsOverviewView }))
);
const CashPositionView = lazy(() =>
  import("./views/CashPositionView").then((m) => ({ default: m.CashPositionView }))
);
const BankAccountsView = lazy(() =>
  import("./views/BankAccountsView").then((m) => ({ default: m.BankAccountsView }))
);
const WalletsView = lazy(() =>
  import("./views/WalletsView").then((m) => ({ default: m.WalletsView }))
);
const CashAccountsView = lazy(() =>
  import("./views/CashAccountsView").then((m) => ({ default: m.CashAccountsView }))
);
const CreditCardsSubView = lazy(() =>
  import("./views/CreditCardsSubView").then((m) => ({ default: m.CreditCardsSubView }))
);
const FixedDepositsView = lazy(() =>
  import("./views/FixedDepositsView").then((m) => ({ default: m.FixedDepositsView }))
);
const InvestmentCashView = lazy(() =>
  import("./views/InvestmentCashView").then((m) => ({ default: m.InvestmentCashView }))
);
const InstitutionsSubView = lazy(() =>
  import("./views/InstitutionsSubView").then((m) => ({ default: m.InstitutionsSubView }))
);
const ReconciliationView = lazy(() =>
  import("./views/ReconciliationView").then((m) => ({ default: m.ReconciliationView }))
);
const TransfersView = lazy(() =>
  import("./views/TransfersView").then((m) => ({ default: m.TransfersView }))
);
const StatementsSubView = lazy(() =>
  import("./views/StatementsSubView").then((m) => ({ default: m.StatementsSubView }))
);
const AccountDetailWorkspaceView = lazy(() =>
  import("./views/AccountDetailWorkspaceView").then((m) => ({
    default: m.AccountDetailWorkspaceView,
  }))
);

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

const SubviewSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array(4)
        .fill(null)
        .map((_, i) => (
          <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
        ))}
    </div>
    <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array(2)
        .fill(null)
        .map((_, i) => (
          <div key={i} className="h-48 bg-slate-900/60 rounded-2xl border border-slate-800" />
        ))}
    </div>
  </div>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize a URL sub-tab string to a known ActiveRoute */
function parseSubTabToRoute(subTab: string | null): ActiveRoute {
  const validRoutes = Object.keys(ROUTE_TO_SECTION) as ActiveRoute[];
  if (subTab && validRoutes.includes(subTab as ActiveRoute)) {
    return subTab as ActiveRoute;
  }
  return "overview";
}

// ─── AccountsView ─────────────────────────────────────────────────────────────

export const AccountsView: React.FC = () => {
  const { activeSubTab, setActiveSubTab, isAddAccountOpen, setAddAccountOpen } = useUIStore();
  const { refetch } = useAccounts();

  /** The currently open Account in the detail workspace */
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);
  const [isAddInstitutionOpen, setAddInstitutionOpen] = useState(false);

  const openTransferModal = useCallback((sourceAccountId?: string) => {
    setTransferSourceAccountId(sourceAccountId);
    setTransferModalOpen(true);
  }, []);

  /**
   * The active route — resolved from:
   * 1. If an account is selected → "details"
   * 2. URL hash sub-tab → matched ActiveRoute
   * 3. Fallback → "overview"
   */
  const activeRoute: ActiveRoute = selectedAccount
    ? "details"
    : parseSubTabToRoute(activeSubTab);

  // Sync route from URL on mount / popstate
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace(/^#\/?accounts\/?/, "");
      setActiveSubTab(hash || null);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [setActiveSubTab]);

  // ── Navigation handlers ──

  const navigate = useCallback(
    (route: ActiveRoute) => {
      setSelectedAccount(null);
      setActiveSubTab(route === "overview" ? null : route);
    },
    [setActiveSubTab]
  );

  const handleSelectAccount = useCallback(
    (account: Account) => {
      setSelectedAccount(account);
    },
    []
  );

  const handleBack = useCallback(() => {
    setSelectedAccount(null);
  }, []);

  // ── Sub-view renderer ──

  const renderSubView = () => {
    switch (activeRoute) {
      case "overview":
        return (
          <AccountsOverviewView
            onNavigate={navigate}
            onSelectAccount={handleSelectAccount}
          />
        );
      case "cash-position":
        return <CashPositionView />;
      case "bank":
        return (
          <BankAccountsView
            onSelectAccount={handleSelectAccount}
            onTransfer={() => navigate("transfers")}
            onStatement={() => navigate("statements-overview")}
          />
        );
      case "wallets":
        return <WalletsView />;
      case "cash-accounts":
        return <CashAccountsView onAddAccount={() => useUIStore.getState().setAddAccountOpen(true)} />;
      case "credit-cards":
        return <CreditCardsSubView />;
      case "fixed-deposits":
        return <FixedDepositsView />;
      case "investments-cash":
        return <InvestmentCashView />;
      case "institutions":
        return <InstitutionsSubView onAddInstitution={() => setAddInstitutionOpen(true)} />;
      case "reconciliation":
        return <ReconciliationView />;
      case "transfers":
        return <TransfersView onNewTransfer={() => openTransferModal()} />;
      // All statements sub-routes render the same StatementsSubView for now
      case "statements-overview":
      case "statements-bank":
      case "statements-card":
      case "statements-imports":
      case "statements-history":
        return <StatementsSubView activeTab={activeRoute} />;
      case "details":
        return selectedAccount ? (
          <AccountDetailWorkspaceView
            account={selectedAccount}
            onBack={handleBack}
            onTransfer={() => navigate("transfers")}
            onStatement={() => navigate("statements-overview")}
          />
        ) : null;
      default:
        return (
          <AccountsOverviewView
            onNavigate={navigate}
            onSelectAccount={handleSelectAccount}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-none">
            Accounts & Cash
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Your financial control center
          </p>
        </div>
        <QuickActions
          onTransfer={() => openTransferModal()}
          onAddAccount={() => useUIStore.getState().setAddAccountOpen(true)}
          onImport={() => {
            useUIStore.getState().setImportModalOpen(true);
            useUIStore.getState().setActiveTab("imports");
          }}
          onReconcile={() => navigate("reconciliation")}
          onRefresh={() => refetch()}
        />
      </div>

      {/* ── Navigation (Primary + Secondary) ── */}
      <AccountsNavigation
        activeRoute={activeRoute}
        onNavigate={navigate}
        detailAccountName={selectedAccount?.name}
      />

      {/* ── Global Toolbar (hidden on detail page) ── */}
      {activeRoute !== "details" && (
        <AccountsGlobalToolbar onRefresh={() => refetch()} />
      )}

      {/* ── Sub-View Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRoute + (selectedAccount?.id ?? "")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <Suspense fallback={<SubviewSkeleton />}>{renderSubView()}</Suspense>
        </motion.div>
      </AnimatePresence>

      <AddAccountModal isOpen={isAddAccountOpen} onClose={() => setAddAccountOpen(false)} />
      <NewTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        defaultFromAccountId={transferSourceAccountId}
      />
      <AddInstitutionModal isOpen={isAddInstitutionOpen} onClose={() => setAddInstitutionOpen(false)} />
    </div>
  );
};
