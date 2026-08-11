import React, { useId } from "react";
import { ArrowRight } from "lucide-react";
import { InsightsQueryResult } from "../../hooks/useInsightsQueries";
import {
  AnalyticsErrorState,
  AnalyticsLoadingState,
  EmptyAnalyticsState,
  PartialAnalyticsState,
  StaleAnalyticsState,
} from "./AnalyticsStates";
import { DataFreshnessBadge } from "./Badges";

interface AnalyticsSectionProps<T> {
  title: string;
  /** One line on what the section answers. Kept short — cards should not lecture. */
  description?: string;
  /** Handoff to the module that owns this domain (Insights interprets, it doesn't manage). */
  link?: { label: string; onClick: () => void };
  result: InsightsQueryResult<T>;
  /** Rendered only with real data in hand, so children never guard for null. */
  children: (data: T) => React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  headingLevel?: "h2" | "h3";
  /** Freshness of the underlying snapshot, when the domain reports one. */
  asOf?: string | null;
  /**
   * Renders without the surrounding panel. For sections that are a grid of
   * cards in their own right, where a panel around cards would double the
   * chrome.
   */
  bare?: boolean;
  className?: string;
}

/**
 * One consistent frame for every analytics section: the app's standard
 * `rounded-3xl` glass panel, a heading, an optional handoff link, and exactly
 * one of loading / error / empty / data.
 *
 * Centralising the state machine is what makes "every section supports all five
 * states" enforceable rather than aspirational — a new section gets them by
 * construction, and `children` is a render prop taking non-null data so it is
 * impossible to render a section body against missing data.
 */
export function AnalyticsSection<T>({
  title,
  description,
  link,
  result,
  children,
  emptyTitle,
  emptyMessage,
  headingLevel = "h2",
  asOf,
  bare = false,
  className = "",
}: AnalyticsSectionProps<T>) {
  const Heading = headingLevel;
  // Naming the section promotes it from a generic box to a landmark, so it
  // shows up in a screen reader's region list and can be jumped to directly.
  const headingId = useId();

  const panel = bare
    ? "space-y-5"
    : "p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5";

  return (
    <section
      className={`${panel} ${className}`}
      aria-labelledby={headingId}
      aria-busy={result.isLoading}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Heading id={headingId} className="text-base font-bold tracking-tight text-slate-100">
              {title}
            </Heading>
            {/* A first load is not a stale read; only mark content that is
                already on screen as being refreshed. */}
            {!result.isLoading && result.isStale && <StaleAnalyticsState />}
          </div>
          {description && <p className="text-xs leading-relaxed text-slate-400">{description}</p>}
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessBadge updatedAt={result.updatedAt} asOf={asOf} />
          {link && (
            <button
              type="button"
              onClick={link.onClick}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
            >
              {link.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {result.isLoading ? (
        <AnalyticsLoadingState />
      ) : result.isError ? (
        <AnalyticsErrorState onRetry={result.refetch} />
      ) : result.data === null ? (
        <EmptyAnalyticsState title={emptyTitle} message={emptyMessage} />
      ) : (
        <div className="space-y-5">
          {result.isPartial && <PartialAnalyticsState />}
          {children(result.data)}
        </div>
      )}
    </section>
  );
}
