/**
 * Navigation model for the Insights workspace.
 *
 * Five top-level sections, each owning one question:
 *
 * | Section      | Answers                                        |
 * |--------------|------------------------------------------------|
 * | Overview     | How am I doing, and what needs me today?       |
 * | Health       | Why is my score what it is?                    |
 * | Analytics    | What is driving my position?                   |
 * | Intelligence | What should I know, worry about, and do?       |
 * | Reports      | Can I take this away?                          |
 *
 * The previous nav had the same five tabs but grouped by *data source* rather
 * than by question — "Financial" held health, net worth and cash flow while
 * "Analytics" held spending, income and budgets, a split no user could predict.
 * Forecast sat under "Intelligence", three clicks from the position it forecasts.
 * Here, forecasting is folded into Overview (trajectory) and Analytics (net
 * worth), because a projection is only meaningful next to the actual it extends.
 *
 * Routing rides the app's existing hash scheme — `#/insights/<section>/<view>`
 * via `useUIStore.activeSubTab`. No router is introduced.
 */
import {
  BarChart3,
  Brain,
  FileText,
  HeartPulse,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export type InsightsSectionId = "overview" | "health" | "analytics" | "intelligence" | "reports";

export interface InsightsView {
  id: string;
  label: string;
  /** One line explaining what this view is for; shown in the mobile nav. */
  hint: string;
}

export interface InsightsSection {
  id: InsightsSectionId;
  label: string;
  icon: LucideIcon;
  /** Sub-navigation. A single-view section renders no second row. */
  views: InsightsView[];
}

export const INSIGHTS_SECTIONS: InsightsSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    views: [],
  },
  {
    id: "health",
    label: "Health",
    icon: HeartPulse,
    views: [],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    views: [
      { id: "net-worth", label: "Net worth", hint: "Assets, liabilities and trajectory" },
      { id: "cash-flow", label: "Cash flow", hint: "Income against expenses each month" },
      { id: "spending", label: "Spending", hint: "Where the money went, by category and merchant" },
      { id: "income", label: "Income", hint: "Earnings and their sources" },
      { id: "budget", label: "Budget", hint: "Allocation against actual spend" },
      { id: "goals", label: "Goals", hint: "Progress and funding pace" },
      { id: "investments", label: "Investments", hint: "Valuation, returns and allocation" },
      { id: "debt", label: "Debt", hint: "Outstanding balances and repayment load" },
      { id: "subscriptions", label: "Subscriptions", hint: "Recurring commitments" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Brain,
    views: [
      { id: "actions", label: "Recommended actions", hint: "What to do next, ranked by impact" },
      { id: "risks", label: "Risks", hint: "What needs attention and why" },
      { id: "anomalies", label: "Anomalies", hint: "Behaviour that broke pattern" },
      { id: "trends", label: "Trends", hint: "Direction of travel over time" },
      { id: "ask", label: "Ask", hint: "Questions answered from your own data" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    views: [],
  },
];

export interface InsightsRoute {
  section: InsightsSectionId;
  view: string | null;
}

const DEFAULT_ROUTE: InsightsRoute = { section: "overview", view: null };

const sectionById = (id: string): InsightsSection | undefined =>
  INSIGHTS_SECTIONS.find((s) => s.id === id);

/**
 * Turns the app's `activeSubTab` string into a route.
 *
 * Unknown segments fall back rather than 404: a stale bookmark to a view that
 * no longer exists lands on that section's default instead of an error page.
 */
export function parseInsightsRoute(subTab: string | null | undefined): InsightsRoute {
  if (!subTab) return DEFAULT_ROUTE;
  const [rawSection, rawView] = subTab.split("/");

  const section = sectionById(rawSection);
  if (!section) {
    // Tolerate legacy one-level hashes (`#/insights/risks`, `#/insights/spending`)
    // that predate the section/view split, so old links keep landing somewhere sensible.
    const legacy = findViewOwner(rawSection);
    return legacy ?? DEFAULT_ROUTE;
  }

  if (section.views.length === 0) return { section: section.id, view: null };
  const view = section.views.find((v) => v.id === rawView);
  return { section: section.id, view: view?.id ?? section.views[0].id };
}

function findViewOwner(viewId: string): InsightsRoute | null {
  for (const section of INSIGHTS_SECTIONS) {
    const view = section.views.find((v) => v.id === viewId);
    if (view) return { section: section.id, view: view.id };
  }
  return LEGACY_VIEW_ALIASES[viewId] ?? null;
}

/** Sub-tabs the old workspace used, pointed at their nearest new home. */
const LEGACY_VIEW_ALIASES: Record<string, InsightsRoute> = {
  "financial-health": { section: "health", view: null },
  forecasts: { section: "analytics", view: "net-worth" },
  recommendations: { section: "intelligence", view: "actions" },
  budgets: { section: "analytics", view: "budget" },
  debts: { section: "analytics", view: "debt" },
};

/** Serialises a route back to the `activeSubTab` string. */
export function serializeInsightsRoute(route: InsightsRoute): string {
  const section = sectionById(route.section);
  if (!section || section.views.length === 0) return route.section;
  const view = section.views.find((v) => v.id === route.view) ?? section.views[0];
  return `${section.id}/${view.id}`;
}

/** Human-readable trail for the page heading, e.g. `Analytics · Net worth`. */
export function describeRoute(route: InsightsRoute): { section: string; view: string | null } {
  const section = sectionById(route.section);
  if (!section) return { section: "Overview", view: null };
  const view = section.views.find((v) => v.id === route.view);
  return { section: section.label, view: view?.label ?? null };
}
