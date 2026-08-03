import React from "react";
import { BudgetDetailView } from "../../budgets/components/BudgetDetailView";
import { BudgetsActiveTab } from "./budgets/BudgetsActiveTab";
import { BudgetsAnalyticsTab } from "./budgets/BudgetsAnalyticsTab";
import { BudgetsCategoriesTab } from "./budgets/BudgetsCategoriesTab";
import { BudgetsForecastTab } from "./budgets/BudgetsForecastTab";
import { BudgetsHistoryTab } from "./budgets/BudgetsHistoryTab";

interface BudgetsSectionProps {
  subsection: string;
  detailId: string | null;
  onSelectBudget: (id: string) => void;
  onBackFromDetail: () => void;
  onOpenCreateWizard: () => void;
}

export const BudgetsSection: React.FC<BudgetsSectionProps> = ({
  subsection,
  detailId,
  onSelectBudget,
  onBackFromDetail,
  onOpenCreateWizard,
}) => {
  if (detailId) {
    return <BudgetDetailView budgetId={detailId} onBack={onBackFromDetail} />;
  }

  switch (subsection) {
    case "analytics":
      return <BudgetsAnalyticsTab />;
    case "categories":
      return <BudgetsCategoriesTab />;
    case "forecast":
      return <BudgetsForecastTab />;
    case "history":
      return <BudgetsHistoryTab onSelectBudget={onSelectBudget} />;
    case "active":
    default:
      return <BudgetsActiveTab onOpenWizard={onOpenCreateWizard} onSelectBudget={onSelectBudget} />;
  }
};

export default BudgetsSection;
