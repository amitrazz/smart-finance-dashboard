/**
 * The one place that decides where an Insights item sends you.
 *
 * Insights aggregates and interprets; it does not own domain workflows. A card
 * saying "credit utilisation is high" must hand off to Credit Cards, not grow a
 * card-management UI of its own. That handoff needs a single resolver for three
 * reasons:
 *
 * 1. **Backend strings are not routes.** `deepLink` arrives as a loose token —
 *    sometimes a bare tab name, sometimes hash-prefixed, sometimes a server
 *    path. The previous code cast it straight to `NavTab` and called
 *    `setActiveTab(recommendation.actionRoute as NavTab)`, so an unrecognised
 *    value silently navigated the app to a tab that doesn't exist and rendered
 *    the dashboard fallback. Worse, the mapper wrote a magic
 *    `"#insights/recommendations"` sentinel into the DTO and the card
 *    string-compared against it.
 * 2. **Not every item has a link.** Resolution returns `null` rather than
 *    inventing a destination, and callers render no button. A dead-end button
 *    is worse than no button.
 * 3. **Ownership is documented in one file.** When Planning absorbs another
 *    domain, one table changes.
 *
 * Resolution order is most-specific-first: an explicit backend link beats a
 * health-dimension guess, which beats a category guess.
 */
import { NavTab, VALID_TABS } from "../../../store/useUIStore";

export interface ResolvedAction {
  tab: NavTab;
  subTab: string | null;
  /** Button copy naming the destination, e.g. "Open Loans & Debt". */
  label: string;
}

interface Destination {
  tab: NavTab;
  subTab?: string;
  label: string;
}

/**
 * Canonical destinations, labelled by *intent* rather than by address.
 *
 * "Open Transactions" names a place; "Review spending" names the thing the user
 * came here to do, and the place is an implementation detail of doing it. A
 * button that says what will be accomplished is also the difference between a
 * card someone acts on and one they scroll past — "View details" is the
 * degenerate case and appears nowhere.
 *
 * The verb stays neutral ("Review", not "Reduce", "Fix" or "Cut"): Insights
 * reports and hands off, and instructing someone to reduce a category the
 * backend merely flagged would be advice this workspace has no standing to give.
 */
const DESTINATIONS = {
  accounts: { tab: "accounts", label: "Review accounts" },
  transactions: { tab: "transactions", label: "Review spending" },
  creditCards: { tab: "credit-cards", label: "Review credit card" },
  loans: { tab: "loans", label: "Review debt" },
  investments: { tab: "investments", label: "Review portfolio" },
  goals: { tab: "planning", subTab: "goals", label: "Review goals" },
  budgets: { tab: "planning", subTab: "budgets", label: "Review budget" },
  planning: { tab: "planning", label: "Review plan" },
  calendar: { tab: "notifications", label: "Review upcoming payments" },
  imports: { tab: "imports", label: "Import a statement" },
  settings: { tab: "settings", label: "Open settings" },
} satisfies Record<string, Destination>;

/**
 * Backend `deepLink` tokens → destinations.
 *
 * Keys are matched after normalisation (lowercased, `#`/`/`/`finance` prefixes
 * stripped), so `"loans"`, `"#/loans"` and `"/finance/loans"` all land here.
 */
const DEEP_LINK_MAP: Record<string, Destination> = {
  accounts: DESTINATIONS.accounts,
  "accounts-cash": DESTINATIONS.accounts,
  transactions: DESTINATIONS.transactions,
  expenses: DESTINATIONS.transactions,
  "credit-cards": DESTINATIONS.creditCards,
  cards: DESTINATIONS.creditCards,
  credit: DESTINATIONS.creditCards,
  loans: DESTINATIONS.loans,
  debt: DESTINATIONS.loans,
  liabilities: DESTINATIONS.loans,
  investments: DESTINATIONS.investments,
  portfolio: DESTINATIONS.investments,
  goals: DESTINATIONS.goals,
  budgets: DESTINATIONS.budgets,
  planning: DESTINATIONS.planning,
  notifications: DESTINATIONS.calendar,
  calendar: DESTINATIONS.calendar,
  imports: DESTINATIONS.imports,
  settings: DESTINATIONS.settings,
};

/** Health dimension code → where that dimension is actually improved. */
const DIMENSION_MAP: Record<string, Destination> = {
  CASH_FLOW: DESTINATIONS.accounts,
  SAVINGS_RATE: DESTINATIONS.budgets,
  EMERGENCY_FUND: DESTINATIONS.goals,
  DEBT_HEALTH: DESTINATIONS.loans,
  CREDIT_UTILIZATION: DESTINATIONS.creditCards,
  INVESTMENT_DIVERSIFICATION: DESTINATIONS.investments,
  BILL_DISCIPLINE: DESTINATIONS.calendar,
  SPENDING_DISCIPLINE: DESTINATIONS.transactions,
};

/** Risk category label (as produced by `mapRisks`) → destination. */
const CATEGORY_MAP: Record<string, Destination> = {
  Overspending: DESTINATIONS.transactions,
  "Cash flow": DESTINATIONS.accounts,
  Credit: DESTINATIONS.creditCards,
  Investments: DESTINATIONS.investments,
  Savings: DESTINATIONS.budgets,
  Goals: DESTINATIONS.goals,
};

function normalizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .replace(/^finance\//, "")
    .split(/[/?]/)[0];
}

function toResolved(destination: Destination): ResolvedAction {
  return { tab: destination.tab, subTab: destination.subTab ?? null, label: destination.label };
}

export interface ActionRouteContext {
  /** Raw backend deep-link token, if the item carried one. */
  deepLink?: string | null;
  /** Health dimension code, e.g. `EMERGENCY_FUND`. */
  component?: string | null;
  /** Risk category label produced by the risk mapper. */
  category?: string | null;
}

/**
 * Resolves an item to an in-app destination, or `null` when nothing sensible
 * exists. Callers must treat `null` as "render no action button".
 */
export function resolveActionRoute(context: ActionRouteContext): ResolvedAction | null {
  const { deepLink, component, category } = context;

  if (deepLink) {
    const token = normalizeToken(deepLink);
    const mapped = DEEP_LINK_MAP[token];
    if (mapped) return toResolved(mapped);
    // A token that happens to be a real tab is still usable; anything else is
    // discarded rather than navigated to on faith.
    if ((VALID_TABS as string[]).includes(token)) {
      // A bare "Open" is the "View details" of this resolver: it names neither
      // the place nor the intent. Naming the section at least tells the reader
      // where a click lands.
      return { tab: token as NavTab, subTab: null, label: `Review ${token.replace(/-/g, " ")}` };
    }
  }

  if (component && DIMENSION_MAP[component]) return toResolved(DIMENSION_MAP[component]);
  if (category && CATEGORY_MAP[category]) return toResolved(CATEGORY_MAP[category]);

  return null;
}
