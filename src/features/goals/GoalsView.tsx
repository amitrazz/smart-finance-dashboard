import React, { useState } from "react";
import { useGoals, useCreateGoal, useAddGoalContribution } from "../../hooks/useFinanceQueries";
import { formatCurrency } from "../../utils/formatters";
import { Goal } from "../../types";
import { Target, Plus, ShieldCheck, Plane, Home, GraduationCap, Clock, Check, X, AlertTriangle, RefreshCw } from "lucide-react";

export const GoalsView: React.FC = () => {
  const { data: goals = [], isLoading, isError, error, refetch } = useGoals();
  const createGoalMutation = useCreateGoal();
  const addContributionMutation = useAddGoalContribution();

  const [isModalOpen, setModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [category, setCategory] = useState<Goal["category"]>("VACATION");
  const [targetAmount, setTargetAmount] = useState("300000");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate(
      {
        name: goalName,
        category,
        targetAmount: { amount: targetAmount, currency: "INR" },
        currentAmount: { amount: "0", currency: "INR" },
        targetDate: "2027-12-31",
        monthlyContribution: { amount: "15000", currency: "INR" },
        isCompleted: false,
        forecastCompletionDate: "2027-11-15",
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setGoalName("");
        },
      }
    );
  };

  const getGoalIcon = (cat: string) => {
    switch (cat) {
      case "EMERGENCY":
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case "VACATION":
        return <Plane className="w-5 h-5 text-sky-400" />;
      case "HOUSE":
        return <Home className="w-5 h-5 text-amber-400" />;
      case "EDUCATION":
        return <GraduationCap className="w-5 h-5 text-indigo-400" />;
      default:
        return <Target className="w-5 h-5 text-purple-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
          <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Goals</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch goal targets."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Financial Goals & Corpus Milestones</h2>
          <p className="text-xs text-slate-400">Track Emergency Fund, Retirement, House purchase & Vacation progress</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Target className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Active Goals</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Create Goal" above to start tracking milestone targets.
          </p>
        </div>
      ) : (
        /* Goal Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g: Goal) => {
            const current = parseFloat(g.currentAmount?.amount || "0");
            const target = parseFloat(g.targetAmount?.amount || "1");
            const pct = Math.min(Math.round((current / target) * 100), 100);

            return (
              <div key={g.id} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700">{getGoalIcon(g.category)}</div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-100">{g.name}</h3>
                      <p className="text-xs text-slate-400">Target Date: {g.targetDate}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {pct}% Completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-100">{formatCurrency(g.currentAmount)}</span>
                    <span className="text-slate-400">Target: {formatCurrency(g.targetAmount)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      Forecast completion: <strong className="text-slate-200">{g.forecastCompletionDate || g.targetDate}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => addContributionMutation.mutate({ id: g.id, amount: { amount: "10000", currency: "INR" } })}
                    disabled={addContributionMutation.isPending}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 disabled:opacity-50"
                  >
                    + Log ₹10,000
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100">Add Goal</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Japan Trip 2027"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Goal["category"])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="VACATION">Vacation</option>
                    <option value="EMERGENCY">Emergency Fund</option>
                    <option value="RETIREMENT">Retirement</option>
                    <option value="HOUSE">House</option>
                    <option value="EDUCATION">Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Corpus (₹)</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGoalMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
                >
                  <Check className="w-4 h-4" /> Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
