import React from "react";
import { useCorporateActions } from "../hooks/useInvestmentQueries";
import { CorporateActionTimeline } from "../components/CorporateActionTimeline";

export const CorporateActionsView: React.FC = () => {
  const { data: actions = [], isLoading } = useCorporateActions();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-48 bg-slate-900 rounded-3xl" />
        <div className="h-48 bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CorporateActionTimeline actions={actions} />
    </div>
  );
};
