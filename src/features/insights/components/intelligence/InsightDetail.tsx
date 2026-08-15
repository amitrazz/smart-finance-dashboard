import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, CheckCircle2, Clock, EyeOff } from "lucide-react";
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
  onComplete?: (id: string, version: number) => void;
  onDismiss?: (id: string, version: number) => void;
  onSnooze?: (id: string, version: number, snoozedUntil: string) => void;
}

export const InsightDetail: React.FC<InsightDetailProps> = ({
  item,
  onClose,
  onComplete,
  onDismiss,
  onSnooze,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);
  const prefersReducedMotion = useReducedMotion();

  const isOpen = item !== null;
  const [showSnoozePresets, setShowSnoozePresets] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!item) return null;

  const badge = itemBadge(item);
  const due = formatDueIn(item.dueInDays);
  const destination = resolveActionRoute(item.deepLink);

  const isActionable = item.actionable !== false;
  const isDismissible = item.dismissible !== false;
  const version = item.version ?? 1;

  const handleSnooze = (days: number) => {
    if (onSnooze && item.version !== undefined) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      onSnooze(item.id, item.version, date.toISOString());
    }
    setShowSnoozePresets(false);
  };

  const backdropTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.2 };
  const drawerTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring", damping: 30, stiffness: 300 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950"
          />

          {/* Drawer container */}
          <motion.div
            ref={dialogRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={drawerTransition}
            className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CHIP[badge.tone]}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                {due && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${
                      (item.dueInDays ?? 1) <= 0 ? "text-rose-400" : "text-amber-400"
                    }`}
                  >
                    {due}
                  </span>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            {/* Scrollable findings case */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <h2 className="text-lg font-bold leading-tight text-slate-50">
                {item.title}
              </h2>

              <section className="space-y-3">
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

              {item.scoreImpact !== null && item.scoreImpact !== 0 && (
                <p className="text-xs text-slate-500">
                  The health engine attributes{" "}
                  <span className="font-semibold tabular-nums text-slate-350">
                    {item.scoreImpact > 0 ? "+" : ""}
                    {item.scoreImpact} points
                  </span>{" "}
                  of score movement to this.
                </p>
              )}
            </div>

            {/* Combined Footer */}
            <footer className="sticky bottom-0 border-t border-slate-800 bg-slate-950 px-5 py-4 space-y-3">
              {destination && (
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
              )}

              {(isActionable || onSnooze || isDismissible) && (
                <div className="flex flex-wrap items-center gap-2">
                  {isActionable && onComplete && (
                    <button
                      type="button"
                      onClick={() => {
                        onComplete(item.id, version);
                        onClose();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Complete</span>
                    </button>
                  )}

                  {onSnooze && (
                    <div className="relative flex-1">
                      {showSnoozePresets && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 inline-flex items-center justify-around gap-1 rounded-lg bg-slate-900 border border-slate-800 p-1 text-[10px] shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              handleSnooze(1);
                              onClose();
                            }}
                            className="px-2 py-1 rounded bg-slate-950 text-slate-350 hover:bg-slate-800 font-bold cursor-pointer"
                          >
                            1d
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSnooze(3);
                              onClose();
                            }}
                            className="px-2 py-1 rounded bg-slate-950 text-slate-350 hover:bg-slate-800 font-bold cursor-pointer"
                          >
                            3d
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSnooze(7);
                              onClose();
                            }}
                            className="px-2 py-1 rounded bg-slate-950 text-slate-350 hover:bg-slate-800 font-bold cursor-pointer"
                          >
                            7d
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSnoozePresets(false)}
                            className="px-1.5 py-1 rounded text-rose-400 hover:bg-rose-500/10 font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSnoozePresets(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Snooze</span>
                      </button>
                    </div>
                  )}

                  {isDismissible && onDismiss && (
                    <button
                      type="button"
                      onClick={() => {
                        onDismiss(item.id, version);
                        onClose();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              )}
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
