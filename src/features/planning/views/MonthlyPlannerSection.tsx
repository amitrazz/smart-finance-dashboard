import React, { useState } from "react";
import { useMonthlyPlan, useCloseMonth, useRolloverMonth } from "../hooks/useMonthlyPlannerQueries";
import { useUIStore } from "../../../store/useUIStore";
import { LoadingSkeleton } from "../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../components/common/ErrorState";
import { EmptyState } from "../../../components/common/EmptyState";
import { MonthNavigator } from "../components/monthly-planner/MonthNavigator";
import { ExecutiveSummaryCard } from "../components/monthly-planner/ExecutiveSummaryCard";
import { SafeToSpendPanel } from "../components/monthly-planner/SafeToSpendPanel";
import { CashFlowWaterfall } from "../components/monthly-planner/CashFlowWaterfall";
import { FixedCommitmentsTable } from "../components/monthly-planner/FixedCommitmentsTable";
import { BudgetSummaryTable } from "../components/monthly-planner/BudgetSummaryTable";
import { DebtCommitmentsPanel } from "../components/monthly-planner/DebtCommitmentsPanel";
import { SavingsInvestmentsPanel } from "../components/monthly-planner/SavingsInvestmentsPanel";
import { PlanningWarningsList } from "../components/monthly-planner/PlanningWarningsList";
import { PlanVsActualTable } from "../components/monthly-planner/PlanVsActualTable";
import { CloseMonthPanel } from "../components/monthly-planner/CloseMonthPanel";
import { getTimingLabels, parseMonthParam, toMonthParam } from "../components/monthly-planner/monthlyPlanner.utils";

interface MonthlyPlannerSectionProps {
  monthParam: string | null;
  onNavigateMonth: (yyyymm: string) => void;
  onSelectBudget: (budgetId: string) => void;
  onSelectGoal: (goalId: string) => void;
  onNavigateBudgets: () => void;
  onOpenCreateBudget: () => void;
}

/**
 * Spec §4/§23 — the primary Monthly Financial Planner page. One
 * `useMonthlyPlan` call is the entire data source; every section below is a
 * pure slice/render of that single response, in the priority order the
 * spec asks for (safe-to-spend first, detail tables last).
 */
export const MonthlyPlannerSection: React.FC<MonthlyPlannerSectionProps> = ({
  monthParam,
  onNavigateMonth,
  onSelectBudget,
  onSelectGoal,
  onNavigateBudgets,
  onOpenCreateBudget,
}) => {
  const { year, month } = parseMonthParam(monthParam);
  const [minimumCashBuffer, setMinimumCashBuffer] = useState("0");

  const { data: plan, isLoading, isError, refetch, isFetching } = useMonthlyPlan(year, month, minimumCashBuffer);
  const closeMonth = useCloseMonth();
  const rolloverMonth = useRolloverMonth();

  const handleMonthChange = (nextYear: number, nextMonth: number) => onNavigateMonth(toMonthParam(nextYear, nextMonth));

  const goToLoans = () => useUIStore.getState().setActiveTab("loans", "all-loans");
  const goToCreditCards = () => useUIStore.getState().setActiveTab("credit-cards");

  if (isLoading) return <LoadingSkeleton type="cards" rows={6} />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Monthly Plan"
        message="We couldn't load your monthly financial plan."
        onRetry={() => refetch()}
      />
    );
  }

  if (!plan) {
    return (
      <EmptyState
        title="No Monthly Plan Available"
        message="We couldn't find enough data to build a plan for this month yet."
      />
    );
  }

  const timing = getTimingLabels(plan.period.timing);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Monthly Financial Plan</h2>
          <p className="text-xs text-slate-500">{timing.description}</p>
        </div>
        <MonthNavigator year={year} month={month} onChange={handleMonthChange} onRefresh={() => refetch()} isRefreshing={isFetching} />
      </div>

      {plan.period.timing === "CURRENT" && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => rolloverMonth.mutate({ year, month, minimumCashBuffer })}
            disabled={rolloverMonth.isPending}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            {rolloverMonth.isPending ? "Generating…" : "Preview Next Month →"}
          </button>
        </div>
      )}

      <SafeToSpendPanel
        safeToSpend={plan.safeToSpend}
        minimumCashBuffer={minimumCashBuffer}
        onBufferChange={setMinimumCashBuffer}
      />

      <ExecutiveSummaryCard plan={plan} onNavigateBudget={onNavigateBudgets} />

      <CashFlowWaterfall
        cashFlow={plan.cashFlow}
        fixedCommitmentsTotal={plan.fixedCommitments.planned}
        debtTotal={plan.debtCommitments.total}
        budgetActual={plan.budget.actual}
        investmentsPlanned={plan.investments.planned}
        savingsPlanned={plan.savings.planned}
      />

      <FixedCommitmentsTable fixedCommitments={plan.fixedCommitments} />

      <BudgetSummaryTable budget={plan.budget} onSelectBudget={onSelectBudget} onCreateBudget={onOpenCreateBudget} />

      <DebtCommitmentsPanel
        debtCommitments={plan.debtCommitments}
        onNavigateLoans={goToLoans}
        onNavigateCreditCards={goToCreditCards}
      />

      <SavingsInvestmentsPanel savings={plan.savings} investments={plan.investments} onSelectGoal={onSelectGoal} />

      <PlanningWarningsList warnings={plan.warnings ?? []} onSelectBudget={onSelectBudget} onSelectGoal={onSelectGoal} />

      <PlanVsActualTable plan={plan} />

      {plan.period.timing === "PAST" && (
        <CloseMonthPanel
          onClose={() => closeMonth.mutate({ year, month })}
          isClosing={closeMonth.isPending}
          carryForwardResults={closeMonth.data?.carryForwardResults}
        />
      )}
    </div>
  );
};

export default MonthlyPlannerSection;
