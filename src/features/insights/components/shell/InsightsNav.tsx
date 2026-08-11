import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { INSIGHTS_SECTIONS, InsightsRoute, InsightsSectionId } from "../../insightsNav";

/**
 * Insights navigation, built to the same pattern as Planning and Accounts.
 *
 * The house convention for a module sub-nav is three parts, and this follows
 * all three so the workspace doesn't read as a different application:
 *
 * 1. A compact breadcrumb line above the bar.
 * 2. **Level 1** — an enclosed `bg-slate-950/70` bar with a solid `emerald-400`
 *    pill that slides between tabs via a shared `layoutId`.
 * 3. **Level 2** — translucent `emerald-500/10` pills that scroll horizontally,
 *    with the active one scrolled into view.
 *
 * What this adds on top of the house pattern is keyboard semantics: the level-1
 * bar is a real ARIA tablist with roving focus and arrow-key movement, which
 * the other modules' plain button rows don't provide.
 *
 * `scrollbar-none` is deliberately not used even though the sibling modules
 * reference it — no such utility is defined anywhere in this project, so those
 * bars still show a scrollbar. The two bracket utilities here do the job.
 */
const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface InsightsNavProps {
  route: InsightsRoute;
  onNavigate: (route: InsightsRoute) => void;
}

const Breadcrumbs: React.FC<InsightsNavProps> = ({ route, onNavigate }) => {
  const section = INSIGHTS_SECTIONS.find((s) => s.id === route.section);
  const viewLabel = section?.views.find((v) => v.id === route.view)?.label;

  if (route.section === "overview") {
    return (
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        <span className="font-semibold text-slate-400">Insights</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => onNavigate({ section: "overview", view: null })}
        className="flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
      >
        <Home className="h-3 w-3" aria-hidden="true" />
        <span>Insights</span>
      </button>
      <ChevronRight className="h-3 w-3 shrink-0 text-slate-700" aria-hidden="true" />
      <span className="font-semibold text-slate-300">{section?.label}</span>
      {viewLabel && (
        <>
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-700" aria-hidden="true" />
          <span className="font-semibold text-slate-300">{viewLabel}</span>
        </>
      )}
    </nav>
  );
};

export const InsightsNav: React.FC<InsightsNavProps> = ({ route, onNavigate }) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const secondaryBarRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const pillTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 36 };

  const section = INSIGHTS_SECTIONS.find((s) => s.id === route.section);
  const hasViews = (section?.views.length ?? 0) > 0;

  useEffect(() => {
    const active = secondaryBarRef.current?.querySelector<HTMLElement>("[data-active='true']");
    active?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [route.view, prefersReducedMotion]);

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
    <div className="space-y-0">
      <div className="mb-3">
        <Breadcrumbs route={route} onNavigate={onNavigate} />
      </div>

      {/* Level 1 */}
      <div
        role="tablist"
        aria-label="Insights sections"
        className={`relative flex items-center overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 p-1 backdrop-blur-xl ${HIDE_SCROLLBAR}`}
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
              className={`group relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="insights-primary-pill"
                  className="absolute inset-0 rounded-xl bg-emerald-400"
                  transition={pillTransition}
                />
              )}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl bg-slate-800/0 transition-colors duration-150 group-hover:bg-slate-800/50" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-slate-950" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Level 2 — only for sections that have more than one view. */}
      <AnimatePresence>
        {hasViews && section && (
          <motion.div
            key={section.id}
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 6 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              ref={secondaryBarRef}
              role="tablist"
              aria-label={`${section.label} views`}
              className={`flex items-center gap-0.5 overflow-x-auto px-1 ${HIDE_SCROLLBAR}`}
            >
              {section.views.map((view) => {
                const isActive = view.id === route.view;
                return (
                  <button
                    key={view.id}
                    role="tab"
                    type="button"
                    data-active={isActive}
                    aria-selected={isActive}
                    title={view.hint}
                    onClick={() => onNavigate({ section: section.id, view: view.id })}
                    className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={`insights-secondary-pill-${section.id}`}
                        className="absolute inset-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10"
                        transition={pillTransition}
                      />
                    )}
                    <span className="relative z-10">{view.label}</span>
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
