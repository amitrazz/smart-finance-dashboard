/**
 * Workspace-wide filter state for Insights.
 *
 * Deliberately small. The previous toolbar rendered an "All Accounts & Cards"
 * chip and a "Currency: INR" chip permanently disabled, because no analytics
 * endpoint accepts an account or currency parameter — three controls' worth of
 * chrome that could never change a number. They are gone.
 *
 * What remains is the one filter the backend genuinely honours: the history
 * window, which maps to a real `limit` (months of snapshots) on
 * `/net-worth/history`, `/cash-flow`, `/analytics/income-trend`,
 * `/analytics/expense-trend` and `/financial-health/history`. Changing it
 * changes the requests, which is the only reason a filter should exist.
 *
 * State lives here rather than in a page so every section reads the same window
 * without prop-drilling, and it persists across sessions so the workspace opens
 * the way it was left.
 */
import { create } from "zustand";
import {
  INSIGHTS_PERIOD_MONTHS,
  InsightsPeriod,
  InsightsFilterState,
} from "../types/insightsTypes";

const STORAGE_KEY = "insights.filters.period";
const DEFAULT_PERIOD: InsightsPeriod = "1Y";

const isPeriod = (v: unknown): v is InsightsPeriod =>
  typeof v === "string" && v in INSIGHTS_PERIOD_MONTHS;

function readStoredPeriod(): InsightsPeriod {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isPeriod(raw) ? raw : DEFAULT_PERIOD;
  } catch {
    return DEFAULT_PERIOD;
  }
}

interface InsightsFiltersStore extends InsightsFilterState {
  setPeriod: (period: InsightsPeriod) => void;
  reset: () => void;
}

export const useInsightsFilters = create<InsightsFiltersStore>((set) => ({
  period: readStoredPeriod(),
  setPeriod: (period) => {
    try {
      localStorage.setItem(STORAGE_KEY, period);
    } catch {
      /* Storage can be unavailable (private mode); the filter still works in-session. */
    }
    set({ period });
  },
  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    set({ period: DEFAULT_PERIOD });
  },
}));

/** The selected window expressed as the `limit` the backend expects. */
export function useInsightsPeriodMonths(): number {
  return useInsightsFilters((s) => INSIGHTS_PERIOD_MONTHS[s.period]);
}
