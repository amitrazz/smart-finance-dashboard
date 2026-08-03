import React from "react";

import { useInvestmentCash } from "../../../hooks/useFinanceQueries";
import { EmptyState } from "../../../components/common/EmptyState";
import { BarChart2 } from "lucide-react";

export const InvestmentCashView: React.FC = () => {
  const { isLoading } = useInvestmentCash();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
        {Array(3).fill(null).map((_, i) => <div key={i} className="h-56 bg-slate-900/60 rounded-3xl border border-slate-800" />)}
      </div>
    );
  }

  return (
    <EmptyState
      icon={<BarChart2 className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
      title="Broker Cash Positions Not Available"
      message="There is no backend endpoint for per-broker cash positions (available to trade, pending settlement, withdrawable) yet."
    />
  );
};
