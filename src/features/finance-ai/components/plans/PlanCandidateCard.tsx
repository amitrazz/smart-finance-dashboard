import React from "react";
import { AlertTriangle, CheckCircle2, Star } from "lucide-react";
import type {
  BudgetOrganizationPlanCandidate,
  FinancePlanCandidate,
  GoalPlanCandidate,
  SpendingReductionPlanCandidate,
} from "../../../../types";
import { Money } from "../../../../components/common/Money";

const isGoalCandidate = (c: FinancePlanCandidate): c is GoalPlanCandidate => "monthsRemaining" in c;
const isSpendingReductionCandidate = (c: FinancePlanCandidate): c is SpendingReductionPlanCandidate =>
  "categoryReductions" in c;
const isBudgetOrganizationCandidate = (c: FinancePlanCandidate): c is BudgetOrganizationPlanCandidate =>
  "allocations" in c;

const CardShell: React.FC<{
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
  label: string;
  children: React.ReactNode;
  violations: string[];
}> = ({ isRecommended, isSelected, onSelect, label, children, violations }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
      isSelected ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-semibold text-slate-100">{label}</span>
      {isRecommended && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
          <Star className="h-3 w-3" aria-hidden="true" />
          Recommended
        </span>
      )}
    </div>

    {children}

    {violations.length > 0 && (
      <ul className="mt-2 space-y-0.5 text-[10px] text-rose-300/90">
        {violations.map((violation, index) => (
          <li key={index}>• {violation}</li>
        ))}
      </ul>
    )}
  </button>
);

/**
 * One of a plan's ranked candidates. The shape depends on the plan's
 * objective — goal candidates carry a timeline/contribution,
 * spending-reduction candidates carry per-category cuts, budget-
 * organization candidates carry per-category allocations. Every
 * pre-computed flag (`feasible`/`meetsMinimumBuffer`/`constraintViolations`)
 * is rendered as-is, never re-derived client-side.
 */
export const PlanCandidateCard: React.FC<{
  candidate: FinancePlanCandidate;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ candidate, isRecommended, isSelected, onSelect }) => {
  if (isGoalCandidate(candidate)) {
    return (
      <CardShell
        isRecommended={isRecommended}
        isSelected={isSelected}
        onSelect={onSelect}
        label={candidate.label}
        violations={candidate.constraintViolations}
      >
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
      </CardShell>
    );
  }

  if (isSpendingReductionCandidate(candidate)) {
    return (
      <CardShell
        isRecommended={isRecommended}
        isSelected={isSelected}
        onSelect={onSelect}
        label={candidate.label}
        violations={candidate.constraintViolations}
      >
        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500">Cuts spend by</span>
            <span className="text-sm font-semibold text-slate-100">{Math.round(candidate.reductionPercentage * 100)}%</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500">Monthly savings</span>
            <Money value={candidate.totalMonthlySavings} className="text-sm font-semibold text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500">Categories</span>
            <span className="text-xs text-slate-300">{candidate.categoryReductions.length}</span>
          </div>
        </div>
      </CardShell>
    );
  }

  if (isBudgetOrganizationCandidate(candidate)) {
    return (
      <CardShell
        isRecommended={isRecommended}
        isSelected={isSelected}
        onSelect={onSelect}
        label={candidate.label}
        violations={candidate.constraintViolations}
      >
        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500">Total budget</span>
            <Money value={candidate.totalBudget} className="text-sm font-semibold text-slate-100" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-slate-500">Categories</span>
            <span className="text-xs text-slate-300">{candidate.allocations.length}</span>
          </div>
        </div>
      </CardShell>
    );
  }

  return null;
};

export default PlanCandidateCard;
