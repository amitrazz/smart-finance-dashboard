import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { INSIGHTS_SECTIONS, InsightsRoute, InsightsSectionId } from "../../insightsNav";

const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface InsightsNavProps {
  route: InsightsRoute;
  onNavigate: (route: InsightsRoute) => void;
}

/**
 * The workspace's *only* navigation.
 *
 * What was here before: a breadcrumb line, a five-tab primary bar with a solid
 * emerald pill, and a second row of up to nine scrolling pills — three
 * navigation layers above the fold, on top of the app navbar's own breadcrumb,
 * which already renders the same trail. Reaching a figure meant reading four
 * rows of chrome first.
 *
 * Now: one bar. The breadcrumb is gone because the navbar owns it. The second
 * row is gone because "which analytics domain am I looking at" is a property of
 * the Analytics page, not a peer of the five sections — it lives in that page's
 * own selector, where it reads as a choice about content rather than as another
 * place to be.
 *
 * The selected state is a quiet slate fill rather than a bright accent pill.
 * Section colour is not financial meaning, and the accent was the loudest thing
 * on a page whose loudest thing should be a number.
 *
 * Keyboard semantics are preserved from the previous bar: a real ARIA tablist
 * with roving focus and arrow-key movement.
 */
export const InsightsNav: React.FC<InsightsNavProps> = ({ route, onNavigate }) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const pillTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 36 };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = INSIGHTS_SECTIONS.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;

    e.preventDefault();
    tabsRef.current[next]?.focus();
    onNavigate({ section: INSIGHTS_SECTIONS[next].id as InsightsSectionId, view: null });
  };

  return (
    <div
      role="tablist"
      aria-label="Insights sections"
      className={`flex items-center gap-0.5 overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/40 p-0.5 ${HIDE_SCROLLBAR}`}
    >
      {INSIGHTS_SECTIONS.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = tab.id === route.section;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onNavigate({ section: tab.id, view: null })}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`group relative flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
              isActive ? "text-slate-50" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="insights-section-pill"
                className="absolute inset-0 rounded-md border border-slate-700/60 bg-slate-800"
                transition={pillTransition}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon
                className={`h-3.5 w-3.5 ${isActive ? "text-slate-300" : "text-slate-600"}`}
                aria-hidden="true"
              />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
