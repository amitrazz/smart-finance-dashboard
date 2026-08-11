/**
 * Presentation helpers for Insights.
 *
 * These format values; they never derive them. Anything that turns two numbers
 * into a third lives in `api/insightsMappers.ts`, where it can be tested
 * without a DOM.
 */
import { RiskSeverity, RecommendationImpact } from "../types/insightsTypes";
import { SmartRecommendation, RiskItem } from "../types/insightsTypes";

/**
 * The single wording for absent data, used everywhere so a reader learns it
 * once. It must never be substituted with "0", "—" alone, or an empty cell:
 * this workspace's whole credibility rests on the difference between "zero"
 * and "we don't know".
 */
export const NO_DATA_LABEL = "Not enough data";

/** Longer form for section-level absence. */
export const NO_DATA_HINT =
  "This needs data the backend hasn't produced yet. Nothing here is estimated.";

// ---------------------------------------------------------------------------
// Health score presentation
// ---------------------------------------------------------------------------

export interface HealthStatusPresentation {
  /** Uppercase status word, always rendered as text — never colour alone. */
  label: string;
  /** Tailwind text colour token. */
  text: string;
  /** Tailwind background + border for the status chip. */
  chip: string;
  /** Stroke colour for the score dial. */
  stroke: string;
}

const HEALTH_STATUS: Record<string, HealthStatusPresentation> = {
  EXCEPTIONAL: {
    label: "Exceptional",
    text: "text-emerald-300",
    chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    stroke: "#34d399",
  },
  EXCELLENT: {
    label: "Excellent",
    text: "text-emerald-400",
    chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    stroke: "#34d399",
  },
  GOOD: {
    label: "Good",
    text: "text-teal-300",
    chip: "bg-teal-500/10 border-teal-500/30 text-teal-300",
    stroke: "#2dd4bf",
  },
  NEEDS_ATTENTION: {
    label: "Needs attention",
    text: "text-amber-300",
    chip: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    stroke: "#fbbf24",
  },
  POOR: {
    label: "Poor",
    text: "text-orange-300",
    chip: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    stroke: "#fb923c",
  },
  CRITICAL: {
    label: "Critical",
    text: "text-rose-300",
    chip: "bg-rose-500/10 border-rose-500/30 text-rose-300",
    stroke: "#fb7185",
  },
};

const UNKNOWN_STATUS: HealthStatusPresentation = {
  label: "Unrated",
  text: "text-slate-300",
  chip: "bg-slate-800 border-slate-700 text-slate-300",
  stroke: "#64748b",
};

export function healthStatus(rating: string | null | undefined): HealthStatusPresentation {
  if (!rating) return UNKNOWN_STATUS;
  return HEALTH_STATUS[rating.toUpperCase()] ?? UNKNOWN_STATUS;
}

/**
 * Banding for a single dimension score, used where the backend gives a number
 * but no rating of its own. Returns the "unrated" presentation for `null` so an
 * unscored dimension never borrows the colour of a bad one.
 */
export function dimensionStatus(score: number | null): HealthStatusPresentation {
  if (score === null) return UNKNOWN_STATUS;
  if (score >= 85) return HEALTH_STATUS.EXCELLENT;
  if (score >= 70) return HEALTH_STATUS.GOOD;
  if (score >= 55) return HEALTH_STATUS.NEEDS_ATTENTION;
  if (score >= 40) return HEALTH_STATUS.POOR;
  return HEALTH_STATUS.CRITICAL;
}

// ---------------------------------------------------------------------------
// Deltas
// ---------------------------------------------------------------------------

/** `+2 pts` / `−3 pts` / `No change`. `null` in ⇒ `null` out, so callers can omit the row. */
export function formatPoints(delta: number | null | undefined, unit = "pts"): string | null {
  if (delta === null || delta === undefined) return null;
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return "No change";
  // U+2212 MINUS SIGN, not a hyphen: it aligns with digits and reads as a sign.
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)} ${unit}`;
}

export function formatPercentDelta(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(1)}%`;
}

export type Direction = "up" | "down" | "flat";

export function directionOf(value: number | null | undefined): Direction {
  if (value === null || value === undefined || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

// ---------------------------------------------------------------------------
// Severity & impact presentation
// ---------------------------------------------------------------------------

export interface SeverityPresentation {
  label: string;
  chip: string;
  /** Left rule colour on cards, so severity survives a greyscale print. */
  rule: string;
  order: number;
}

export const SEVERITY: Record<RiskSeverity, SeverityPresentation> = {
  CRITICAL: {
    label: "Critical",
    chip: "bg-rose-500/15 border-rose-500/40 text-rose-200",
    rule: "border-l-rose-500",
    order: 0,
  },
  HIGH: {
    label: "High",
    chip: "bg-amber-500/15 border-amber-500/40 text-amber-200",
    rule: "border-l-amber-500",
    order: 1,
  },
  MEDIUM: {
    label: "Medium",
    chip: "bg-sky-500/15 border-sky-500/40 text-sky-200",
    rule: "border-l-sky-500",
    order: 2,
  },
  LOW: {
    label: "Low",
    chip: "bg-slate-700/60 border-slate-600 text-slate-300",
    rule: "border-l-slate-600",
    order: 3,
  },
};

export const IMPACT: Record<RecommendationImpact, { label: string; chip: string; order: number }> = {
  HIGH_IMPACT: {
    label: "High impact",
    chip: "bg-violet-500/15 border-violet-500/40 text-violet-200",
    order: 0,
  },
  QUICK_WIN: {
    label: "Quick win",
    chip: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
    order: 1,
  },
  LONG_TERM: {
    label: "Long term",
    chip: "bg-slate-700/60 border-slate-600 text-slate-300",
    order: 2,
  },
};

// ---------------------------------------------------------------------------
// Prioritisation
// ---------------------------------------------------------------------------

/**
 * Orders risks the way someone triaging them would: severity first, then how
 * soon it bites, then how certain the detection is.
 *
 * Items with no due date sort after dated ones at the same severity — an
 * undated risk is not more urgent than one due tomorrow — and unquantified
 * confidence sorts last rather than being treated as 0% or 100%.
 */
export function sortRisks(risks: RiskItem[]): RiskItem[] {
  return [...risks].sort((a, b) => {
    const bySeverity = SEVERITY[a.severity].order - SEVERITY[b.severity].order;
    if (bySeverity !== 0) return bySeverity;

    const aDue = a.dueInDays ?? Number.POSITIVE_INFINITY;
    const bDue = b.dueInDays ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;

    const aConf = a.confidencePercent ?? -1;
    const bConf = b.confidencePercent ?? -1;
    return bConf - aConf;
  });
}

/**
 * Orders recommendations as a priority inbox: impact bucket first, then the
 * score movement the engine attributes to each, largest first. Recommendations
 * with no attributed movement sort last within their bucket.
 */
export function sortRecommendations(recommendations: SmartRecommendation[]): SmartRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const byImpact = IMPACT[a.impactType].order - IMPACT[b.impactType].order;
    if (byImpact !== 0) return byImpact;
    return Math.abs(b.scoreImpact ?? -1) - Math.abs(a.scoreImpact ?? -1);
  });
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** `in 3 days` / `tomorrow` / `today` / `4 days overdue`. */
export function formatDueIn(days: number | null | undefined): string | null {
  if (days === null || days === undefined) return null;
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** Short month label for chart axes: `2026-03` → `Mar 26`. */
export function shortPeriodLabel(period: string | null | undefined): string {
  if (!period) return "";
  const match = /^(\d{4})-(\d{2})/.exec(period);
  if (!match) return period;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}
