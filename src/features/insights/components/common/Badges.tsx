import React from "react";
import { Clock } from "lucide-react";
import { formatLastSyncedAt } from "../../../../utils/formatters";

/**
 * How sure the *backend* is about a detection.
 *
 * Renders nothing for `null`. That is the whole point: the previous risk card
 * always printed "Confidence: 90%" because the mapper substituted 90 whenever a
 * rule carried no evidence, which dressed an unquantified detection as a
 * measured one. No number is a truthful state; a default is not.
 */
export const ConfidenceBadge: React.FC<{ percent: number | null; className?: string }> = ({
  percent,
  className = "",
}) => {
  if (percent === null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] text-slate-400 ${className}`}
      title="How confident the detection rule is, based on the evidence it used"
    >
      <span className="sr-only">Detection confidence</span>
      <span aria-hidden="true">Confidence</span>
      <span className="font-semibold text-slate-300">{Math.round(percent)}%</span>
    </span>
  );
};

/**
 * When these figures were last fetched. Shown quietly, but shown — analytics
 * read from a cache without a timestamp invite the reader to assume "now".
 */
export const DataFreshnessBadge: React.FC<{ updatedAt: number | null; asOf?: string | null }> = ({
  updatedAt,
  asOf,
}) => {
  if (!updatedAt && !asOf) return null;
  const label = asOf
    ? `As of ${formatLastSyncedAt(asOf)}`
    : `Updated ${formatLastSyncedAt(new Date(updatedAt as number).toISOString())}`;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      <Clock className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
};

/**
 * Marks a figure as a projection rather than a measurement.
 *
 * Forecast numbers sitting in the same type and weight as actuals is how a
 * dashboard starts lying by layout alone.
 */
export const ProjectionBadge: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span
    className={`inline-flex items-center rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300 ${className}`}
  >
    Projected
  </span>
);
