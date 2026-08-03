import React from "react";
import { Archive } from "lucide-react";
import { useGoals } from "../../../../hooks/useFinanceQueries";
import { GoalCard } from "../../../../components/planning/GoalCard";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";

interface GoalsArchivedTabProps {
  onSelectGoal: (goalId: string) => void;
}

export const GoalsArchivedTab: React.FC<GoalsArchivedTabProps> = ({ onSelectGoal }) => {
  const { data: goals = [], isLoading, isError, refetch } = useGoals({ status: "ARCHIVED" });

  if (isLoading) return <LoadingSkeleton type="cards" rows={3} />;
  if (isError) return <ErrorState title="Failed to Load Archived Goals" onRetry={() => refetch()} />;
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<Archive className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="No Archived Goals"
        message="Goals you archive will be kept here for reference."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onSelect={onSelectGoal} />
      ))}
    </div>
  );
};

export default GoalsArchivedTab;
