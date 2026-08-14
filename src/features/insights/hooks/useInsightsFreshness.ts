import { useMemo } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { INSIGHTS_ROOT_KEY } from "../api/insightsSources";

export interface InsightsFreshness {
  /** Oldest successful fetch across the workspace, or `null` before anything loads. */
  updatedAt: number | null;
  /** A request is in flight somewhere in the workspace. */
  isFetching: boolean;
  /** Old enough that the reader should be told before they act on it. */
  isOutdated: boolean;
}

/** Half an hour. Below this, freshness is noise; above it, it's a caveat. */
const OUTDATED_AFTER_MS = 30 * 60 * 1000;

/**
 * One freshness reading for the whole workspace.
 *
 * Every section used to carry its own "Updated 15 mins ago" badge, so a single
 * page could show the same sentence eight times — which is how a caveat becomes
 * wallpaper and stops being read. Freshness is a property of the workspace's
 * data, not of each card, so it is measured once here and rendered once in the
 * header.
 *
 * The *oldest* timestamp wins deliberately: a page is only as current as its
 * stalest figure, and reporting the newest would let one just-refetched query
 * vouch for eleven others.
 *
 * `useIsFetching` supplies the re-render. It flips exactly when a request starts
 * or finishes — which is exactly when these timestamps change — so the cache can
 * be read during render without a manual subscription.
 */
export function useInsightsFreshness(): InsightsFreshness {
  const queryClient = useQueryClient();
  const fetchingCount = useIsFetching({ queryKey: INSIGHTS_ROOT_KEY });

  return useMemo(() => {
    const queries = queryClient
      .getQueryCache()
      .findAll({ queryKey: INSIGHTS_ROOT_KEY })
      .filter((query) => query.state.status === "success" && query.state.dataUpdatedAt > 0);

    const updatedAt = queries.reduce<number | null>(
      (oldest, query) =>
        oldest === null ? query.state.dataUpdatedAt : Math.min(oldest, query.state.dataUpdatedAt),
      null,
    );

    return {
      updatedAt,
      isFetching: fetchingCount > 0,
      isOutdated: updatedAt !== null && Date.now() - updatedAt > OUTDATED_AFTER_MS,
    };
  }, [queryClient, fetchingCount]);
}
