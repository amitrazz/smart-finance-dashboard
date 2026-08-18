import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { FinancePlan } from "../../../../types";
import { Button } from "../../../../components/ui/Button";
import { ConfirmModal } from "../../../../components/common/ConfirmModal";
import { Money } from "../../../../components/common/Money";
import { formatDate, formatPercent } from "../../../../utils/formatters";
import { MarkdownLite } from "../../utils/markdownLite";
import {
  canAcceptOrDeclinePlan,
  canCancelPlan,
  canRevisePlan,
  isPlanBeingExecuted,
} from "../../utils/planStatus";
import {
  useAcceptFinancePlan,
  useCancelFinancePlan,
  useDeclineFinancePlan,
  useFinancePlan,
  useFinancePlanProgress,
  useReviseFinancePlan,
} from "../../hooks/useFinancePlanQueries";
import { PlanStatusBadge } from "./PlanStatusBadge";
import { PlanCandidateCard } from "./PlanCandidateCard";
import { PlanActionPreview } from "./PlanActionPreview";
import { PlanProgressWidget } from "./PlanProgressWidget";
import { AiErrorState } from "../conversation/AiErrorState";

const PROGRESS_ELIGIBLE_STATUSES = new Set(["ACTIVE", "EXECUTION_PARTIAL", "COMPLETED"]);

export const PlanDetailView: React.FC<{ planId: string; onBack: () => void }> = ({ planId, onBack }) => {
  const planQuery = useFinancePlan(planId);
  const acceptMutation = useAcceptFinancePlan();
  const declineMutation = useDeclineFinancePlan();
  const cancelMutation = useCancelFinancePlan();
  const reviseMutation = useReviseFinancePlan();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const progressEnabled = Boolean(planQuery.data && PROGRESS_ELIGIBLE_STATUSES.has(planQuery.data.status));
  const progressQuery = useFinancePlanProgress(planId, { enabled: progressEnabled });

  if (planQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />;
  }
  if (planQuery.isError || !planQuery.data) {
    return <AiErrorState error={planQuery.error} onRetry={() => planQuery.refetch()} />;
  }

  const plan: FinancePlan = planQuery.data;
  const selectedCandidate =
    plan.alternatives.find((c) => c.id === (selectedCandidateId ?? plan.projections.id)) ?? plan.projections;

  const isExecuting = isPlanBeingExecuted(plan.status);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to plans
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <PlanStatusBadge status={plan.status} />
            <span className="text-[11px] text-slate-600">Version {plan.version}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">{plan.title}</h2>
          <p className="text-xs text-slate-500">
            Based on your data as of {formatDate(plan.basedOnDataAt)} · expires {formatDate(plan.expiresAt)}
          </p>
        </div>
      </div>

      {plan.narrative && (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <MarkdownLite text={plan.narrative.objectiveFraming} className="text-sm text-slate-200" />
          <MarkdownLite text={plan.narrative.riskNarrative} className="text-xs text-slate-400" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BaselineStat label="Monthly income" value={<Money value={{ amount: plan.baseline.monthlyIncome, currency: plan.baseline.currency }} />} />
        <BaselineStat label="Monthly expenses" value={<Money value={{ amount: plan.baseline.monthlyExpenses, currency: plan.baseline.currency }} />} />
        <BaselineStat label="Monthly surplus" value={<Money value={{ amount: plan.baseline.monthlySurplus, currency: plan.baseline.currency }} />} />
        <BaselineStat label="Savings rate" value={formatPercent(Number(plan.baseline.savingsRate) * 100, 0).replace("+", "")} />
      </div>

      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline options</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {plan.alternatives.map((candidate) => (
            <PlanCandidateCard
              key={candidate.id}
              candidate={candidate}
              isRecommended={candidate.id === plan.projections.id}
              isSelected={candidate.id === selectedCandidate.id}
              onSelect={() => setSelectedCandidateId(candidate.id)}
            />
          ))}
        </div>
        {plan.narrative?.tradeoffSummaries.find((t) => t.candidateId === selectedCandidate.id) && (
          <p className="text-xs text-slate-500">
            {plan.narrative.tradeoffSummaries.find((t) => t.candidateId === selectedCandidate.id)?.summary}
          </p>
        )}
      </div>

      {progressEnabled && progressQuery.data && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</h3>
          <PlanProgressWidget progress={progressQuery.data} />
        </div>
      )}

      {plan.actions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {plan.status === "READY_FOR_REVIEW" ? "What this plan will do" : "Actions"}
          </h3>
          <div className="space-y-2">
            {plan.actions
              .slice()
              .sort((a, b) => a.sequence - b.sequence)
              .map((action) => (
                <PlanActionPreview key={action.id} action={action} />
              ))}
          </div>
        </div>
      )}

      {acceptMutation.isError && <AiErrorState error={acceptMutation.error} />}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
        {canAcceptOrDeclinePlan(plan.status) && (
          <>
            <Button onClick={() => setConfirmOpen(true)} disabled={isExecuting || acceptMutation.isPending} isLoading={acceptMutation.isPending}>
              Accept plan
            </Button>
            <Button
              variant="neutral"
              hierarchy="outline"
              disabled={declineMutation.isPending}
              isLoading={declineMutation.isPending}
              onClick={() => declineMutation.mutate({ id: plan.id })}
            >
              Decline
            </Button>
          </>
        )}
        {canRevisePlan(plan.status) && (
          <Button
            variant="info"
            hierarchy="outline"
            disabled={reviseMutation.isPending}
            isLoading={reviseMutation.isPending}
            onClick={() => reviseMutation.mutate({ id: plan.id })}
          >
            Ask for changes
          </Button>
        )}
        {canCancelPlan(plan.status) && (
          <Button
            variant="danger"
            hierarchy="ghost"
            disabled={cancelMutation.isPending}
            isLoading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(plan.id)}
          >
            Cancel plan
          </Button>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Accept this plan?"
        message={`This will create/update real goals or budgets in your account based on ${selectedCandidate.label.toLowerCase()} timeline — ${selectedCandidate.monthsRemaining} months at ${Number(selectedCandidate.requiredMonthlyContribution.amount).toLocaleString("en-IN")} ${selectedCandidate.requiredMonthlyContribution.currency}/month.`}
        impactDetails="Your data will be re-checked first — if anything material changed since this plan was generated, it will stop and nothing will execute. Otherwise this cannot be undone automatically; you would need to edit the created goal/budget by hand."
        confirmText="Accept and apply"
        variant="warning"
        isLoading={acceptMutation.isPending}
        onConfirm={() => {
          acceptMutation.mutate(plan.id, { onSettled: () => setConfirmOpen(false) });
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
};

const BaselineStat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-600">{label}</div>
    <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
  </div>
);

export default PlanDetailView;
