import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { FinancePlanProgress } from "../../../../types";
import { formatCurrency, formatPercent } from "../../../../utils/formatters";

/**
 * Every field but `status` is `null` unless the plan has a `VERIFIED`
 * `CREATE_GOAL` action (docs/20-finance-plans.md) — that's "not tracked
 * yet," not zero progress, so this renders a plain explanatory state rather
 * than a 0%-filled progress bar in that case.
 */
export const PlanProgressWidget: React.FC<{ progress: FinancePlanProgress }> = ({ progress }) => {
  if (progress.currentAmount === null || progress.progressPercent === null || progress.targetAmount === null) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-500">
        Progress isn't tracked yet — this shows up once the plan has executed a verified goal.
      </div>
    );
  }

  const percent = Math.min(100, Math.max(0, Number(progress.progressPercent)));
  const onTrack = progress.onTrack ?? true;

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {formatCurrency(progress.currentAmount)} of {formatCurrency(progress.targetAmount)}
        </span>
        <span className="font-semibold text-slate-200">{formatPercent(progress.progressPercent, 0).replace("+", "")}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full ${onTrack ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {progress.expectedProgressPercent !== null && (
        <div
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${onTrack ? "text-emerald-400" : "text-amber-400"}`}
        >
          {onTrack ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
          {onTrack ? "On track" : "Behind expected pace"} — expected{" "}
          {formatPercent(progress.expectedProgressPercent, 0).replace("+", "")}
        </div>
      )}
    </div>
  );
};

export default PlanProgressWidget;
