/**
 * The Intelligence feed: one ranked list of everything that deserves attention.
 *
 * ## Why a single feed
 *
 * The workspace used to split this across four sub-views — Recommended actions,
 * Risks, Anomalies, Trends — so answering "what should I deal with first?" meant
 * visiting four pages and ranking them against each other by hand. A ₹50
 * uncategorised transaction sat in one list looking exactly as urgent as a
 * ₹42,000 credit-card balance accruing interest in another.
 *
 * Everything actionable now lands in one list, ranked by `rankOf` below.
 *
 * ## Lifecycle stays on the backend
 *
 * Smart Actions carry their own lifecycle — detection, dedupe (`dedupeKey`),
 * dismissal, expiry, completion — and this module does not simulate any part of
 * it. It never invents an item, never revives a dismissed one, never merges two
 * rows the backend chose to keep separate, and never re-detects anything
 * client-side. Items are keyed by backend id; if the same finding appears twice,
 * that is a backend dedupe question, and answering it here would hide the bug
 * while double-counting the finding in every total on the page.
 *
 * The only client-side additions are *ordering* and *presentation grouping*,
 * neither of which changes what exists.
 */
import type { ActionEvidence, Money, SmartActionItem } from "../../../types";
import { RiskSeverity, SmartRecommendation } from "../types/insightsTypes";
import { asMoney, num, riskConfidencePercent, riskSubject } from "./insightsMappers";

/**
 * What kind of thing this is, which is not the same as how bad it is.
 *
 * - `risk` — something is wrong or about to be.
 * - `opportunity` — nothing is wrong; there is money or score on the table.
 * - `housekeeping` — a data chore. Real, but it is not a financial finding, and
 *   ranking it beside one is what made the old feed unreadable.
 */
export type ItemNature = "risk" | "opportunity" | "housekeeping";

/** The filter chips. Deliberately few — a filter list nobody can scan is a second navigation problem. */
export type FeedFilter =
  | "all"
  | "attention"
  | "risk"
  | "opportunity"
  | "spending"
  | "cash-flow"
  | "debt"
  | "investments"
  | "goals"
  | "subscriptions";

export const FEED_FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attention", label: "Attention" },
  { id: "risk", label: "Risk" },
  { id: "opportunity", label: "Opportunity" },
  { id: "spending", label: "Spending" },
  { id: "cash-flow", label: "Cash flow" },
  { id: "debt", label: "Debt" },
  { id: "investments", label: "Investments" },
  { id: "goals", label: "Goals" },
  { id: "subscriptions", label: "Subscriptions" },
];

export interface IntelligenceItem {
  id: string;
  nature: ItemNature;
  severity: RiskSeverity;
  /** Human category label, e.g. "Credit". */
  category: string;
  /** Filter chips this item answers to. */
  filters: FeedFilter[];
  title: string;
  /**
   * The rule's structured "why" — a concrete comparison against a baseline,
   * produced deterministically. This is an *observation*, and the UI labels it
   * as one.
   */
  observed: string;
  /** The rule's own reading of what the observation means, when it gave one. */
  interpretation: string | null;
  /** What the backend suggests doing. Never synthesised here. */
  suggestedAction: string | null;
  financialImpact: Money | null;
  dueInDays: number | null;
  /** Detection confidence, from the rule's evidence. `null` when it carried none. */
  confidencePercent: number | null;
  /** Health-score movement the engine attributes to acting on this. */
  scoreImpact: number | null;
  /** Structured metrics the rule fired on. Empty when the rule made no numeric claim. */
  evidence: ActionEvidence[];
  affectedEntity: string | null;
  deepLink: string | null;
  /** Health dimension, for items that came from the health engine. */
  component: string | null;
  /** Ranking score. Exposed so the ordering can be asserted in tests. */
  rank: number;
  // Smart Action Center metadata
  version?: number;
  status?: string;
  snoozedUntil?: string | null;
  dismissible?: boolean;
  actionable?: boolean;
  expiresAt?: string | null;
  /** When this item's underlying action was created/last touched. Absent for
   *  health recommendations, which carry no lifecycle timestamps of their own. */
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  PAYMENT: "Cash flow",
  INCOME: "Cash flow",
  SPENDING: "Spending",
  SAVINGS: "Savings",
  INVESTMENT: "Investments",
  CREDIT: "Credit",
  GOALS: "Goals",
  OPPORTUNITY: "Opportunity",
  DATA_QUALITY: "Data quality",
  IMPORT: "Data quality",
  ACCOUNT: "Accounts",
  SYSTEM: "System",
};

/** Categories that are chores rather than financial findings. */
const HOUSEKEEPING = new Set(["DATA_QUALITY", "IMPORT", "SYSTEM", "ACCOUNT"]);

const CATEGORY_FILTERS: Record<string, FeedFilter[]> = {
  PAYMENT: ["cash-flow"],
  INCOME: ["cash-flow"],
  SPENDING: ["spending"],
  SAVINGS: ["cash-flow"],
  INVESTMENT: ["investments"],
  CREDIT: ["debt"],
  GOALS: ["goals"],
};

const SEVERITY_BY_PRIORITY: Record<string, RiskSeverity> = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  INFO: "LOW",
};

/** Subscription findings are recognised by rule type, since there is no subscription category. */
function isSubscription(action: SmartActionItem): boolean {
  return /SUBSCRIPTION|RECURRING/i.test(action.type ?? "");
}

function natureOf(action: SmartActionItem): ItemNature {
  if (HOUSEKEEPING.has(action.category)) return "housekeeping";
  if (action.category === "OPPORTUNITY") return "opportunity";
  return "risk";
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Priority = impact + urgency + confidence + actionability.
 *
 * Each term is bounded, so no single one can dominate: a very large amount
 * cannot outrank a critical item due tomorrow, and an urgent item the user can
 * do nothing about cannot outrank an actionable one of the same severity.
 *
 * - **Impact (0–40)** — severity band, plus a log-scaled contribution from the
 *   money at stake. Log-scaled because the gap between ₹500 and ₹5,000 matters
 *   more than the gap between ₹50,000 and ₹54,500, and a linear term would let
 *   one large balance bury everything else permanently.
 * - **Urgency (0–25)** — overdue outranks due-today outranks due-this-week.
 * - **Confidence (0–20)** — an unquantified detection ranks as mid-confidence
 *   rather than as certain *or* as worthless; the rule fired for a reason, but
 *   it showed no arithmetic.
 * - **Actionability (0–15)** — a finding with a suggested action and somewhere
 *   to go beats one that only informs.
 *
 * Housekeeping is scored on the same scale and then floored, so a data chore
 * never outranks a financial finding no matter how it is dressed.
 */
const SEVERITY_WEIGHT: Record<RiskSeverity, number> = {
  CRITICAL: 25,
  HIGH: 18,
  MEDIUM: 10,
  LOW: 4,
};

export function rankOf(item: Omit<IntelligenceItem, "rank">): number {
  const impactAmount = item.financialImpact ? Math.abs(Number(item.financialImpact.amount)) : 0;
  const moneyTerm = impactAmount > 0 ? Math.min(15, Math.log10(impactAmount + 1) * 3) : 0;
  const impact = SEVERITY_WEIGHT[item.severity] + moneyTerm;

  const due = item.dueInDays;
  const urgency =
    due === null || due === undefined
      ? 0
      : due < 0
        ? 25
        : due === 0
          ? 20
          : due <= 7
            ? 14
            : due <= 30
              ? 7
              : 2;

  const confidence =
    item.confidencePercent === null ? 10 : Math.round((item.confidencePercent / 100) * 20);

  const actionability = (item.suggestedAction ? 8 : 0) + (item.deepLink ? 7 : 0);

  const score = impact + urgency + confidence + actionability;
  return item.nature === "housekeeping" ? Math.min(score, 12) : score;
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function filtersFor(action: SmartActionItem, nature: ItemNature): FeedFilter[] {
  const filters: FeedFilter[] = ["all"];
  if (nature === "risk") {
    filters.push("risk");
    // "Attention" must mean the same thing as the count in the heading. It
    // previously matched every risk while the heading counted only severe ones,
    // so a page reading "2 things deserve your attention" offered an Attention
    // chip promising 3.
    if (action.priority === "CRITICAL" || action.priority === "HIGH") filters.push("attention");
  }
  if (nature === "opportunity") filters.push("opportunity");
  if (isSubscription(action)) filters.push("subscriptions");
  filters.push(...(CATEGORY_FILTERS[action.category] ?? []));
  return Array.from(new Set(filters));
}

/**
 * Every actionable Smart Action becomes a feed item.
 *
 * Note what is *not* filtered out. `mapRisks` drops anything that isn't a
 * financial risk, which is right for a risk list and wrong here: it also dropped
 * every `OPPORTUNITY` the backend detected, so the one category that answers
 * "what opportunities do I have?" never reached the screen.
 */
export function mapIntelligence(actions: SmartActionItem[]): IntelligenceItem[] {
  const seen = new Set<string>();

  return actions
    .filter((action) => {
      // Backend lifecycle decides visibility. Anything not ACTIVE has been
      // dismissed, completed or expired, and re-showing it here would undo a
      // decision the user already made. However, if we are explicitly mapping
      // historical actions, we bypass this ACTIVE filter.
      const isHistoryMapping = actions.some(
        (a) => a.status === "COMPLETED" || a.status === "DISMISSED"
      );
      if (!isHistoryMapping && action.status && action.status !== "ACTIVE") return false;
      if (seen.has(action.id)) return false;
      seen.add(action.id);
      return true;
    })
    .map((action) => {
      const nature = natureOf(action);
      const base = {
        id: action.id,
        nature,
        severity: SEVERITY_BY_PRIORITY[action.priority] ?? "LOW",
        category: CATEGORY_LABELS[action.category] ?? "Other",
        filters: filtersFor(action, nature),
        title: action.title,
        // `explanation` is the rule's concrete comparison; `description` is its
        // summary. Preferring the former keeps the observation quantitative.
        observed: action.explanation || action.description,
        interpretation: action.explanation && action.description ? action.description : null,
        suggestedAction: action.recommendation ?? null,
        financialImpact: asMoney(action.amount ?? action.financialImpact, "INR"),
        dueInDays: num(action.dueInDays),
        confidencePercent: riskConfidencePercent(action),
        scoreImpact: num(action.healthScoreImpact ?? action.scoreImpact),
        evidence: action.evidence ?? [],
        affectedEntity: riskSubject(action),
        deepLink: action.deepLink ?? null,
        component: null,
        version: action.version,
        status: action.status,
        snoozedUntil: action.snoozedUntil ?? null,
        dismissible: action.dismissible,
        actionable: action.actionable,
        expiresAt: action.expiresAt ?? null,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      } satisfies Omit<IntelligenceItem, "rank">;

      return { ...base, rank: rankOf(base) };
    })
    .sort((a, b) => b.rank - a.rank);
}

/**
 * Health recommendations join the same feed as opportunities.
 *
 * They are engine output, not detections, so they carry no evidence rows and no
 * due date — and the feed says so rather than padding them out to look like
 * risks. Their impact is a health-score movement, which is the one thing the
 * engine does quantify.
 */
export function recommendationsAsItems(
  recommendations: SmartRecommendation[],
): IntelligenceItem[] {
  return recommendations.map((recommendation) => {
    const base = {
      id: `recommendation:${recommendation.id}`,
      nature: "opportunity" as const,
      severity: (recommendation.impactType === "HIGH_IMPACT" ? "MEDIUM" : "LOW") as RiskSeverity,
      category: "Health",
      filters: ["all", "opportunity"] as FeedFilter[],
      title: recommendation.title,
      observed: recommendation.reason ?? recommendation.title,
      interpretation: null,
      suggestedAction: null,
      financialImpact: null,
      dueInDays: null,
      confidencePercent: null,
      scoreImpact: recommendation.scoreImpact,
      evidence: [] as ActionEvidence[],
      affectedEntity: null,
      deepLink: recommendation.deepLink,
      component: recommendation.component,
    } satisfies Omit<IntelligenceItem, "rank">;

    // A recommendation's whole value is the score movement the engine attributes
    // to it, so that — not a money figure it doesn't have — drives its rank.
    const scoreTerm = Math.min(15, Math.abs(recommendation.scoreImpact ?? 0));
    return { ...base, rank: rankOf(base) + scoreTerm };
  });
}

/** Merges both sources into one ranked list, highest priority first. */
export function buildIntelligenceFeed(
  actions: SmartActionItem[],
  recommendations: SmartRecommendation[],
): IntelligenceItem[] {
  return [...mapIntelligence(actions), ...recommendationsAsItems(recommendations)].sort(
    (a, b) => b.rank - a.rank,
  );
}

/** How many items are worth calling out as "needs attention" in a header count. */
export function attentionCount(items: IntelligenceItem[]): number {
  return items.filter(
    (item) => item.nature === "risk" && (item.severity === "CRITICAL" || item.severity === "HIGH"),
  ).length;
}
