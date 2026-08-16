import React, { useState } from "react";
import { AlertTriangle, History, Pause, Play, Plus, Repeat, XCircle } from "lucide-react";
import { RecurringContributionRule, RetirementAccount } from "../../../types";
import { Money as MoneyDisplay } from "../../../components/common/Money";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import { formatDate } from "../../../utils/formatters";
import { TRANSACTION_TYPE_LABELS } from "../constants/productTypes";
import {
  useCancelRecurringContributionRule,
  usePauseRecurringContributionRule,
  useRecurringContributionRules,
  useResumeRecurringContributionRule,
} from "../hooks/useRetirementQueries";
import { RecurringRuleStatusBadge } from "./RecurringRuleStatusBadge";
import { RecurringContributionFormModal } from "./RecurringContributionFormModal";
import { RecurringContributionExecutionHistoryModal } from "./RecurringContributionExecutionHistoryModal";

interface RecurringContributionsSectionProps {
  account: RetirementAccount;
}

type PendingAction = { kind: "pause" | "resume" | "cancel"; rule: RecurringContributionRule };

const isOverdue = (rule: RecurringContributionRule): boolean =>
  rule.status === "ACTIVE" && new Date(rule.nextExecutionDate).getTime() < new Date().setHours(0, 0, 0, 0);

export const RecurringContributionsSection: React.FC<RecurringContributionsSectionProps> = ({ account }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [historyRule, setHistoryRule] = useState<RecurringContributionRule | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { data, isLoading, isError, refetch } = useRecurringContributionRules({
    retirementAccountId: account.id,
    limit: 20,
  });
  const pauseMutation = usePauseRecurringContributionRule();
  const resumeMutation = useResumeRecurringContributionRule();
  const cancelMutation = useCancelRecurringContributionRule();

  const rules = data?.data ?? [];
  const isAccountActive = account.status === "ACTIVE";
  const actionMutation =
    pendingAction?.kind === "pause" ? pauseMutation : pendingAction?.kind === "resume" ? resumeMutation : cancelMutation;

  const sourceLabel = (rule: RecurringContributionRule): string =>
    rule.transactionType === "EMPLOYER_CONTRIBUTION" ? "Employer" : "Linked account";

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    const { kind, rule } = pendingAction;
    const variables = { id: rule.id, version: rule.version, retirementAccountId: account.id };
    const mutation = kind === "pause" ? pauseMutation : kind === "resume" ? resumeMutation : cancelMutation;
    mutation.mutate(variables, { onSuccess: () => setPendingAction(null) });
  };

  const confirmCopy: Record<PendingAction["kind"], { title: string; message: string; confirmText: string; variant: "warning" | "danger" }> = {
    pause: {
      title: "Pause recurring contribution?",
      message:
        "No new contribution will be scheduled while this rule is paused. Existing retirement transactions will not be changed.",
      confirmText: "Pause",
      variant: "warning",
    },
    resume: {
      title: "Resume recurring contribution?",
      message: "Future scheduled contributions will continue from the next applicable occurrence.",
      confirmText: "Resume",
      variant: "warning",
    },
    cancel: {
      title: "Cancel recurring contribution?",
      message: "This will stop future scheduled contributions. Existing transactions will remain unchanged.",
      confirmText: "Cancel Contribution",
      variant: "danger",
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Repeat className="w-4 h-4" /> Recurring Contributions
        </h4>
        {isAccountActive && rules.length > 0 && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {!isAccountActive && (
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
          This retirement account is {account.status.toLowerCase().replace(/_/g, " ")}. New recurring contributions
          cannot be scheduled.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-950 border border-slate-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center space-y-3">
          <p className="text-sm text-rose-400 font-semibold">Failed to load recurring contributions.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8" aria-hidden="true" />}
          title="No recurring contributions"
          message="Automate your monthly EPF, VPF, PPF, or NPS contributions."
          actionLabel={isAccountActive ? "Add Recurring Contribution" : undefined}
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={isAccountActive ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const typeConfig = TRANSACTION_TYPE_LABELS[rule.transactionType];
            const autoPaused = rule.status === "PAUSED" && rule.consecutiveFailureCount > 0;
            return (
              <div key={rule.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-100">{typeConfig.label}</span>
                      <RecurringRuleStatusBadge status={rule.status} autoPaused={autoPaused} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {sourceLabel(rule)} · Monthly on day {rule.dayOfMonth}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-slate-100 shrink-0">
                    <MoneyDisplay value={rule.amount} />
                  </span>
                </div>

                {isOverdue(rule) && (
                  <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Next execution date has passed — missed occurrences are processed oldest-first once the
                      schedule catches up.
                    </span>
                  </div>
                )}
                {autoPaused && (
                  <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Paused after {rule.consecutiveFailureCount} failed attempt{rule.consecutiveFailureCount === 1 ? "" : "s"}.
                      Review the source account and resume when ready.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                  <span className="text-slate-500">
                    {rule.status === "ACTIVE" || rule.status === "PAUSED"
                      ? `Next: ${formatDate(rule.nextExecutionDate)}`
                      : rule.lastExecutedDate
                        ? `Last ran: ${formatDate(rule.lastExecutedDate)}`
                        : null}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setHistoryRule(rule)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-semibold"
                    >
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                    {rule.status === "ACTIVE" && (
                      <button
                        onClick={() => setPendingAction({ kind: "pause", rule })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 font-semibold"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                    {rule.status === "PAUSED" && (
                      <button
                        onClick={() => setPendingAction({ kind: "resume", rule })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                    )}
                    {(rule.status === "ACTIVE" || rule.status === "PAUSED") && (
                      <button
                        onClick={() => setPendingAction({ kind: "cancel", rule })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecurringContributionFormModal account={isFormOpen ? account : null} onClose={() => setFormOpen(false)} />
      <RecurringContributionExecutionHistoryModal rule={historyRule} onClose={() => setHistoryRule(null)} />

      <ConfirmModal
        isOpen={pendingAction !== null}
        title={pendingAction ? confirmCopy[pendingAction.kind].title : ""}
        message={pendingAction ? confirmCopy[pendingAction.kind].message : ""}
        confirmText={pendingAction ? confirmCopy[pendingAction.kind].confirmText : "Confirm"}
        variant={pendingAction ? confirmCopy[pendingAction.kind].variant : "warning"}
        isLoading={actionMutation.isPending}
        onConfirm={handleConfirmAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
};
