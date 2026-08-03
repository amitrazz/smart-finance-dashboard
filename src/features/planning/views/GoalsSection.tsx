import React from "react";
import { GoalDetailsView } from "../../goals/components/GoalDetailsView";
import { GoalsActiveTab } from "./goals/GoalsActiveTab";
import { GoalsAnalyticsTab } from "./goals/GoalsAnalyticsTab";
import { GoalsForecastTab } from "./goals/GoalsForecastTab";
import { GoalsCompletedTab } from "./goals/GoalsCompletedTab";
import { GoalsArchivedTab } from "./goals/GoalsArchivedTab";

interface GoalsSectionProps {
  subsection: string;
  detailId: string | null;
  onSelectGoal: (goalId: string) => void;
  onBackFromDetail: () => void;
  onOpenCreateWizard: () => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  subsection,
  detailId,
  onSelectGoal,
  onBackFromDetail,
  onOpenCreateWizard,
}) => {
  if (detailId) {
    return <GoalDetailsView goalId={detailId} onBack={onBackFromDetail} />;
  }

  switch (subsection) {
    case "analytics":
      return <GoalsAnalyticsTab />;
    case "forecast":
      return <GoalsForecastTab />;
    case "completed":
      return <GoalsCompletedTab onSelectGoal={onSelectGoal} />;
    case "archived":
      return <GoalsArchivedTab onSelectGoal={onSelectGoal} />;
    case "active":
    default:
      return <GoalsActiveTab onOpenCreateWizard={onOpenCreateWizard} onSelectGoal={onSelectGoal} />;
  }
};

export default GoalsSection;
