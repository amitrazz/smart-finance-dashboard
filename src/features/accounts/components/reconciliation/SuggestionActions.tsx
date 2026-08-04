import React from "react";
import { Check, RefreshCw, X } from "lucide-react";
import {
  useConfirmReconciliation,
  useRejectReconciliation,
  useReconciliations,
} from "../../../../hooks/useFinanceQueries";

/**
 * A SUGGESTED StatementLine doesn't carry its match's transactionId directly
 * (only the Reconciliation decision row does) — this looks up the active
 * SUGGESTED Reconciliation record behind the line so confirm/reject have a
 * reconciliationId + version to act on.
 */
export const SuggestionActions: React.FC<{ statementLineId: string }> = ({ statementLineId }) => {
  const { data: suggestions = [], isLoading } = useReconciliations({
    statementLineId,
    status: "SUGGESTED",
    limit: 1,
  });
  const confirmMutation = useConfirmReconciliation();
  const rejectMutation = useRejectReconciliation();

  const suggestion = suggestions[0];
  const isSubmitting = confirmMutation.isPending || rejectMutation.isPending;

  if (isLoading) {
    return <div className="h-7 w-24 bg-slate-800/60 rounded-lg animate-pulse" />;
  }

  if (!suggestion) {
    return <span className="text-[11px] text-slate-600">No active suggestion</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {suggestion.confidenceScore}% confidence
      </span>
      <button
        onClick={() => confirmMutation.mutate({ id: suggestion.id, version: suggestion.version })}
        disabled={isSubmitting}
        title="Confirm this suggested match"
        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40"
      >
        {confirmMutation.isPending ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
      </button>
      <button
        onClick={() => rejectMutation.mutate({ id: suggestion.id, version: suggestion.version })}
        disabled={isSubmitting}
        title="Reject this suggested match"
        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-40"
      >
        {rejectMutation.isPending ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
