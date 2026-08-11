import React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { FinancialChange } from "../../api/insightsMappers";
import { Money } from "../../../../components/common/Money";
import { formatPercentDelta, formatPoints } from "../../utils/insightsFormat";
import { EmptyAnalyticsState } from "../common/AnalyticsStates";

/**
 * "What changed" — five movements, each one a difference between two figures
 * the backend reported.
 *
 * The direction arrow and its colour are decided separately, because up is not
 * universally good: spending and debt rising are losses wearing the same arrow
 * that net worth rising wears. Reading the colour alone is never required —
 * the sign is in the text too.
 */
export const FinancialChangeGrid: React.FC<{ changes: FinancialChange[] }> = ({ changes }) => {
  if (changes.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No comparison available"
        message="Comparing periods needs at least two snapshots. Come back after another month of data."
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
      {changes.map((change) => {
        const value = change.points ?? Number(change.amount?.amount ?? 0);
        const rising = value > 0;
        const flat = value === 0;
        const Icon = flat ? ArrowRight : rising ? ArrowUpRight : ArrowDownRight;
        const good = flat ? null : rising === change.upIsGood;
        const tone = good === null ? "text-slate-400" : good ? "text-emerald-400" : "text-rose-400";

        const magnitude = change.points !== null
          ? formatPoints(change.points)
          : null;
        const percent = formatPercentDelta(change.percent);

        return (
          <li
            key={change.id}
            className="min-w-0 space-y-1 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
          >
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {change.label}
            </p>

            <p className={`flex items-center gap-1 text-base font-semibold tabular-nums ${tone}`}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {change.amount ? <Money value={change.amount} showSign /> : magnitude}
              </span>
            </p>

            <p className="truncate text-[11px] text-slate-500">
              {[percent, change.caption].filter(Boolean).join(" · ")}
            </p>
          </li>
        );
      })}
    </ul>
  );
};
