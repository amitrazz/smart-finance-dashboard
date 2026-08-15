import React from "react";
import { Check, TriangleAlert } from "lucide-react";
import { FinancialChange } from "../../api/insightsMappers";
import { ChangeIndicator } from "../primitives/ChangeIndicator";
import { InsightsEmptyState } from "../primitives/States";
import { TONE_CHIP } from "../primitives/tone";
import { Money } from "../../../../components/common/Money";

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

const ChangeRow: React.FC<{ change: FinancialChange }> = ({ change }) => {
  const favourable = isFavourable(change);
  const statusLabel = favourable === true
    ? "Positive movement"
    : favourable === false
      ? (change.id === "net-worth" || change.id === "income" || change.id === "savings-rate" ? "Needs attention" : "Negative movement")
      : "No change";

  const statusTone = favourable === true
    ? "positive"
    : favourable === false
      ? (statusLabel === "Needs attention" ? "negative" : "warning")
      : "neutral";

  return (
    <li className="p-4 rounded-xl bg-slate-900/40 border border-slate-805 space-y-2 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{change.label}</span>
        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${TONE_CHIP[statusTone]}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <span className="text-lg font-extrabold text-slate-100 tabular-nums">
          {change.currentValue !== undefined && change.currentValue !== null ? (
            typeof change.currentValue === "number" ? (
              `${change.currentValue.toFixed(1)}%`
            ) : (
              <Money value={change.currentValue} fractionDigits={0} />
            )
          ) : (
            "—"
          )}
        </span>

        <ChangeIndicator
          amount={change.amount}
          percent={change.percent}
          points={change.points}
          upIsGood={change.upIsGood}
        />
      </div>
    </li>
  );
};

const Column: React.FC<{
  title: string;
  icon: React.ElementType;
  iconClass: string;
  changes: FinancialChange[];
  emptyMessage: string;
}> = ({ title, icon: Icon, iconClass, changes, emptyMessage }) => (
  <div className="min-w-0 space-y-3">
    <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
      <Icon className={`h-3.5 w-3.5 ${iconClass}`} aria-hidden="true" />
      {title}
    </h3>
    {changes.length === 0 ? (
      <p className="py-4 px-4 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-500">{emptyMessage}</p>
    ) : (
      <ul className="space-y-3">
        {changes.map((change) => (
          <ChangeRow key={change.id} change={change} />
        ))}
      </ul>
    )}
  </div>
);

function getInterpretation(changes: FinancialChange[]): string | null {
  const byId = new Map(changes.map((c) => [c.id, c]));
  const income = byId.get("income");
  const spending = byId.get("spending");
  if (!income || !spending) return null;

  const incomeVal = income.percent ?? (income.amount ? Number(income.amount.amount) : 0);
  const spendingVal = spending.percent ?? (spending.amount ? Number(spending.amount.amount) : 0);

  if (incomeVal < 0 && spendingVal < 0) {
    if (incomeVal < spendingVal) {
      return "Income declined significantly faster than spending, creating a cash-flow deficit this period.";
    } else {
      return "Spending declined faster than income, cushioning the impact of lower revenue.";
    }
  } else if (incomeVal > 0 && spendingVal > 0) {
    if (spendingVal > incomeVal) {
      return "Spending grew faster than income, putting pressure on your net cash surplus.";
    } else {
      return "Income grew faster than spending, widening your monthly cash buffer.";
    }
  }
  return null;
}

export const WhatChanged: React.FC<{ changes: FinancialChange[] }> = ({ changes }) => {
  if (changes.length === 0) {
    return <InsightsEmptyState reason="insufficient-history" />;
  }

  const improved = changes.filter((change) => isFavourable(change) === true);
  const attention = changes.filter((change) => isFavourable(change) === false);
  const interpretation = getInterpretation(changes);

  return (
    <div className="space-y-4">
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
      {interpretation && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed shadow-sm">
          <span className="font-extrabold text-indigo-400 mr-1">Interpretation:</span>
          {interpretation}
        </div>
      )}
    </div>
  );
};
