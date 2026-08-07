/**
 * AccountsNavigation - Two-level navigation system for Accounts & Cash module
 *
 * Level 1 (Primary): 5 fixed tabs — Overview | Accounts | Cash | Operations | Statements
 * Level 2 (Secondary): Contextual tabs that appear below the primary when a section is selected
 *
 * Design inspired by: Stripe Dashboard, Mercury, Ramp, Brex, Linear
 */
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Landmark,
  Banknote,
  Settings2,
  FileText,
  ChevronRight,
  Home,
} from "lucide-react";
import { ROUTE_TO_SECTION } from "./AccountsNavigation.constants";

// ─── Route Definitions ────────────────────────────────────────────────────────

export type PrimarySection = "overview" | "accounts" | "cash" | "operations" | "statements";

export type ActiveRoute =
  | "overview"
  // Accounts sub-routes
  | "bank" | "wallets" | "cash-accounts" | "credit-cards" | "fixed-deposits" | "investments-cash"
  // Cash sub-routes
  | "cash-position"
  // Operations sub-routes
  | "transfers" | "reconciliation" | "institutions"
  // Statements sub-routes
  | "statements-overview" | "statements-bank" | "statements-card" | "statements-imports" | "statements-history"
  // Detail
  | "details";

export interface SecondaryTab {
  id: ActiveRoute;
  label: string;
  badge?: string | number;
}

export interface PrimaryTab {
  id: PrimarySection;
  label: string;
  icon: React.ReactNode;
  defaultRoute: ActiveRoute;
  secondaryTabs?: SecondaryTab[];
}

const PRIMARY_TABS: PrimaryTab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-3.5 h-3.5" />,
    defaultRoute: "overview",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: <Landmark className="w-3.5 h-3.5" />,
    defaultRoute: "bank",
    secondaryTabs: [
      { id: "bank", label: "Bank Accounts" },
      { id: "wallets", label: "Wallets" },
      { id: "cash-accounts", label: "Cash" },
      { id: "credit-cards", label: "Credit Cards" },
      { id: "fixed-deposits", label: "Fixed Deposits" },
      { id: "investments-cash", label: "Investment Cash" },
    ],
  },
  {
    id: "cash",
    label: "Cash",
    icon: <Banknote className="w-3.5 h-3.5" />,
    defaultRoute: "cash-position",
    secondaryTabs: [
      { id: "cash-position", label: "Position" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: <Settings2 className="w-3.5 h-3.5" />,
    defaultRoute: "transfers",
    secondaryTabs: [
      { id: "transfers", label: "Transfers" },
      { id: "reconciliation", label: "Reconciliation" },
      { id: "institutions", label: "Institutions" },
    ],
  },
  {
    id: "statements",
    label: "Statements",
    icon: <FileText className="w-3.5 h-3.5" />,
    defaultRoute: "statements-overview",
    secondaryTabs: [
      { id: "statements-overview", label: "Overview" },
      { id: "statements-bank", label: "Bank" },
      { id: "statements-card", label: "Credit Card" },
      { id: "statements-imports", label: "Imports" },
      { id: "statements-history", label: "History" },
    ],
  },
];

// ─── Route Helpers ──────────────────────────────────────────────────────────

function getActivePrimaryTab(route: ActiveRoute): PrimarySection {
  return ROUTE_TO_SECTION[route] ?? "overview";
}

function getPrimaryTab(id: PrimarySection): PrimaryTab {
  return PRIMARY_TABS.find((t) => t.id === id) ?? PRIMARY_TABS[0];
}

// ─── Breadcrumb Labels ───────────────────────────────────────────────────────

const ROUTE_LABELS: Partial<Record<ActiveRoute, string>> = {
  overview: "Overview",
  bank: "Bank Accounts",
  wallets: "Wallets",
  "cash-accounts": "Cash Accounts",
  "credit-cards": "Credit Cards",
  "fixed-deposits": "Fixed Deposits",
  "investments-cash": "Investment Cash",
  "cash-position": "Cash Position",
  transfers: "Transfers",
  reconciliation: "Reconciliation",
  institutions: "Institutions",
  "statements-overview": "Overview",
  "statements-bank": "Bank Statements",
  "statements-card": "Card Statements",
  "statements-imports": "Imports",
  "statements-history": "History",
  details: "Account Details",
};

// ─── Component Props ─────────────────────────────────────────────────────────

interface AccountsNavigationProps {
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute) => void;
  /** Optional badge counts to show on primary tabs */
  badgeCounts?: Partial<Record<PrimarySection, number>>;
  /** Account name shown in breadcrumb when details is active */
  detailAccountName?: string;
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const Breadcrumbs: React.FC<{
  activeRoute: ActiveRoute;
  activeSection: PrimarySection;
  onNavigateHome: () => void;
  onNavigateSection: () => void;
  detailAccountName?: string;
}> = ({ activeRoute, activeSection, onNavigateHome, onNavigateSection, detailAccountName }) => {
  const sectionLabel = PRIMARY_TABS.find((t) => t.id === activeSection)?.label ?? "";
  const routeLabel = detailAccountName ?? ROUTE_LABELS[activeRoute] ?? "";
  const isOverview = activeRoute === "overview";
  const isDetailPage = activeRoute === "details";
  const isSectionDefault = getPrimaryTab(activeSection).defaultRoute === activeRoute;

  if (isOverview) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="text-slate-400 font-semibold">Accounts & Cash</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium">
      <button
        onClick={onNavigateHome}
        className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
      >
        <Home className="w-3 h-3" />
        <span>Accounts & Cash</span>
      </button>

      <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />

      {isDetailPage || !isSectionDefault ? (
        <button onClick={onNavigateSection} className="text-slate-500 hover:text-slate-300 transition-colors">
          {sectionLabel}
        </button>
      ) : (
        <span className="text-slate-300 font-semibold">{sectionLabel}</span>
      )}

      {(isDetailPage || !isSectionDefault) && routeLabel && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className="text-slate-300 font-semibold">{routeLabel}</span>
        </>
      )}
    </nav>
  );
};

// ─── Main Navigation Component ───────────────────────────────────────────────

export const AccountsNavigation: React.FC<AccountsNavigationProps> = ({
  activeRoute,
  onNavigate,
  badgeCounts,
  detailAccountName,
}) => {
  const activeSection = getActivePrimaryTab(activeRoute);
  const activePrimary = getPrimaryTab(activeSection);
  const hasSecondary = (activePrimary.secondaryTabs?.length ?? 0) > 1;
  const secondaryBarRef = useRef<HTMLDivElement>(null);

  // Scroll active secondary tab into view on mobile
  useEffect(() => {
    const activeEl = secondaryBarRef.current?.querySelector("[data-active='true']") as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeRoute]);

  const handlePrimaryClick = (tab: PrimaryTab) => {
    if (tab.id === activeSection && tab.id !== "overview") return; // already active
    onNavigate(tab.defaultRoute);
  };

  const handleSecondaryClick = (route: ActiveRoute) => {
    onNavigate(route);
  };

  return (
    <div className="space-y-0">
      {/* ── Breadcrumbs ── */}
      <div className="mb-3">
        <Breadcrumbs
          activeRoute={activeRoute}
          activeSection={activeSection}
          onNavigateHome={() => onNavigate("overview")}
          onNavigateSection={() => onNavigate(activePrimary.defaultRoute)}
          detailAccountName={detailAccountName}
        />
      </div>

      {/* ── Primary Navigation ── */}
      <div className="relative flex items-center bg-slate-950/70 border border-slate-800/80 rounded-2xl p-1 backdrop-blur-xl">
        {PRIMARY_TABS.map((tab) => {
          const isActive = tab.id === activeSection;
          const badge = badgeCounts?.[tab.id];

          return (
            <button
              key={tab.id}
              id={`accounts-nav-${tab.id}`}
              onClick={() => handlePrimaryClick(tab)}
              aria-current={isActive ? "page" : undefined}
              className={`
                relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                text-xs font-semibold transition-all duration-200 group
                ${isActive
                  ? "text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
                }
              `}
            >
              {/* Active pill background */}
              {isActive && (
                <motion.div
                  layoutId="accounts-primary-pill"
                  className="absolute inset-0 rounded-xl bg-emerald-400"
                  transition={{ type: "spring", stiffness: 380, damping: 36 }}
                />
              )}

              {/* Hover ghost */}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl bg-slate-800/0 group-hover:bg-slate-800/50 transition-colors duration-150" />
              )}

              <span className="relative z-10 flex items-center gap-2">
                <span className={`${isActive ? "text-slate-950" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
                {badge != null && badge > 0 && (
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
                    ${isActive ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-300"}
                  `}>
                    {badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Secondary Navigation ── */}
      <AnimatePresence>
        {hasSecondary && activeRoute !== "details" && (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              ref={secondaryBarRef}
              className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-1"
              role="tablist"
              aria-label="Sub-navigation"
            >
              {activePrimary.secondaryTabs!.map((tab) => {
                const isActive = tab.id === activeRoute;

                return (
                  <button
                    key={tab.id}
                    data-active={isActive}
                    role="tab"
                    aria-selected={isActive}
                    id={`accounts-subnav-${tab.id}`}
                    onClick={() => handleSecondaryClick(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap
                      text-xs font-semibold transition-all duration-150 shrink-0
                      ${isActive
                        ? "text-emerald-400 bg-emerald-500/8"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={`accounts-secondary-pill-${activeSection}`}
                        className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        transition={{ type: "spring", stiffness: 400, damping: 38 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    {tab.badge != null && (
                      <span className={`relative z-10 px-1.5 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
