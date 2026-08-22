/**
 * PlanningView — unified "Planning" workspace consolidating Goals & Budgets.
 * Two-level navigation: Overview | Goals | Budgets | Insights | Reports,
 * each owning contextual sub-tabs. Pattern mirrors AccountsView.tsx.
 */
import React, { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useUIStore } from "../../store/useUIStore";
import { useGoals, useBudgets } from "../../hooks/useFinanceQueries";

import { PlanningNavigation, PlanningSection } from "./components/PlanningNavigation";
import { getPrimaryTab } from "./components/PlanningNavigation.constants";
import { PlanningGlobalToolbar } from "./components/PlanningGlobalToolbar";
import { PlanningQuickActions } from "./components/PlanningQuickActions";
import { AddContributionModal } from "./components/AddContributionModal";
import { AdjustBudgetModal } from "./components/AdjustBudgetModal";
import { NewTransferModal as TransferMoneyModal } from "../accounts/components/NewTransferModal";

import { OverviewSection } from "./views/OverviewSection";
import { MonthlyPlannerSection } from "./views/MonthlyPlannerSection";
import { GoalsSection } from "./views/GoalsSection";
import { BudgetsSection } from "./views/BudgetsSection";
import { InsightsSection } from "./views/InsightsSection";
import { ReportsSection } from "./views/ReportsSection";
import { PlansSection } from "../finance-ai/pages/PlansSection";

import { GoalCreationWizardModal } from "../goals/components/GoalCreationWizardModal";
import { BudgetWizardModal } from "../budgets/components/BudgetWizardModal";

function parseSubTab(subTab: string | null): { section: PlanningSection; subsection: string | null; detailId: string | null } {
  const parts = (subTab ?? "").split("/").filter(Boolean);
  const section = (
    ["overview", "monthly-plan", "goals", "budgets", "ai-plans", "insights", "reports"].includes(parts[0])
      ? parts[0]
      : "overview"
  ) as PlanningSection;

  if (parts[1] === "detail" && parts[2]) {
    return { section, subsection: null, detailId: parts[2] };
  }

  return { section, subsection: parts[1] ?? null, detailId: null };
}

export const PlanningView: React.FC = () => {
  const { activeSubTab, setActiveSubTab } = useUIStore();
  const { refetch: refetchGoals } = useGoals();
  const { refetch: refetchBudgets } = useBudgets();
  const prefersReducedMotion = useReducedMotion();

  const { section, subsection: parsedSubsection, detailId } = parseSubTab(activeSubTab);
  const subsection = parsedSubsection ?? getPrimaryTab(section).defaultSub;

  const [isGoalWizardOpen, setGoalWizardOpen] = useState(false);
  const [isBudgetWizardOpen, setBudgetWizardOpen] = useState(false);
  const [isContributionModalOpen, setContributionModalOpen] = useState(false);
  const [isAdjustBudgetModalOpen, setAdjustBudgetModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.replace(/^#\/?planning\/?/, "");
      setActiveSubTab(hash || null);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [setActiveSubTab]);

  const navigate = useCallback(
    (nextSection: PlanningSection, nextSub?: string | null) => {
      const sub = nextSub ?? getPrimaryTab(nextSection).defaultSub;
      setActiveSubTab(nextSection === "overview" ? null : sub ? `${nextSection}/${sub}` : nextSection);
    },
    [setActiveSubTab]
  );

  const handleSelectGoal = useCallback(
    (goalId: string) => setActiveSubTab(`goals/detail/${goalId}`),
    [setActiveSubTab]
  );
  const handleBackFromGoalDetail = useCallback(() => navigate("goals", "active"), [navigate]);

  const handleSelectBudget = useCallback(
    (budgetId: string) => setActiveSubTab(`budgets/detail/${budgetId}`),
    [setActiveSubTab]
  );
  const handleBackFromBudgetDetail = useCallback(() => navigate("budgets", "active"), [navigate]);

  const handleSelectPlan = useCallback(
    (planId: string) => setActiveSubTab(`ai-plans/detail/${planId}`),
    [setActiveSubTab]
  );
  const handleBackFromPlanDetail = useCallback(() => navigate("ai-plans"), [navigate]);

  const handleRefresh = () => {
    refetchGoals();
    refetchBudgets();
  };

  const isDetail = Boolean(detailId);

  const renderSection = () => {
    switch (section) {
      case "monthly-plan":
        return (
          <MonthlyPlannerSection
            monthParam={subsection}
            onNavigateMonth={(yyyymm) => setActiveSubTab(`monthly-plan/${yyyymm}`)}
            onSelectBudget={handleSelectBudget}
            onSelectGoal={handleSelectGoal}
            onNavigateBudgets={() => navigate("budgets", "active")}
            onOpenCreateBudget={() => setBudgetWizardOpen(true)}
          />
        );
      case "goals":
        return (
          <GoalsSection
            subsection={subsection ?? "active"}
            detailId={detailId}
            onSelectGoal={handleSelectGoal}
            onBackFromDetail={handleBackFromGoalDetail}
            onOpenCreateWizard={() => setGoalWizardOpen(true)}
          />
        );
      case "budgets":
        return (
          <BudgetsSection
            subsection={subsection ?? "active"}
            detailId={detailId}
            onSelectBudget={handleSelectBudget}
            onBackFromDetail={handleBackFromBudgetDetail}
            onOpenCreateWizard={() => setBudgetWizardOpen(true)}
          />
        );
      case "ai-plans":
        return (
          <PlansSection
            detailId={detailId}
            onSelectPlan={handleSelectPlan}
            onBackFromDetail={handleBackFromPlanDetail}
          />
        );
      case "insights":
        return <InsightsSection subsection={subsection ?? "recommendations"} onSelectGoal={handleSelectGoal} />;
      case "reports":
        return <ReportsSection subsection={subsection ?? "planning-summary"} />;
      case "overview":
      default:
        return <OverviewSection onNavigate={navigate} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-none">Planning</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Your intelligent financial planning workspace</p>
        </div>
        <PlanningQuickActions
          onCreateGoal={() => setGoalWizardOpen(true)}
          onCreateBudget={() => setBudgetWizardOpen(true)}
          onAddContribution={() => setContributionModalOpen(true)}
          onTransferMoney={() => setTransferModalOpen(true)}
          onAdjustBudget={() => setAdjustBudgetModalOpen(true)}
          onExport={() => navigate("reports", "planning-summary")}
          onRefresh={handleRefresh}
        />
      </div>

      <PlanningNavigation
        activeSection={section}
        activeSubsection={subsection}
        onNavigate={navigate}
        isDetail={isDetail}
      />

      {!isDetail && section !== "reports" && section !== "monthly-plan" && (
        <PlanningGlobalToolbar onExport={() => navigate("reports", "planning-summary")} onRefresh={handleRefresh} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={section + (subsection ?? "") + (detailId ?? "")}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.16, ease: "easeOut" }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>

      <GoalCreationWizardModal isOpen={isGoalWizardOpen} onClose={() => setGoalWizardOpen(false)} />
      <BudgetWizardModal isOpen={isBudgetWizardOpen} onClose={() => setBudgetWizardOpen(false)} />
      <AddContributionModal isOpen={isContributionModalOpen} onClose={() => setContributionModalOpen(false)} />
      <AdjustBudgetModal isOpen={isAdjustBudgetModalOpen} onClose={() => setAdjustBudgetModalOpen(false)} />
      <TransferMoneyModal isOpen={isTransferModalOpen} onClose={() => setTransferModalOpen(false)} />
    </div>
  );
};

export default PlanningView;
