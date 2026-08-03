import React from "react";
import { useGoals } from "../../../hooks/useFinanceQueries";
import { GoalProgressCard } from "../components/GoalProgressCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { Target, Plus } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export const GoalsView: React.FC = () => {
  const { data: goals = [], isLoading, isError, refetch } = useGoals();
  const { setActiveTab } = useUIStore();

  const linkedGoals = goals.filter((g) => g.linkedInvestmentIds?.length > 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="h-48 bg-slate-900 rounded-3xl" />
        <div className="h-48 bg-slate-900 rounded-3xl" />
        <div className="h-48 bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load goals" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Investment-Linked Goals</h3>
            <p className="text-xs text-slate-400">Goals with holdings mapped to them via linkedInvestmentIds</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("planning", "goals")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Manage Goals
        </button>
      </div>

      {/* Goal Cards Grid */}
      {linkedGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-10 h-10 text-slate-600 mx-auto" />}
          title="No Investment-Linked Goals"
          message="Link holdings to a goal from the Goals & Planning module to track funding progress here."
          actionLabel="Go to Goals"
          onAction={() => setActiveTab("planning", "goals")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {linkedGoals.map((goal) => (
            <GoalProgressCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
};
