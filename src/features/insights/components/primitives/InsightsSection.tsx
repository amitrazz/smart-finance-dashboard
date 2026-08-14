import React, { useId } from "react";
import { InsightsQueryResult } from "../../hooks/useInsightsQueries";
import { SectionHeader } from "./SectionHeader";
import { Surface } from "./Surface";
import {
  EmptyReason,
  InsightsEmptyState,
  InsightsErrorState,
  MetricRowSkeleton,
  PartialDataState,
} from "./States";

interface InsightsSectionProps<T> {
  title: string;
  description?: string;
  link?: { label: string; onClick: () => void };
  actions?: React.ReactNode;
  result: InsightsQueryResult<T>;
  /** Rendered only with real data in hand, so children never guard for null. */
  children: (data: T) => React.ReactNode;
  /** What "nothing here" means for *this* section, and what to do about it. */
  empty?: {
    reason?: EmptyReason;
    title?: string;
    message?: string;
    action?: { label: string; onClick: () => void };
  };
  /** Skeleton shaped like this section's content. Defaults to a metric row. */
  skeleton?: React.ReactNode;
  /** Renders without the surrounding panel, for sections that are already a group of cards. */
  bare?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}

/**
 * One frame for every section: heading, optional handoff, and exactly one of
 * loading / error / empty / data.
 *
 * Centralising the state machine is what makes "every section handles every
 * state" enforceable instead of aspirational — a new section gets all of them by
 * construction, and `children` receives non-null data, so it is impossible to
 * render a body against missing data.
 *
 * Two things the previous `AnalyticsSection` did are deliberately gone. It
 * stamped a freshness badge on every section (now once, in the header), and its
 * empty state was one generic sentence for every cause (now a named reason with
 * an action where one exists).
 */
export function InsightsSection<T>({
  title,
  description,
  link,
  actions,
  result,
  children,
  empty,
  skeleton,
  bare = false,
  headingLevel = "h2",
  className = "",
}: InsightsSectionProps<T>) {
  // Naming the region promotes it from a generic box to a landmark, so it
  // appears in a screen reader's region list and can be jumped to directly.
  const headingId = useId();

  const body = result.isLoading ? (
    (skeleton ?? <MetricRowSkeleton />)
  ) : result.isError ? (
    <InsightsErrorState onRetry={result.refetch} />
  ) : result.data === null ? (
    <InsightsEmptyState
      reason={empty?.reason ?? "no-data"}
      title={empty?.title}
      message={empty?.message}
      action={empty?.action}
    />
  ) : (
    <div className="space-y-4">
      {result.isPartial && <PartialDataState />}
      {children(result.data)}
    </div>
  );

  const content = (
    <>
      <SectionHeader
        id={headingId}
        title={title}
        description={description}
        link={link}
        actions={actions}
        as={headingLevel}
      />
      {body}
    </>
  );

  if (bare) {
    return (
      <section
        className={`space-y-4 ${className}`}
        aria-labelledby={headingId}
        aria-busy={result.isLoading}
      >
        {content}
      </section>
    );
  }

  return (
    <Surface className={className}>
      <section
        className="space-y-4 p-4 sm:p-5"
        aria-labelledby={headingId}
        aria-busy={result.isLoading}
      >
        {content}
      </section>
    </Surface>
  );
}
