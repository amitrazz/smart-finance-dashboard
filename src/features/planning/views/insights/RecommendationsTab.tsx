import React from "react";
import { useSmartActions, useDismissAction } from "../../../actions/hooks/useSmartActions";
import { RecommendationCard } from "../../../../components/planning/RecommendationCard";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorState } from "../../../../components/common/ErrorState";

export const RecommendationsTab: React.FC = () => {
  const { data: goalActions = [], isLoading: goalLoading, isError: goalErrored, refetch: refetchGoalActions } = useSmartActions({ category: "GOALS" });
  const { data: savingsActions = [], isLoading: savingsLoading, isError: savingsErrored, refetch: refetchSavingsActions } = useSmartActions({ category: "SAVINGS" });
  const dismissAction = useDismissAction();

  const isLoading = goalLoading || savingsLoading;
  if (isLoading) return <LoadingSkeleton type="list" rows={4} />;

  if (goalErrored || savingsErrored) {
    return (
      <ErrorState
        title="Failed to Load Recommendations"
        message="We couldn't load your planning recommendations."
        onRetry={() => {
          if (goalErrored) refetchGoalActions();
          if (savingsErrored) refetchSavingsActions();
        }}
      />
    );
  }

  const actionRecs = [...goalActions, ...savingsActions].filter((a) => a.recommendation);

  if (actionRecs.length === 0) {
    return (
      <EmptyState
        title="No Recommendations Right Now"
        message="You're on track — check back after your next budget cycle or goal update."
      />
    );
  }

  return (
    <div className="space-y-3">
      {actionRecs.map((action) => (
        <RecommendationCard
          key={action.id}
          title={action.title}
          text={action.recommendation ?? action.description}
          severity={action.priority === "CRITICAL" ? "CRITICAL" : action.priority === "HIGH" ? "WARNING" : "INFO"}
          onDismiss={
            action.dismissible
              ? () => dismissAction.mutate({ id: action.id, version: action.version })
              : undefined
          }
        />
      ))}
    </div>
  );
};

export default RecommendationsTab;
