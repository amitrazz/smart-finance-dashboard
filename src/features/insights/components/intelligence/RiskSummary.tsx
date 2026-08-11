import React from "react";
import { RiskMatrixAnalytics, RiskSeverity } from "../../types/insightsTypes";
import { SEVERITY } from "../../utils/insightsFormat";

export type RiskFilter = "ALL" | RiskSeverity;

interface RiskSummaryProps {
  matrix: RiskMatrixAnalytics;
  active?: RiskFilter;
  onFilterChange?: (filter: RiskFilter) => void;
}

const ORDER: RiskSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

/**
 * The severity breakdown, and the filter for it.
 *
 * "6 Active Warnings" told the reader nothing actionable — six of what, and
 * which one first? The count is only useful decomposed, so the decomposition
 * *is* the summary, and each band doubles as its filter.
 *
 * Bands with no risks render disabled rather than vanishing: a stable set of
 * four labels lets you read "2 critical, 0 high" at a glance, where a
 * disappearing band forces you to notice an absence.
 */
export const RiskSummary: React.FC<RiskSummaryProps> = ({
  matrix,
  active = "ALL",
  onFilterChange,
}) => {
  const counts: Record<RiskSeverity, number> = {
    CRITICAL: matrix.criticalCount,
    HIGH: matrix.highCount,
    MEDIUM: matrix.mediumCount,
    LOW: matrix.lowCount,
  };
  const total = matrix.risks.length;

  const bands: { key: RiskFilter; label: string; count: number; chip: string }[] = [
    {
      key: "ALL",
      label: "All",
      count: total,
      chip: "bg-slate-800 border-slate-700 text-slate-200",
    },
    ...ORDER.map((severity) => ({
      key: severity as RiskFilter,
      label: SEVERITY[severity].label,
      count: counts[severity],
      chip: SEVERITY[severity].chip,
    })),
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        <span className="font-semibold text-slate-100">{total}</span>{" "}
        {total === 1 ? "active risk" : "active risks"}
        {total > 0 && (
          <span className="text-slate-500">
            {" — "}
            {ORDER.filter((s) => counts[s] > 0)
              .map((s) => `${counts[s]} ${SEVERITY[s].label.toLowerCase()}`)
              .join(", ")}
          </span>
        )}
      </p>

      {onFilterChange && (
        <div role="group" aria-label="Filter risks by severity" className="flex flex-wrap gap-1.5">
          {bands.map((band) => {
            const selected = band.key === active;
            const empty = band.count === 0 && band.key !== "ALL";
            return (
              <button
                key={band.key}
                type="button"
                disabled={empty}
                aria-pressed={selected}
                onClick={() => onFilterChange(band.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  selected
                    ? band.chip
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                } ${empty ? "cursor-not-allowed opacity-40 hover:border-slate-800" : ""}`}
              >
                {band.label}
                <span className="tabular-nums">{band.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
