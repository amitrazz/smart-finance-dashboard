import React from "react";
import { MonthlyBudgetReviewReport } from "./reports/MonthlyBudgetReviewReport";
import { GoalProgressReport } from "./reports/GoalProgressReport";
import { SavingsReport } from "./reports/SavingsReport";
import { PlanningSummaryReport } from "./reports/PlanningSummaryReport";

interface ReportsSectionProps {
  subsection: string;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ subsection }) => {
  switch (subsection) {
    case "monthly-budget-review":
      return <MonthlyBudgetReviewReport />;
    case "goal-progress":
      return <GoalProgressReport />;
    case "savings":
      return <SavingsReport />;
    case "planning-summary":
    default:
      return <PlanningSummaryReport />;
  }
};

export default ReportsSection;
