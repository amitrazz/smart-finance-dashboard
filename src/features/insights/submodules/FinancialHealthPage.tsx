import React from "react";
import { useFinancialHealthAnalytics } from "../hooks/useInsightsQueries";
import { HealthScoreWidget } from "../components/HealthScoreWidget";
import { AnalyticsHeader } from "../components/AnalyticsHeader";

export const FinancialHealthPage: React.FC = () => {
  const { data: health, isLoading } = useFinancialHealthAnalytics();

  if (isLoading || !health) return null;

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        title="Financial Health Diagnostic"
        description="Comprehensive 8-dimension assessment computed from live backend accounts & cash flow"
      />
      <HealthScoreWidget data={health} />
    </div>
  );
};
