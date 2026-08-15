import React, { useState } from "react";
import { ChevronRight, CheckCircle2, Clock, EyeOff, Calendar } from "lucide-react";
import { IntelligenceItem } from "../../api/intelligenceModel";
import { Money } from "../../../../components/common/Money";
import { formatDueIn } from "../../utils/insightsFormat";
import { TONE_CHIP, TONE_RULE } from "../primitives/tone";
import { MaskedProse } from "../primitives/MaskedProse";
import { itemBadge } from "./itemPresentation";

interface InsightCardProps {
  item: IntelligenceItem;
  onOpen: (item: IntelligenceItem) => void;
  featured?: boolean;
  onComplete?: (id: string, version: number) => void;
  onDismiss?: (id: string, version: number) => void;
  onSnooze?: (id: string, version: number, snoozedUntil: string) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  item,
  onOpen,
  featured = false,
  onComplete,
  onDismiss,
  onSnooze,
}) => {
  const badge = itemBadge(item);
  const due = formatDueIn(item.dueInDays);
  const [showSnoozePresets, setShowSnoozePresets] = useState(false);

  const handleSnooze = (days: number) => {
    if (onSnooze && item.version !== undefined) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      onSnooze(item.id, item.version, date.toISOString());
    }
    setShowSnoozePresets(false);
  };

  const isActionable = item.actionable !== false;
  const isDismissible = item.dismissible !== false;
  const version = item.version ?? 1;

  if (featured) {
    return (
      <article
        className={`rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden flex flex-col justify-between border-l-4 ${TONE_RULE[badge.tone]} shadow-xl shadow-slate-950/40`}
      >
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TONE_CHIP[badge.tone]}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-slate-500 font-medium">{item.category}</span>
            </div>
            {due && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 ${
                  (item.dueInDays ?? 1) <= 0 ? "text-rose-400" : "text-amber-400"
                }`}
              >
                {due}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold leading-snug text-slate-50 hover:text-indigo-300 transition-colors cursor-pointer" onClick={() => onOpen(item)}>
              {item.title}
            </h3>
            {item.observed !== item.title && (
              <p className="text-sm leading-relaxed text-slate-400">
                <MaskedProse text={item.observed} />
              </p>
            )}
            {item.suggestedAction && (
              <p className="text-sm font-medium leading-relaxed text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800/40">
                <span className="text-indigo-400 font-bold mr-1">Recommendation:</span>
                <MaskedProse text={item.suggestedAction} />
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
            {item.financialImpact && (
              <span className="font-semibold tabular-nums text-slate-100 flex items-center gap-1">
                <span>Amount:</span>
                <Money value={item.financialImpact} fractionDigits={0} />
              </span>
            )}
            {item.scoreImpact !== null && item.scoreImpact !== 0 && (
              <span className="tabular-nums text-slate-400 flex items-center gap-1">
                <span>Score impact:</span>
                <span className={item.scoreImpact > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {item.scoreImpact > 0 ? "+" : ""}
                  {item.scoreImpact} pts
                </span>
              </span>
            )}
            {item.evidence.length > 0 && (
              <span className="text-slate-500">
                {item.evidence.length} measured {item.evidence.length === 1 ? "figure" : "figures"}
              </span>
            )}
          </div>
        </div>

        {/* Action mutations bar */}
        <div className="bg-slate-900/60 px-5 py-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isActionable && onComplete && (
              <button
                type="button"
                onClick={() => onComplete(item.id, version)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Complete</span>
              </button>
            )}

            {onSnooze && (
              <div className="relative">
                {showSnoozePresets ? (
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-950/90 border border-slate-800 p-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleSnooze(1)}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      1d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(3)}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      3d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSnooze(7)}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 font-bold cursor-pointer"
                    >
                      7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSnoozePresets(false)}
                      className="px-1.5 py-1 rounded text-rose-400 hover:bg-rose-500/10 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSnoozePresets(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Snooze</span>
                  </button>
                )}
              </div>
            )}

            {isDismissible && onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(item.id, version)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-855 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-300 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Dismiss</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpen(item)}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <span>View context</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    );
  }

  // Non-featured (standard list item) - keeping outer button structure but also rendering inline action indicators if needed
  return (
    <article className={`border-l-2 ${TONE_RULE[badge.tone]}`}>
      <div
        className="group flex w-full items-start gap-3 rounded-r-lg border border-l-0 border-slate-800/70 bg-slate-950/30 text-left transition-colors hover:border-slate-700 hover:bg-slate-900/50 px-4 py-3"
      >
        <div className="min-w-0 flex-1 space-y-1.5 cursor-pointer" onClick={() => onOpen(item)}>
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

          <h3 className="font-semibold leading-snug text-slate-100 text-sm">
            {item.title}
          </h3>

          {item.observed !== item.title && (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
              <MaskedProse text={item.observed} />
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-[11px]">
            {item.financialImpact && (
              <span className="font-semibold tabular-nums text-slate-100">
                <Money value={item.financialImpact} fractionDigits={0} />
              </span>
            )}
            {item.scoreImpact !== null && item.scoreImpact !== 0 && (
              <span className="tabular-nums text-slate-500">
                {item.scoreImpact > 0 ? "+" : ""}
                {item.scoreImpact} pts to health
              </span>
            )}
            {item.evidence.length > 0 && (
              <span className="text-slate-500">
                {item.evidence.length} fig{item.evidence.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(item)}
          className="self-center p-1 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
          aria-label="Open detail drawer"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
