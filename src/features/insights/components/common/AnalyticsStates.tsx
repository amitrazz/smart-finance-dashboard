import React from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorState } from "../../../../components/common/ErrorState";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { NO_DATA_HINT } from "../../utils/insightsFormat";

/**
 * The five things a section can be, other than "showing data".
 *
 * Empty, error and loading delegate to the app's shared `EmptyState`,
 * `ErrorState` and `LoadingSkeleton` so Insights looks like the rest of the
 * product rather than inventing a third visual language for the same idea.
 * Partial and stale have no shared equivalent — they're specific to this
 * workspace's "some inputs are missing" model — so they're defined here in the
 * same idiom.
 *
 * Before this, every Insights submodule opened with `if (isLoading || !data)
 * return null` — one line that collapsed loading, empty and error into a blank
 * region with no explanation and no way to retry. A backend outage looked
 * exactly like a new account with no transactions.
 */

interface StateProps {
  title?: string;
  message?: string;
}

/** Nothing here yet, and that's a fact about the data, not a failure. */
export const EmptyAnalyticsState: React.FC<StateProps> = ({
  title = "Nothing to show yet",
  message = NO_DATA_HINT,
}) => (
  <EmptyState
    icon={<Inbox className="w-8 h-8" aria-hidden="true" />}
    title={title}
    message={message}
  />
);

/**
 * Shown *above* real content: the section is renderable but one of its inputs
 * didn't arrive, so some figures will read "Not enough data".
 */
export const PartialAnalyticsState: React.FC<StateProps> = ({
  message = "Some of this section's data is unavailable, so parts of it are incomplete.",
}) => (
  <p
    className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200/90"
    role="status"
  >
    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </p>
);

/** Cached figures on screen while a refresh is in flight. */
export const StaleAnalyticsState: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500" role="status">
    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
    <span>Updating…</span>
  </span>
);

interface ErrorProps extends StateProps {
  onRetry?: () => void;
}

export const AnalyticsErrorState: React.FC<ErrorProps> = ({
  title = "Couldn't load this section",
  message = "The request failed. Your data is fine — this is a fetch problem.",
  onRetry,
}) => (
  // The shared `ErrorState` carries no live-region role, so a failure that
  // replaces content after load would go unannounced. Wrapping rather than
  // forking keeps the design-system visuals and adds the announcement.
  <div role="alert">
    <ErrorState title={title} message={message} onRetry={onRetry} />
  </div>
);

/** Skeleton sized to the section it replaces, so nothing jumps on arrival. */
export const AnalyticsLoadingState: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <LoadingSkeleton type={rows === 0 ? "chart" : "cards"} rows={4} />
);
