import React from "react";
import { useRecommendationInbox } from "../hooks/useInsightsQueries";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { RecommendationCard } from "../components/RecommendationCard";

export const RecommendationsPage: React.FC = () => {
  const { data: recs = [], isLoading } = useRecommendationInbox();

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        title="Actionable Financial Recommendations Priority Inbox"
        description="Smart recommendations categorized by High Impact, Quick Wins, and Long-Term wealth strategy"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recs.map((rec) => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
};
