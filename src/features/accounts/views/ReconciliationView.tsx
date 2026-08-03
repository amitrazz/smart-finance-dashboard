import React from "react";

import { useReconciliation } from "../../../hooks/useFinanceQueries";
import { EmptyState } from "../../../components/common/EmptyState";
import { AlertTriangle } from "lucide-react";

export const ReconciliationView: React.FC = () => {
  const { isLoading } = useReconciliation();

  if (isLoading) {
    return <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800 animate-pulse" />;
  }

  return (
    <EmptyState
      icon={<AlertTriangle className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
      title="Statement Reconciliation Not Available"
      message="There is no backend endpoint for matching imported statement lines against ledger transactions yet."
    />
  );
};
