import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { IntelligenceItem } from "../../api/intelligenceModel";
import { Money } from "../../../../components/common/Money";
import { Button } from "../../../../components/ui/Button";
import { useUIStore } from "../../../../store/useUIStore";
import { resolveActionRoute } from "../../utils/actionRoutes";
import { formatDueIn } from "../../utils/insightsFormat";
import { TONE_CHIP } from "../primitives/tone";
import { MaskedProse } from "../primitives/MaskedProse";
import { EvidencePanel, EvidenceSource } from "./EvidencePanel";
import { itemBadge } from "./itemPresentation";

interface InsightDetailProps {
  item: IntelligenceItem | null;
  onClose: () => void;
}

/**
 * The full case for one finding, in the order a sceptical reader needs it.
 *
 * ## Provenance is the structure
 *
 * The sections are not a layout choice; they are a claim about where each
 * sentence came from, and the headings say so:
 *
 * - **What was observed** — the rule's deterministic comparison, plus the
 *   measured figures it fired on. Sourced from a snapshot, the ledger or the
 *   health engine. Never generated.
 * - **What this means** — the rule's own reading. Still deterministic, still the
 *   backend's, but a step removed from measurement.
 * - **Suggested action** — what the backend proposes. Rendered only when it
 *   proposed something; the panel never writes advice of its own.
 *
 * Nothing on this screen is model-generated. The one place Insights shows
 * generated text is Ask, which labels it there. Keeping these headings honest is
 * what makes that label mean something.
 */
export const InsightDetail: React.FC<InsightDetailProps> = ({ item, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);
  const prefersReducedMotion = useReducedMotion();

  const isOpen = item !== null;

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Same trap idiom as the app's ConfirmModal, so keyboard behaviour is
      // identical wherever a dialog opens.
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const badge = item ? itemBadge(item) : null;
  const destination = item
    ? resolveActionRoute({
        deepLink: item.deepLink,
        component: item.component,
        category: item.category,
      })
    : null;
  const due = item ? formatDueIn(item.dueInDays) : null;

  return (
    <AnimatePresence>
      {isOpen && item && badge && (
        <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
          <motion.div
            className="absolute inset-0 bg-slate-950/70"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            initial={prefersReducedMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={prefersReducedMotion ? undefined : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-slate-800 bg-slate-900 shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900 px-5 py-4">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CHIP[badge.tone]}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-slate-500">{item.category}</span>
                  {due && (
                    <span
                      className={`text-[11px] font-medium ${
                        (item.dueInDays ?? 1) <= 0 ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      {due}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-semibold leading-snug text-slate-50">{item.title}</h2>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close detail"
                className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 space-y-6 px-5 py-5">
              {(item.financialImpact || item.confidencePercent !== null || item.affectedEntity) && (
                <dl className="grid grid-cols-2 gap-4">
                  {item.financialImpact && (
                    <div>
                      <dt className="text-[11px] text-slate-500">Amount involved</dt>
                      <dd className="text-lg font-semibold tabular-nums text-slate-100">
                        <Money value={item.financialImpact} fractionDigits={0} />
                      </dd>
                    </div>
                  )}
                  {item.affectedEntity && (
                    <div className="min-w-0">
                      <dt className="text-[11px] text-slate-500">Affects</dt>
                      <dd className="truncate text-sm text-slate-200">{item.affectedEntity}</dd>
                    </div>
                  )}
                  {item.confidencePercent !== null && (
                    <div>
                      <dt className="text-[11px] text-slate-500">Detection confidence</dt>
                      <dd className="text-sm tabular-nums text-slate-200">
                        {Math.round(item.confidencePercent)}%
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  What was observed
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  <MaskedProse text={item.observed} />
                </p>
                <EvidencePanel evidence={item.evidence} className="pt-1" />
                <EvidenceSource evidence={item.evidence} />
              </section>

              {item.interpretation && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    What this means
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    <MaskedProse text={item.interpretation} />
                  </p>
                </section>
              )}

              {item.suggestedAction && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Suggested action
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    <MaskedProse text={item.suggestedAction} />
                  </p>
                </section>
              )}

              {item.scoreImpact !== null && (
                <p className="text-xs text-slate-500">
                  The health engine attributes{" "}
                  <span className="font-semibold tabular-nums text-slate-300">
                    {item.scoreImpact > 0 ? "+" : ""}
                    {item.scoreImpact} points
                  </span>{" "}
                  of score movement to this.
                </p>
              )}
            </div>

            {destination && (
              <footer className="sticky bottom-0 border-t border-slate-800 bg-slate-900 px-5 py-4">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    navigateToRoute(destination.tab, destination.subTab);
                    onClose();
                  }}
                >
                  {destination.label}
                </Button>
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
