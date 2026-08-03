import React from "react";
import { GoalListView } from "../../../goals/components/GoalListView";

interface GoalsActiveTabProps {
  onOpenCreateWizard: () => void;
  onSelectGoal: (goalId: string) => void;
}

export const GoalsActiveTab: React.FC<GoalsActiveTabProps> = ({ onOpenCreateWizard, onSelectGoal }) => (
  <GoalListView onOpenCreateWizard={onOpenCreateWizard} onSelectGoal={onSelectGoal} />
);

export default GoalsActiveTab;
