import React from "react";
import { X, History, RotateCcw } from "lucide-react";
import { Money as MoneyDisplay } from "../../../components/common/Money";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatDate } from "../../../utils/formatters";
import { RecurringContributionRule } from "../../../types";
import { useRecurringContributionExecutions } from "../hooks/useRetirementQueries";
import { ExecutionStatusBadge } from "./ExecutionStatusBadge";

interface RecurringContributionExecutionHistoryModalProps {
  rule: RecurringContributionRule | null;
  onClose: () => void;
}

export const RecurringContributionExecutionHistoryModal: React.FC<
  RecurringContributionExecutionHistoryModalProps
> = ({ rule, onClose }) => {
  const { data, isLoading, isError, refetch } = useRecurringContributionExecutions(
    rule?.id ?? "",
    rule ? { limit: 25 } : undefined,
  );

  if (!rule) return null;

  const executions = data?.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recurring-execution-history-title"
    >
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="recurring-execution-history-title" className="text-lg font-bold text-slate-100">
                Execution History
              </h3>
              <p className="text-xs text-slate-400">
                <MoneyDisplay value={rule.amount} /> · Monthly on day {rule.dayOfMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-950 border border-slate-800" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center space-y-3">
            <p className="text-sm text-rose-400 font-semibold">Failed to load execution history.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : executions.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8" aria-hidden="true" />}
            title="No executions yet"
            message="This rule hasn't run yet — check back after its next execution date."
          />
        ) : (
          <div className="space-y-2">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ExecutionStatusBadge status={execution.status} />
                    {execution.status === "SUCCEEDED" && execution.reversed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20">
                        <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reversed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{formatDate(execution.occurrenceDate)}</p>
                  {execution.reason && (execution.status === "FAILED" || execution.status === "SKIPPED") && (
                    <p className="text-[11px] text-slate-400">{execution.reason}</p>
                  )}
                </div>
                <span className="font-bold text-sm text-slate-100 shrink-0">
                  <MoneyDisplay value={rule.amount} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
