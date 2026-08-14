import React from "react";
import { InsightsEmptyState, InsightsErrorState, PartialDataState } from "../primitives/States";
import { MetricRowSkeleton } from "../primitives/States";

/**
 * The analytics domains' state components — now adapters over the primitives in
 * `components/primitives/States`.
 *
 * Keeping the call signature is what let all nine analytics domains adopt the
 * quieter empty/error treatment in one change instead of nine, and without nine
 * chances to drift apart on the way.
 *
 * The one behavioural change: an empty state now names a *reason*. Call sites
 * that pass their own title and message keep them; the ones that don't now say
 * "no financial data yet" with an import route rather than the old catch-all
 * "Nothing to show yet", which told a new account to wait for something that
 * would never arrive on its own.
 */

interface StateProps {
  title?: string;
  message?: string;
}

export const EmptyAnalyticsState: React.FC<StateProps> = ({ title, message }) => (
  <InsightsEmptyState reason="no-data" title={title} message={message} />
);

export const PartialAnalyticsState: React.FC<StateProps> = ({ message }) => (
  <PartialDataState message={message} />
);

/**
 * Retained as a no-op so any remaining call site compiles.
 *
 * Per-section "Updating…" markers are gone: freshness belongs to the workspace,
 * and eight of these on one page during a single refresh is how a status
 * indicator becomes wallpaper. `FreshnessIndicator` states it once in the header.
 */
export const StaleAnalyticsState: React.FC = () => null;

export const AnalyticsErrorState: React.FC<StateProps & { onRetry?: () => void }> = ({
  title,
  message,
  onRetry,
}) => <InsightsErrorState title={title} message={message} onRetry={onRetry} />;

export const AnalyticsLoadingState: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <MetricRowSkeleton columns={rows === 0 ? 2 : rows} />
);
