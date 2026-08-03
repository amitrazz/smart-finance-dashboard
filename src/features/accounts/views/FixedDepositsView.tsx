import React from "react";

import { useFixedDeposits } from "../../../hooks/useFinanceQueries";
import { EmptyState } from "../../../components/common/EmptyState";
import { Lock } from "lucide-react";

export const FixedDepositsView: React.FC = () => {
  const { isLoading } = useFixedDeposits();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
        {Array(2).fill(null).map((_, i) => <div key={i} className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  return (
    <EmptyState
      icon={<Lock className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
      title="Fixed Deposit Tracking Not Available"
      message="There is no backend endpoint for fixed deposit terms (interest rate, maturity, tenure) yet."
    />
  );
};
