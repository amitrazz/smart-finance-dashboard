import React from "react";
import { RecommendationsTab } from "./insights/RecommendationsTab";
import { RisksTab } from "./insights/RisksTab";
import { TrendsTab } from "./insights/TrendsTab";

interface InsightsSectionProps {
  subsection: string;
  onSelectGoal: (goalId: string) => void;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({ subsection, onSelectGoal }) => {
  switch (subsection) {
    case "risks":
      return <RisksTab onSelectGoal={onSelectGoal} />;
    case "trends":
      return <TrendsTab />;
    case "recommendations":
    default:
      return <RecommendationsTab />;
  }
};

export default InsightsSection;
