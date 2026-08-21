import React from "react";
import { ChevronRight } from "lucide-react";
import type { FinancePlan } from "../../../../types";
import { Money } from "../../../../components/common/Money";
import { formatDate } from "../../../../utils/formatters";
import { PlanStatusBadge } from "./PlanStatusBadge";

/** Goal candidates show a monthly-contribution/timeline summary; the two CREATE_BUDGET objectives show their own headline figure instead. */
function SummaryLine({ plan }: { plan: FinancePlan }): React.ReactElement {
  const candidate = plan.projections;
  if ("monthsRemaining" in candidate) {
    return (
      <>
        <span>
          <Money value={candidate.requiredMonthlyContribution} className="font-medium text-slate-400" /> / month
        </span>
        <span>{candidate.monthsRemaining} months</span>
      </>
    );
  }
  if ("categoryReductions" in candidate) {
    return (
      <span>
        <Money value={candidate.totalMonthlySavings} className="font-medium text-slate-400" /> saved / month
      </span>
    );
  }
  return (
    <span>
      <Money value={candidate.totalBudget} className="font-medium text-slate-400" /> total budget
    </span>
  );
}

export const PlanCard: React.FC<{ plan: FinancePlan; onOpen: () => void }> = ({ plan, onOpen }) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left transition-colors hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <PlanStatusBadge status={plan.status} />
          <span className="text-[11px] text-slate-600">v{plan.version}</span>
        </div>
        <p className="truncate text-sm font-semibold text-slate-100">{plan.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          <SummaryLine plan={plan} />
          <span>Created {formatDate(plan.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
    </button>
  );
};

export default PlanCard;
