import React from "react";
import { InsightsQueryResult } from "../../hooks/useInsightsQueries";
import { InsightsSection } from "../primitives/InsightsSection";
import { EmptyReason } from "../primitives/States";

interface AnalyticsSectionProps<T> {
  title: string;
  description?: string;
  link?: { label: string; onClick: () => void };
  result: InsightsQueryResult<T>;
  children: (data: T) => React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Why this section might be empty, so the state names a cause and offers a way out. */
  emptyReason?: EmptyReason;
  emptyAction?: { label: string; onClick: () => void };
  headingLevel?: "h2" | "h3";
  /**
   * The snapshot date the figures describe. Kept as a prop but no longer
   * rendered here — see below.
   */
  asOf?: string | null;
  skeleton?: React.ReactNode;
  bare?: boolean;
  className?: string;
}

/**
 * The analytics domains' section frame — now a thin adapter over
 * `InsightsSection`.
 *
 * Keeping the old call signature is what lets all nine analytics domains adopt
 * the new surfaces, headings, skeletons and empty states without nine
 * rewrites — and, more importantly, without nine opportunities to drift apart
 * while being rewritten.
 *
 * One prop changed meaning. `asOf` no longer renders a per-section freshness
 * badge: freshness is a property of the workspace's data, not of each card, and
 * eight copies of "Updated 15 mins ago" on one page is how a caveat becomes
 * wallpaper. It is stated once in the header now. The prop is retained rather
 * than removed so call sites keep documenting which domains report a snapshot
 * date at all.
 */
export function AnalyticsSection<T>({
  title,
  description,
  link,
  result,
  children,
  emptyTitle,
  emptyMessage,
  emptyReason = "no-data",
  emptyAction,
  headingLevel = "h2",
  skeleton,
  bare = false,
  className = "",
}: AnalyticsSectionProps<T>) {
  return (
    <InsightsSection
      title={title}
      description={description}
      link={link}
      result={result}
      empty={{
        reason: emptyReason,
        title: emptyTitle,
        message: emptyMessage,
        action: emptyAction,
      }}
      skeleton={skeleton}
      bare={bare}
      headingLevel={headingLevel}
      className={className}
    >
      {children}
    </InsightsSection>
  );
}
