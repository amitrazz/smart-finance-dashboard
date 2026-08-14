import React from "react";
import { Check, TriangleAlert } from "lucide-react";
import { FinancialChange } from "../../api/insightsMappers";
import { ChangeIndicator } from "../primitives/ChangeIndicator";
import { InsightsEmptyState } from "../primitives/States";

function movementOf(change: FinancialChange): number | null {
  if (change.points !== null) return change.points;
  if (change.amount) {
    const parsed = Number(change.amount.amount);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** A movement is favourable when its direction matches the measure's polarity. */
function isFavourable(change: FinancialChange): boolean | null {
  const movement = movementOf(change);
  if (movement === null || movement === 0) return null;
  return movement > 0 === change.upIsGood;
}

const ChangeRow: React.FC<{ change: FinancialChange }> = ({ change }) => (
  <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5">
    <span className="text-xs text-slate-300">{change.label}</span>
    <ChangeIndicator
      amount={change.amount}
      percent={change.percent}
      points={change.points}
      upIsGood={change.upIsGood}
    />
  </li>
);

const Column: React.FC<{
  title: string;
  icon: React.ElementType;
  iconClass: string;
  changes: FinancialChange[];
  emptyMessage: string;
}> = ({ title, icon: Icon, iconClass, changes, emptyMessage }) => (
  <div className="min-w-0 space-y-2">
    <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-400">
      <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden="true" />
      {title}
    </h3>
    {changes.length === 0 ? (
      <p className="py-1.5 text-xs leading-relaxed text-slate-500">{emptyMessage}</p>
    ) : (
      <ul className="divide-y divide-slate-800/60">
        {changes.map((change) => (
          <ChangeRow key={change.id} change={change} />
        ))}
      </ul>
    )}
  </div>
);

/**
 * "What changed", split by whether the change was in your favour.
 *
 * The previous grid rendered five movements in a row of identical tiles and left
 * the reader to work out that debt falling was the good news and spending rising
 * was the bad. Sorting them into two columns does that work once, using the
 * polarity each movement already declares, so the answer to "did anything go
 * wrong?" is the length of the right-hand column rather than five colour
 * judgements.
 *
 * Movements of exactly zero appear in neither column: "no change" is not an
 * improvement and not a problem, and padding either column with it would inflate
 * both.
 */
export const WhatChanged: React.FC<{ changes: FinancialChange[] }> = ({ changes }) => {
  if (changes.length === 0) {
    return <InsightsEmptyState reason="insufficient-history" />;
  }

  const improved = changes.filter((change) => isFavourable(change) === true);
  const attention = changes.filter((change) => isFavourable(change) === false);

  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      <Column
        title="What improved"
        icon={Check}
        iconClass="text-emerald-400"
        changes={improved}
        emptyMessage="Nothing moved in your favour this period."
      />
      <Column
        title="What needs attention"
        icon={TriangleAlert}
        iconClass="text-amber-400"
        changes={attention}
        emptyMessage="Nothing moved against you this period."
      />
    </div>
  );
};
