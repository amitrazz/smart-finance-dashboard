import React from "react";
import { useRiskMatrixAnalytics } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { RiskCard } from "../components/RiskCard";

export const RisksPage: React.FC = () => {
  const { data: matrix, isLoading } = useRiskMatrixAnalytics();

  if (isLoading || !matrix) return null;

  return (
    <div className="space-y-8">
      <AnalyticsHeader
        title="Risk Matrix & Severity Dashboard"
        description="Overspending, cash flow strain, high debt ratios, credit card risks, emergency corpus warnings"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
          <span className="text-xs font-bold text-rose-400 uppercase">Critical Risks</span>
          <p className="text-2xl font-extrabold text-rose-400 font-mono">{matrix.criticalCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
          <span className="text-xs font-bold text-amber-400 uppercase">High Risks</span>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">{matrix.highCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1">
          <span className="text-xs font-bold text-indigo-400 uppercase">Medium Risks</span>
          <p className="text-2xl font-extrabold text-indigo-400 font-mono">{matrix.mediumCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800 text-center space-y-1">
          <span className="text-xs font-bold text-slate-300 uppercase">Low Risks</span>
          <p className="text-2xl font-extrabold text-slate-300 font-mono">{matrix.lowCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matrix.risks.map((risk) => (
          <RiskCard key={risk.id} risk={risk} />
        ))}
      </div>
    </div>
  );
};
