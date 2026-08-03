import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useGoals } from "../../../../hooks/useFinanceQueries";
import { GoalCard } from "../../../../components/planning/GoalCard";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";

interface GoalsCompletedTabProps {
  onSelectGoal: (goalId: string) => void;
}

export const GoalsCompletedTab: React.FC<GoalsCompletedTabProps> = ({ onSelectGoal }) => {
  const { data: goals = [], isLoading, isError, refetch } = useGoals({ status: "COMPLETED" });

  if (isLoading) return <LoadingSkeleton type="cards" rows={3} />;
  if (isError) return <ErrorState title="Failed to Load Completed Goals" onRetry={() => refetch()} />;
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="No Completed Goals Yet"
        message="Goals you finish will show up here."
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

export default GoalsCompletedTab;
