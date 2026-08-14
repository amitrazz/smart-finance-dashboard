import React from "react";
import { ChevronRight } from "lucide-react";
import { IntelligenceItem } from "../../api/intelligenceModel";
import { Money } from "../../../../components/common/Money";
import { formatDueIn } from "../../utils/insightsFormat";
import { TONE_CHIP, TONE_RULE } from "../primitives/tone";
import { MaskedProse } from "../primitives/MaskedProse";
import { itemBadge } from "./itemPresentation";

interface InsightCardProps {
  item: IntelligenceItem;
  onOpen: (item: IntelligenceItem) => void;
  /** Feature form: bigger type and the suggested action inline. Used for the single next action on Overview. */
  featured?: boolean;
}

/**
 * One finding in the feed.
 *
 * The whole card is the control that opens the detail, rather than a card with a
 * "View" button in the corner — the previous cards put an action button on every
 * row, which made a list of ten findings a wall of twenty competing targets.
 *
 * What it shows is deliberately the *observation*, not the interpretation: the
 * rule's concrete comparison ("interest is 24% above your 3-month average") is
 * what earns trust, and it is what the reader needs to decide whether to open
 * the detail at all.
 */
export const InsightCard: React.FC<InsightCardProps> = ({ item, onOpen, featured = false }) => {
  const badge = itemBadge(item);
  const due = formatDueIn(item.dueInDays);

  return (
    <article className={`border-l-2 ${TONE_RULE[badge.tone]}`}>
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`${badge.label}: ${item.title}. Open detail.`}
        className={`group flex w-full items-start gap-3 rounded-r-lg border border-l-0 border-slate-800/70 bg-slate-950/30 text-left transition-colors hover:border-slate-700 hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/60 ${
          featured ? "px-4 py-4 sm:px-5" : "px-4 py-3"
        }`}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CHIP[badge.tone]}`}
            >
              {badge.label}
            </span>
            <span className="text-[11px] text-slate-500">{item.category}</span>
            {due && (
              <span
                className={`text-[11px] font-medium ${
                  (item.dueInDays ?? 1) <= 0 ? "text-rose-400" : "text-amber-400"
                }`}
              >
                {due}
              </span>
            )}
          </div>

          <h3
            className={`font-medium leading-snug text-slate-100 ${featured ? "text-base" : "text-sm"}`}
          >
            {item.title}
          </h3>

          {/*
            Health recommendations carry no separate reason, so `observed` falls
            back to the title — and visual QA found the card printing the same
            sentence twice, once as a heading and once as body copy. Say it once.
          */}
          {item.observed !== item.title && (
            <p
              className={`leading-relaxed text-slate-400 ${featured ? "text-sm" : "line-clamp-2 text-xs"}`}
            >
              <MaskedProse text={item.observed} />
            </p>
          )}

          {featured && item.suggestedAction && (
            <p className="text-sm leading-relaxed text-slate-300">
              <MaskedProse text={item.suggestedAction} />
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
            {item.financialImpact && (
              <span className="text-sm font-semibold tabular-nums text-slate-100">
                <Money value={item.financialImpact} fractionDigits={0} />
              </span>
            )}
            {item.scoreImpact !== null && (
              <span className="text-[11px] tabular-nums text-slate-500">
                {item.scoreImpact > 0 ? "+" : ""}
                {item.scoreImpact} pts to health score
              </span>
            )}
            {item.evidence.length > 0 && (
              <span className="text-[11px] text-slate-500">
                {item.evidence.length} measured {item.evidence.length === 1 ? "figure" : "figures"}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-700 transition-colors group-hover:text-slate-400"
          aria-hidden="true"
        />
      </button>
    </article>
  );
};
