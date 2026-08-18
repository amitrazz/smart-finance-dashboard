import React from "react";
import { AlertTriangle, CheckCircle2, Star } from "lucide-react";
import type { FinancePlanCandidate } from "../../../../types";
import { Money } from "../../../../components/common/Money";

/**
 * One of the three fixed timeline candidates (`aggressive`/`balanced`/
 * `conservative`). `meetsMinimumBuffer`/`feasible`/`constraintViolations`
 * are pre-computed by the backend — this never re-derives affordability by
 * comparing `requiredMonthlyContribution` to surplus itself (per the
 * backend team's own checklist).
 */
export const PlanCandidateCard: React.FC<{
  candidate: FinancePlanCandidate;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ candidate, isRecommended, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
        isSelected
          ? "border-blue-500/50 bg-blue-500/5"
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-100">{candidate.label}</span>
        {isRecommended && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            <Star className="h-3 w-3" aria-hidden="true" />
            Recommended
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-slate-500">Monthly contribution</span>
          <Money value={candidate.requiredMonthlyContribution} className="text-sm font-semibold text-slate-100" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-slate-500">Timeline</span>
          <span className="text-xs text-slate-300">{candidate.monthsRemaining} months</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-slate-500">Surplus left over</span>
          <Money value={candidate.surplusAfterContribution} className="text-xs text-slate-300" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.feasible ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Feasible
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Not feasible
          </span>
        )}
        {!candidate.meetsMinimumBuffer && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Thin buffer
          </span>
        )}
      </div>

      {candidate.constraintViolations.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[10px] text-rose-300/90">
          {candidate.constraintViolations.map((violation, index) => (
            <li key={index}>• {violation}</li>
          ))}
        </ul>
      )}
    </button>
  );
};

export default PlanCandidateCard;
