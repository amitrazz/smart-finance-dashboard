/**
 * PlanningNavigation — Two-level navigation for the unified Planning module.
 * Level 1: Overview | Goals | Budgets | Insights | Reports
 * Level 2: Contextual sub-tabs per active section
 *
 * Pattern mirrors src/features/accounts/components/AccountsNavigation.tsx.
 */
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import {
  PLANNING_TABS,
  getPrimaryTab,
} from "./PlanningNavigation.constants";
import type {
  PlanningSection,
  SecondaryTab,
  PrimaryTab,
} from "./PlanningNavigation.constants";

export type { PlanningSection, SecondaryTab, PrimaryTab };

interface PlanningNavigationProps {
  activeSection: PlanningSection;
  activeSubsection: string | null;
  onNavigate: (section: PlanningSection, subsection?: string | null) => void;
  isDetail?: boolean;
  detailLabel?: string;
}

const Breadcrumbs: React.FC<{
  activeSection: PlanningSection;
  activeSubsection: string | null;
  isDetail?: boolean;
  detailLabel?: string;
  onNavigateHome: () => void;
  onNavigateSection: () => void;
}> = ({ activeSection, activeSubsection, isDetail, detailLabel, onNavigateHome, onNavigateSection }) => {
  const primary = getPrimaryTab(activeSection);
  const subLabel = primary.secondaryTabs?.find((t) => t.id === activeSubsection)?.label;

  if (activeSection === "overview") {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="text-slate-400 font-semibold">Planning</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium">
      <button onClick={onNavigateHome} className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
        <Home className="w-3 h-3" />
        <span>Planning</span>
      </button>
      <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
      {isDetail ? (
        <button onClick={onNavigateSection} className="text-slate-500 hover:text-slate-300 transition-colors">
          {primary.label}
        </button>
      ) : (
        <span className="text-slate-300 font-semibold">{primary.label}</span>
      )}
      {isDetail && detailLabel && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className="text-slate-300 font-semibold truncate max-w-[200px]">{detailLabel}</span>
        </>
      )}
      {!isDetail && subLabel && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className="text-slate-300 font-semibold">{subLabel}</span>
        </>
      )}
    </nav>
  );
};

export const PlanningNavigation: React.FC<PlanningNavigationProps> = ({
  activeSection,
  activeSubsection,
  onNavigate,
  isDetail,
  detailLabel,
}) => {
  const activePrimary = getPrimaryTab(activeSection);
  const hasSecondary = (activePrimary.secondaryTabs?.length ?? 0) > 0;
  const secondaryBarRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const pillTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 36 };

  useEffect(() => {
    const activeEl = secondaryBarRef.current?.querySelector("[data-active='true']") as HTMLElement | null;
    if (activeEl) activeEl.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [activeSubsection, prefersReducedMotion]);

  return (
    <div className="space-y-0">
      <div className="mb-3">
        <Breadcrumbs
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          isDetail={isDetail}
          detailLabel={detailLabel}
          onNavigateHome={() => onNavigate("overview")}
          onNavigateSection={() => onNavigate(activeSection, activePrimary.defaultSub)}
        />
      </div>

      <div className="relative flex items-center bg-slate-950/70 border border-slate-800/80 rounded-2xl p-1 backdrop-blur-xl overflow-x-auto scrollbar-none">
        {PLANNING_TABS.map((tab) => {
          const isActive = tab.id === activeSection;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id, tab.defaultSub)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group whitespace-nowrap ${
                isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="planning-primary-pill"
                  className="absolute inset-0 rounded-xl bg-emerald-400"
                  transition={pillTransition}
                />
              )}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl bg-slate-800/0 group-hover:bg-slate-800/50 transition-colors duration-150" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className={isActive ? "text-slate-950" : "text-slate-500 group-hover:text-slate-300"}>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {hasSecondary && !isDetail && (
          <motion.div
            key={activeSection}
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              ref={secondaryBarRef}
              className="flex items-center gap-0.5 overflow-x-auto scrollbar-none px-1"
              role="tablist"
              aria-label="Planning sub-navigation"
            >
              {activePrimary.secondaryTabs!.map((tab) => {
                const isActive = tab.id === activeSubsection;
                return (
                  <button
                    key={tab.id}
                    data-active={isActive}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onNavigate(activeSection, tab.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all duration-150 shrink-0 ${
                      isActive ? "text-emerald-400 bg-emerald-500/8" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={`planning-secondary-pill-${activeSection}`}
                        className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        transition={pillTransition}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
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

export default PlanningNavigation;
