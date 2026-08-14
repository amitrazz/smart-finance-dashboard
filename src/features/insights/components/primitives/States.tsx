import React from "react";
import {
  AlertTriangle,
  CalendarRange,
  CloudOff,
  Loader2,
  PlugZap,
  SearchX,
} from "lucide-react";
import { Button } from "../../../../components/ui/Button";
import { ErrorState } from "../../../../components/common/ErrorState";

/**
 * The reasons a section can have nothing to show — and they are not the same
 * reason.
 *
 * The workspace previously answered all of them with one sentence, "Not enough
 * data", which told a brand-new account to wait for something that would never
 * arrive on its own, and told an account with a failing endpoint that its own
 * history was too short. Each state below names what is actually true and, where
 * the user can do something, says what.
 *
 * `NO_DATA_LABEL` stays as the label for a single *figure* the backend didn't
 * produce. These are for a whole section.
 */
export type EmptyReason =
  | "no-data"
  | "insufficient-history"
  | "unavailable"
  | "processing"
  | "no-match";

const REASONS: Record<
  EmptyReason,
  { icon: React.ElementType; title: string; message: string }
> = {
  "no-data": {
    icon: PlugZap,
    title: "No financial data yet",
    message:
      "This is computed from your recorded accounts and transactions. Import a statement or add a transaction to begin.",
  },
  "insufficient-history": {
    icon: CalendarRange,
    title: "Not enough history",
    message:
      "Comparing periods needs at least two recorded ones. This fills in on its own once another period is recorded.",
  },
  unavailable: {
    icon: CloudOff,
    title: "Not available yet",
    message: "No endpoint produces this figure, so nothing is estimated in its place.",
  },
  processing: {
    icon: Loader2,
    title: "Still being calculated",
    message: "The engine hasn't finished producing this snapshot. It appears once the run completes.",
  },
  "no-match": {
    icon: SearchX,
    title: "Nothing matches this filter",
    message: "Clear or widen the filter to see the rest.",
  },
};

interface EmptyProps {
  reason: EmptyReason;
  /** Overrides the stock wording when a section can say something more specific. */
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Quiet by design: a bordered strip, not a hero panel with a 96px icon circle.
 * An empty section should occupy roughly the space its content would, so a page
 * of them doesn't read as a page of announcements.
 */
export const InsightsEmptyState: React.FC<EmptyProps> = ({
  reason,
  title,
  message,
  action,
  className = "",
}) => {
  const spec = REASONS[reason];
  const Icon = spec.icon;
  return (
    <div
      className={`flex flex-col items-start gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/30 px-4 py-5 sm:flex-row sm:items-center ${className}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 text-slate-600 ${reason === "processing" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium text-slate-300">{title ?? spec.title}</p>
        <p className="text-xs leading-relaxed text-slate-500">{message ?? spec.message}</p>
      </div>
      {action && (
        <Button variant="neutral" hierarchy="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

/**
 * Shown *above* real content: the section renders, but one of its inputs didn't
 * arrive, so some figures inside will read "Not enough data".
 */
export const PartialDataState: React.FC<{ message?: string }> = ({
  message = "Part of this section's data didn't load, so some figures are missing rather than estimated.",
}) => (
  <p
    className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90"
    role="status"
  >
    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </p>
);

export const InsightsErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = "Couldn't load this section",
  message = "The request failed. Your data is fine — this is a fetch problem.",
  onRetry,
}) => (
  // The shared `ErrorState` carries no live-region role, so a failure replacing
  // content after load would go unannounced. Wrapping keeps the design-system
  // visuals and adds the announcement.
  <div role="alert">
    <ErrorState title={title} message={message} onRetry={onRetry} />
  </div>
);

// ---------------------------------------------------------------------------
// Skeletons, shaped like the content they stand in for
// ---------------------------------------------------------------------------

const shimmer = "animate-pulse rounded bg-slate-800/70";

/** A row of figures: label bar, value bar, delta bar. */
export const MetricRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4" aria-hidden="true">
    {Array.from({ length: columns }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className={`${shimmer} h-2.5 w-16`} />
        <div className={`${shimmer} h-6 w-28`} />
        <div className={`${shimmer} h-2.5 w-20`} />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 220 }) => (
  <div className="space-y-3" aria-hidden="true">
    <div className={`${shimmer} h-2.5 w-56`} />
    <div className={`${shimmer} w-full`} style={{ height }} />
  </div>
);

/** Prose skeleton for the narrative block — lines, not boxes. */
export const StorySkeleton: React.FC = () => (
  <div className="space-y-2.5" aria-hidden="true">
    <div className={`${shimmer} h-3 w-full max-w-xl`} />
    <div className={`${shimmer} h-3 w-full max-w-lg`} />
    <div className={`${shimmer} h-3 w-2/3 max-w-sm`} />
  </div>
);

/** Stacked cards for the intelligence feed. */
export const FeedSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-2 rounded-lg border border-slate-800/60 px-4 py-3.5">
        <div className={`${shimmer} h-2.5 w-24`} />
        <div className={`${shimmer} h-3.5 w-2/3`} />
        <div className={`${shimmer} h-2.5 w-1/2`} />
      </div>
    ))}
  </div>
);

/** Rows of label + amount, for breakdown tables. */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2.5" aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between gap-4">
        <div className={`${shimmer} h-3 w-32`} />
        <div className={`${shimmer} h-3 w-20`} />
      </div>
    ))}
  </div>
);
