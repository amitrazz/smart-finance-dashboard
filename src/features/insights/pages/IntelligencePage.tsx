import React, { useMemo, useState } from "react";
import { InsightsRoute } from "../insightsNav";
import { useIntelligenceFeed } from "../hooks/useInsightsQueries";
import {
  useCompleteAction,
  useDismissAction,
  useSnoozeAction,
} from "../../actions/hooks/useSmartActions";
import {
  FEED_FILTERS,
  FeedFilter,
  IntelligenceItem,
  attentionCount,
} from "../api/intelligenceModel";
import { InsightCard } from "../components/intelligence/InsightCard";
import { InsightDetail } from "../components/intelligence/InsightDetail";
import { SectionHeader } from "../components/primitives/SectionHeader";
import { Surface } from "../components/primitives/Surface";
import {
  FeedSkeleton,
  InsightsEmptyState,
  InsightsErrorState,
} from "../components/primitives/States";
import { AskSection } from "./intelligence/AskSection";
import { AssistantPage } from "../../finance-ai/pages/AssistantPage";

type IntelligenceTab = "feed" | "ask" | "assistant";

/**
 * Intelligence: one ranked feed, and a way to ask a question of your own.
 *
 * What this replaces: four sub-views — Recommended actions, Risks, Anomalies,
 * Trends — each with its own list, its own sort and its own card shape. Nothing
 * in that arrangement told a reader which of the four lists to open first, and a
 * ₹50 uncategorised transaction in one looked exactly as urgent as a ₹42,000
 * balance accruing interest in another.
 *
 * They are one list now, ranked by `rankOf` (amount at stake, urgency, detection
 * confidence, actionability). Trends left entirely: a chart of income against
 * expenses over time is analytics, and Analytics → Cash flow already draws it —
 * two clicks from here and one from Overview.
 *
 * Ordering and grouping are the only things done client-side. Detection, dedupe
 * and dismissal belong to the Smart Action lifecycle on the backend, and nothing
 * here simulates any of them.
 */
export const IntelligencePage: React.FC<{
  view: string | null;
  onNavigate: (route: InsightsRoute) => void;
}> = ({ view, onNavigate }) => {
  // The tab is the route, not local state: Ask stays linkable and the browser's
  // back button steps out of it the way it does everywhere else in the app.
  const tab: IntelligenceTab = view === "ask" ? "ask" : view === "assistant" ? "assistant" : "feed";

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Intelligence views"
        className="inline-flex items-center gap-0.5 rounded-lg border border-slate-800/80 bg-slate-900/40 p-0.5"
      >
        {(
          [
            { id: "feed", label: "What needs attention" },
            { id: "ask", label: "Ask" },
            { id: "assistant", label: "Assistant" },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={tab === option.id}
            onClick={() => onNavigate({ section: "intelligence", view: option.id })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
              tab === option.id
                ? "border border-slate-700/60 bg-slate-800 text-slate-50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "ask" ? <AskSection /> : tab === "assistant" ? <AssistantPage /> : <IntelligenceFeed />}
    </div>
  );
};

// ---------------------------------------------------------------------------

const IntelligenceFeed: React.FC = () => {
  const feed = useIntelligenceFeed();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [openItem, setOpenItem] = useState<IntelligenceItem | null>(null);

  const dismissMutation = useDismissAction();
  const completeMutation = useCompleteAction();
  const snoozeMutation = useSnoozeAction();

  // Memoised so the empty-list fallback doesn't create a new array identity on
  // every render and invalidate the two derivations below with it.
  const items = useMemo(() => feed.data ?? [], [feed.data]);

  // Only chips that would return something are offered. A filter row where six
  // of ten options lead to "nothing matches" teaches people not to use it.
  const availableFilters = useMemo(
    () =>
      FEED_FILTERS.map((chip) => ({
        ...chip,
        count:
          chip.id === "all"
            ? items.length
            : items.filter((item) => item.filters.includes(chip.id)).length,
      })).filter((chip) => chip.count > 0),
    [items],
  );

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.filters.includes(filter))),
    [items, filter],
  );

  const attention = attentionCount(items);

  return (
    <Surface>
      <section className="space-y-4 p-4 sm:p-5" aria-label="Financial intelligence">
        <SectionHeader
          title={
            feed.isLoading
              ? "Financial intelligence"
              : attention > 0
                ? `${attention} thing${attention === 1 ? "" : "s"} deserve${attention === 1 ? "" : "s"} your attention`
                : "Financial intelligence"
          }
          description="Everything detected against your accounts and everything the health engine suggests, in one list, highest priority first."
        />

        {feed.isLoading ? (
          <FeedSkeleton rows={4} />
        ) : feed.isError ? (
          <InsightsErrorState onRetry={feed.refetch} />
        ) : items.length === 0 ? (
          <InsightsEmptyState
            reason="no-data"
            title="Nothing needs your attention"
            message="No rule has flagged anything against your accounts, cards, loans or goals, and the health engine has no open suggestions."
          />
        ) : (
          <>
            <div
              role="group"
              aria-label="Filter intelligence"
              className="flex flex-wrap items-center gap-1.5"
            >
              {availableFilters.map((chip) => {
                const isActive = chip.id === filter;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setFilter(chip.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
                      isActive
                        ? "border-slate-600 bg-slate-800 text-slate-100"
                        : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {chip.label}
                    <span className="tabular-nums text-slate-500">{chip.count}</span>
                  </button>
                );
              })}
            </div>

            {visible.length === 0 ? (
               <InsightsEmptyState
                 reason="no-match"
                 action={{ label: "Clear filter", onClick: () => setFilter("all") }}
               />
            ) : (
              <ul className="space-y-2">
                {visible.map((item) => (
                  <li key={item.id}>
                    <InsightCard
                      item={item}
                      onOpen={setOpenItem}
                      onComplete={(id, version) => completeMutation.mutate({ id, version })}
                      onDismiss={(id, version) => dismissMutation.mutate({ id, version })}
                      onSnooze={(id, version, snoozedUntil) =>
                        snoozeMutation.mutate({ id, version, snoozedUntil })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <InsightDetail
          item={openItem}
          onClose={() => setOpenItem(null)}
          onComplete={(id, version) => completeMutation.mutate({ id, version })}
          onDismiss={(id, version) => dismissMutation.mutate({ id, version })}
          onSnooze={(id, version, snoozedUntil) =>
            snoozeMutation.mutate({ id, version, snoozedUntil })
          }
        />
      </section>
    </Surface>
  );
};
