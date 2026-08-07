import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Grid,
  List as ListIcon,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useBudgets, useDeleteBudget } from "../hooks/useBudgetQueries";
import { formatCurrency } from "../../../utils/formatters";
import { ConfirmModal } from "../../../components/common/ConfirmModal";

interface MyBudgetsSubmenuViewProps {
  onOpenWizard: () => void;
  onSelectBudget: (id: string) => void;
}

export const MyBudgetsSubmenuView: React.FC<MyBudgetsSubmenuViewProps> = ({
  onOpenWizard,
  onSelectBudget,
}) => {
  const { data: budgets = [], isLoading, isError, error, refetch } = useBudgets();
  const deleteBudgetMutation = useDeleteBudget();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [deletingBudget, setDeletingBudget] = useState<{ id: string; name: string } | null>(null);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPeriod = periodFilter === "ALL" || b.period === periodFilter;
      return matchesSearch && matchesPeriod;
    });
  }, [budgets, searchTerm, periodFilter]);

  const handleDelete = (id: string, name: string) => {
    setDeletingBudget({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!deletingBudget) return;
    deleteBudgetMutation.mutate(
      { id: deletingBudget.id },
      { onSuccess: () => setDeletingBudget(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 bg-slate-900/60 rounded-3xl border border-slate-800" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-100">Failed to Load Budgets</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not retrieve your active budget plans."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">My Budget Plans</h2>
          <p className="text-xs text-slate-400">Manage all period spending plans and category caps</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List view toggle */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              title="Grid view"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="List view"
              title="List view"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenWizard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Budget Plan
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by budget plan name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Periods</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredBudgets.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            💰
          </div>
          <h3 className="text-lg font-extrabold text-slate-100">A budget gives every rupee a purpose.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first monthly budget and start taking control of your spending.
          </p>
          <button
            onClick={onOpenWizard}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Budget
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBudgets.map((budget) => {
            const spent = budget.totalSpent || { amount: "0", currency: budget.currency || "INR" };
            const limit = budget.totalLimit;
            const pct = budget.utilizationPercent ?? 0;
            const remaining = budget.remainingAmount || { amount: "0", currency: budget.currency || "INR" };

            return (
              <div
                key={budget.id}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase">
                        {budget.period}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-100 mt-1.5 group-hover:text-emerald-400 transition-colors">
                        {budget.name}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                      {budget.budgetHealthGrade || "EXCELLENT"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Total Spent</span>
                      <span className="text-slate-100 font-extrabold">
                        {formatCurrency(spent)} / <span className="text-slate-400">{formatCurrency(limit)}</span>
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 100 ? "bg-rose-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs font-semibold pt-1">
                      <span className="text-slate-400">{pct}% Utilized</span>
                      <span className={pct > 100 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {formatCurrency(remaining)} Remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(budget.id, budget.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Budget"
                      aria-label="Delete Budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectBudget(budget.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" /> View Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Budget Name</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Total Limit</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4">Utilization</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
              {filteredBudgets.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-100">{b.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{b.period}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-bold">{formatCurrency(b.totalLimit)}</td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold">{formatCurrency(b.totalSpent)}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{formatCurrency(b.remainingAmount)}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-300">{b.utilizationPercent}%</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectBudget(b.id)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" /> Detail
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 inline-flex items-center"
                      title="Delete Budget"
                      aria-label="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deletingBudget)}
        title="Delete Budget Plan?"
        message={`Are you sure you want to delete budget plan "${deletingBudget?.name}"? This action cannot be undone.`}
        confirmText="Delete Budget"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteBudgetMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingBudget(null)}
      />
    </div>
  );
};
