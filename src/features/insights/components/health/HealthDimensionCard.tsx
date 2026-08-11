import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { HealthDimension } from "../../types/insightsTypes";
import { useUIStore } from "../../../../store/useUIStore";
import { dimensionStatus, NO_DATA_LABEL } from "../../utils/insightsFormat";
import { resolveActionRoute } from "../../utils/actionRoutes";

interface HealthDimensionCardProps {
  dimension: HealthDimension;
  /** Overview shows a one-line form; the Health page shows the expandable one. */
  variant?: "row" | "expandable";
}

/**
 * One health dimension.
 *
 * Collapsed it states three things: what it is, what it scored, and how that
 * reads. The engine's "why" and its suggested improvement live behind a
 * disclosure, because eight cards each carrying two paragraphs is how the
 * previous grid became a wall of text nobody finished.
 *
 * A dimension the engine could not score renders as "Not enough data" with no
 * bar, no colour band and no position in the ranking. Charting it as zero would
 * both misreport the dimension and drag the visual read of the whole grid.
 */
export const HealthDimensionCard: React.FC<HealthDimensionCardProps> = ({
  dimension,
  variant = "expandable",
}) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const navigateToRoute = useUIStore((s) => s.navigateToRoute);

  const status = dimensionStatus(dimension.score);
  const hasScore = dimension.score !== null;
  const hasDetail = Boolean(dimension.why || dimension.improvement);
  const destination = resolveActionRoute({
    deepLink: dimension.deepLink,
    component: dimension.code,
  });

  const scoreBlock = (
    <div className="flex shrink-0 items-baseline gap-1">
      {hasScore ? (
        <>
          <span className={`text-lg font-semibold tabular-nums ${status.text}`}>
            {dimension.score}
          </span>
          <span className="text-[11px] text-slate-500">/ 100</span>
        </>
      ) : (
        <span className="text-xs font-medium text-slate-500">{NO_DATA_LABEL}</span>
      )}
    </div>
  );

  if (variant === "row") {
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{dimension.label}</span>
        {hasScore && (
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.chip}`}
          >
            {status.label}
          </span>
        )}
        {scoreBlock}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-slate-100">{dimension.label}</h3>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.chip}`}
            >
              {status.label}
            </span>
          </div>

          {hasScore && (
            <div
              className="h-1 w-full max-w-56 overflow-hidden rounded-full bg-slate-800"
              role="presentation"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${dimension.score}%`, backgroundColor: status.stroke }}
              />
            </div>
          )}
        </div>

        {scoreBlock}
      </div>

      {hasDetail && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="flex w-full items-center justify-between gap-2 border-t border-slate-800 px-4 py-2 text-left text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          >
            {expanded ? "Hide detail" : "Why this score"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {expanded && (
            <div id={panelId} className="space-y-3 border-t border-slate-800 px-4 py-3">
              {dimension.why && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Why
                  </p>
                  <p className="text-xs leading-relaxed text-slate-300">{dimension.why}</p>
                </div>
              )}
              {dimension.improvement && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    What would improve it
                  </p>
                  <p className="text-xs leading-relaxed text-slate-300">{dimension.improvement}</p>
                </div>
              )}
              {destination && (
                <button
                  type="button"
                  onClick={() => navigateToRoute(destination.tab, destination.subTab)}
                  className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {destination.label} →
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
