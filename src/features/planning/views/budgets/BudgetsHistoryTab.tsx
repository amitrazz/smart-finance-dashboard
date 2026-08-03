import React from "react";
import { History } from "lucide-react";
import { useBudgets } from "../../../../hooks/useFinanceQueries";
import { BudgetCard } from "../../../../components/planning/BudgetCard";
import { LoadingSkeleton } from "../../../../components/common/LoadingSkeleton";
import { ErrorState } from "../../../../components/common/ErrorState";
import { EmptyState } from "../../../../components/common/EmptyState";

interface BudgetsHistoryTabProps {
  onSelectBudget: (id: string) => void;
}

export const BudgetsHistoryTab: React.FC<BudgetsHistoryTabProps> = ({ onSelectBudget }) => {
  const completed = useBudgets({ status: "COMPLETED" });
  const archived = useBudgets({ status: "ARCHIVED" });

  const isLoading = completed.isLoading || archived.isLoading;
  const isError = completed.isError || archived.isError;
  const budgets = [...(completed.data ?? []), ...(archived.data ?? [])];

  if (isLoading) return <LoadingSkeleton type="cards" rows={3} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Budget History"
        onRetry={() => {
          completed.refetch();
          archived.refetch();
        }}
      />
    );
  }
  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<History className="w-10 h-10 text-slate-600 mx-auto" aria-hidden="true" />}
        title="No Past Budgets"
        message="Budgets from previous periods will show up here once they're completed or archived."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {budgets.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} onSelect={onSelectBudget} />
      ))}
    </div>
  );
};

export default BudgetsHistoryTab;
