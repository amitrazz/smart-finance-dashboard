import React from "react";
import { MyBudgetsSubmenuView } from "../../../budgets/components/MyBudgetsSubmenuView";

interface BudgetsActiveTabProps {
  onOpenWizard: () => void;
  onSelectBudget: (id: string) => void;
}

export const BudgetsActiveTab: React.FC<BudgetsActiveTabProps> = ({ onOpenWizard, onSelectBudget }) => (
  <MyBudgetsSubmenuView onOpenWizard={onOpenWizard} onSelectBudget={onSelectBudget} />
);

export default BudgetsActiveTab;
