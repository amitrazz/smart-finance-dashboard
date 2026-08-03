import React from "react";
import { useInvestmentGoals } from "../hooks/useInvestmentQueries";
import { GoalProgressCard } from "../components/GoalProgressCard";
import { Target, Plus } from "lucide-react";
import { useUIStore } from "../../../store/useUIStore";

export const GoalsView: React.FC = () => {
  const { data: goals = [], isLoading } = useInvestmentGoals();
  const { setActiveTab } = useUIStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        <div className="h-48 bg-slate-900 rounded-3xl" />
        <div className="h-48 bg-slate-900 rounded-3xl" />
        <div className="h-48 bg-slate-900 rounded-3xl" />
      </div>
    );
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
            <h3 className="font-bold text-slate-100 text-sm">Goal Mapping & Funding Gap Analysis</h3>
            <p className="text-xs text-slate-400">Map specific investment positions & SIPs to financial goals</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("planning", "goals")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Financial Goal
        </button>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GoalProgressCard key={goal.goalId} goal={goal} />
        ))}
      </div>
    </div>
  );
};
