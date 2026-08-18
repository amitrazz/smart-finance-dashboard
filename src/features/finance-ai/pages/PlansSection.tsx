import React, { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { FinancePlanStatus } from "../../../types";
import { useFinancePlans } from "../hooks/useFinancePlanQueries";
import { PlanCard } from "../components/plans/PlanCard";
import { PlanDetailView } from "../components/plans/PlanDetailView";
import { PlanGenerateModal } from "../components/plans/PlanGenerateModal";
import { AiErrorState } from "../components/conversation/AiErrorState";

type PlanFilter = "all" | "review" | "active" | "past";

const FILTER_STATUSES: Record<PlanFilter, FinancePlanStatus[] | undefined> = {
  all: undefined,
  review: ["READY_FOR_REVIEW"],
  active: ["ACCEPTED", "REVALIDATING", "EXECUTING", "ACTIVE"],
  past: ["DECLINED", "CANCELLED", "STALE", "FAILED", "EXECUTION_PARTIAL", "MODIFICATION_REQUESTED", "EXPIRED", "COMPLETED"],
};

const FILTERS: { id: PlanFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "review", label: "Awaiting review" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
];

/**
 * Finance Plans — the propose → review → accept/decline lifecycle
 * (docs/20-finance-plans.md). This is the only surface in the app where an
 * AI-triggered financial mutation is possible, and only ever after explicit
 * user acceptance — `PlanDetailView` is where that confirmation lives.
 */
export const PlansSection: React.FC<{
  detailId: string | null;
  onSelectPlan: (planId: string) => void;
  onBackFromDetail: () => void;
}> = ({ detailId, onSelectPlan, onBackFromDetail }) => {
  const [filter, setFilter] = useState<PlanFilter>("all");
  const [generateOpen, setGenerateOpen] = useState(false);

  if (detailId) {
    return <PlanDetailView planId={detailId} onBack={onBackFromDetail} />;
  }

  return (
    <PlansListView
      filter={filter}
      onFilterChange={setFilter}
      onSelectPlan={onSelectPlan}
      onOpenGenerate={() => setGenerateOpen(true)}
      generateOpen={generateOpen}
      onCloseGenerate={() => setGenerateOpen(false)}
    />
  );
};

const PlansListView: React.FC<{
  filter: PlanFilter;
  onFilterChange: (f: PlanFilter) => void;
  onSelectPlan: (planId: string) => void;
  onOpenGenerate: () => void;
  generateOpen: boolean;
  onCloseGenerate: () => void;
}> = ({ filter, onFilterChange, onSelectPlan, onOpenGenerate, generateOpen, onCloseGenerate }) => {
  const statuses = FILTER_STATUSES[filter];
  const plansQuery = useFinancePlans();

  const plans = useMemo(() => {
    const all = plansQuery.data?.data ?? [];
    return statuses ? all.filter((p) => statuses.includes(p.status)) : all;
  }, [plansQuery.data, statuses]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100">AI plans</h2>
          <p className="text-xs text-slate-500">
            Propose a plan, review it, and decide — nothing changes in your accounts until you accept.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onOpenGenerate}>
          Generate a plan
        </Button>
      </div>

      <div role="tablist" aria-label="Filter plans" className="inline-flex items-center gap-0.5 rounded-lg border border-slate-800/80 bg-slate-900/40 p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => onFilterChange(f.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id ? "border border-slate-700/60 bg-slate-800 text-slate-50" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {plansQuery.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
          ))}
        </div>
      ) : plansQuery.isError ? (
        <AiErrorState error={plansQuery.error} onRetry={() => plansQuery.refetch()} />
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-800 py-12 text-center">
          <Sparkles className="h-8 w-8 text-slate-700" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">No plans here yet</p>
            <p className="text-xs text-slate-500">Generate a plan to see a proposed savings timeline.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onOpen={() => onSelectPlan(plan.id)} />
          ))}
        </div>
      )}

      <PlanGenerateModal isOpen={generateOpen} onClose={onCloseGenerate} onGenerated={onSelectPlan} />
    </div>
  );
};

export default PlansSection;
