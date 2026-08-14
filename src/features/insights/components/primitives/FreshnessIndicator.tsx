import React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { formatLastSyncedAt } from "../../../../utils/formatters";
import { useInsightsFreshness } from "../../hooks/useInsightsFreshness";

/**
 * When these figures were last read, said once for the whole workspace.
 *
 * Analytics served from a cache with no timestamp invites the reader to assume
 * "now", which is the assumption most likely to cost them money. But the same
 * caveat repeated on every card stops being read at all, so this is rendered in
 * one place — the workspace header — and states the *oldest* reading on screen.
 *
 * It escalates rather than nags: quiet grey while current, an amber line with a
 * refresh affordance once the data is old enough to act on wrongly.
 */
export const FreshnessIndicator: React.FC<{ onRefresh: () => void; className?: string }> = ({
  onRefresh,
  className = "",
}) => {
  const { updatedAt, isFetching, isOutdated } = useInsightsFreshness();

  if (isFetching && updatedAt === null) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] text-slate-500 ${className}`}
        role="status"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Loading your figures…
      </span>
    );
  }

  if (updatedAt === null) return null;

  const read = formatLastSyncedAt(new Date(updatedAt).toISOString());

  if (!isOutdated) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] text-slate-500 ${className}`}
        role="status"
      >
        {isFetching && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        <span>{isFetching ? "Updating…" : `Based on data read ${read}`}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onRefresh}
      className={`inline-flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200 transition-colors hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${className}`}
    >
      <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>These figures may be outdated · read {read}</span>
    </button>
  );
};
