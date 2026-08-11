import React, { useEffect, useRef, useState } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { useInsightsFilters } from "../../hooks/useInsightsFilters";
import {
  INSIGHTS_PERIOD_LABELS,
  INSIGHTS_PERIOD_MONTHS,
  InsightsPeriod,
} from "../../types/insightsTypes";

const PERIODS = Object.keys(INSIGHTS_PERIOD_MONTHS) as InsightsPeriod[];

/**
 * Workspace filters, behind one control.
 *
 * The old toolbar spent a full row on three chips, two of which were
 * permanently disabled because no endpoint accepted them. This is one button
 * showing the active window, opening a popover with the only choice that
 * changes what the backend returns.
 *
 * Selection is global and persisted, so moving between Overview, Analytics and
 * Intelligence keeps the same window rather than resetting per page.
 */
export const InsightsFilters: React.FC = () => {
  const period = useInsightsFilters((s) => s.period);
  const setPeriod = useInsightsFilters((s) => s.setPeriod);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        ref={buttonRef}
        variant="neutral"
        hierarchy="outline"
        size="md"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />}
      >
        <span className="hidden sm:inline">{INSIGHTS_PERIOD_LABELS[period]}</span>
        <span className="sm:hidden">{period}</span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Insights filters"
          className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl backdrop-blur-xl"
        >
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            History window
          </p>
          <div role="radiogroup" aria-label="History window" className="space-y-0.5">
            {PERIODS.map((p) => {
              const selected = p === period;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setPeriod(p);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                    selected
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  {INSIGHTS_PERIOD_LABELS[p]}
                  {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className="mt-2 border-t border-slate-800 px-1 pt-2 text-[11px] leading-relaxed text-slate-500">
            Applies to every chart and comparison in Insights. Account and currency filters aren't
            offered because no analytics endpoint accepts them yet.
          </p>
        </div>
      )}
    </div>
  );
};
