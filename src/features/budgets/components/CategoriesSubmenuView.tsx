import React, { useState } from "react";
import { Sliders } from "lucide-react";
import { useBudgets, useUpdateCategoryAllocation, useBudgetCategories } from "../hooks/useBudgetQueries";
import { formatCurrency } from "../../../utils/formatters";
import { BudgetCategoryLine } from "../../../types";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";

export const CategoriesSubmenuView: React.FC = () => {
  const { data: budgets = [], isLoading: budgetsLoading, isError: budgetsErrored, refetch: refetchBudgets } = useBudgets();
  const updateAllocationMutation = useUpdateCategoryAllocation();

  const activeBudget = budgets[0];
  const { data: categoryLines = [], isLoading: categoriesLoading, isError: categoriesErrored, refetch: refetchCategories } = useBudgetCategories(activeBudget?.id ?? "");
  const isLoading = budgetsLoading || categoriesLoading;
  const isError = budgetsErrored || categoriesErrored;

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState<string>("");

  const handleStartEdit = (cat: BudgetCategoryLine) => {
    setEditingCategoryId(cat.categoryId);
    setEditLimit(cat.allocatedAmount.amount);
  };

  const handleSaveEdit = (categoryId: string) => {
    if (!activeBudget?.id) return;
    updateAllocationMutation.mutate(
      {
        budgetId: activeBudget.id,
        categoryId,
        limitAmount: editLimit,
      },
      {
        onSuccess: () => setEditingCategoryId(null),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Categories"
        message="We couldn't load your budget categories."
        onRetry={() => {
          if (budgetsErrored) refetchBudgets();
          if (categoriesErrored) refetchCategories();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Category Spend Caps</h2>
          <p className="text-xs text-slate-400">
            Set and adjust spending limits for individual categories with live daily guidance
          </p>
        </div>
      </div>

      {categoryLines.length === 0 && (
        <EmptyState
          title="No Category Data"
          message={activeBudget ? "This budget has no category allocations yet." : "Create a budget to set category spend caps."}
        />
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categoryLines.map((cat) => {
          const spentNum = parseFloat(cat.spentAmount.amount || "0");
          const limitNum = parseFloat(cat.allocatedAmount.amount || "0");
          const pct = limitNum > 0 ? Math.round((spentNum / limitNum) * 100) : 0;
          const isOver = spentNum > limitNum && limitNum > 0;
          const isEditing = editingCategoryId === cat.categoryId;

          return (
            <div
              key={cat.categoryId}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center text-xl">
                    {cat.categoryIcon || "🍔"}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {cat.categoryName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Health: {cat.healthGrade || "—"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartEdit(cat)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Edit Allocation"
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                </button>
              </div>

              {/* Editing Slider Modal / Inline */}
              {isEditing ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                  <label className="block text-xs font-bold text-slate-300">
                    Adjust Cap Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(cat.categoryId)}
                      disabled={updateAllocationMutation.isPending}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Spent / Budget</span>
                    <span className="text-slate-100 font-extrabold">
                      {formatCurrency(cat.spentAmount)} /{" "}
                      <span className="text-slate-400">{formatCurrency(cat.allocatedAmount)}</span>
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? "bg-rose-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-semibold pt-1">
                    <span className="text-slate-400">{pct}% utilized</span>
                    <span className={isOver ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                      {formatCurrency(cat.remainingAmount)} remaining
                    </span>
                  </div>
                </div>
              )}

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 font-medium">Warning Threshold</p>
                  <p className="font-extrabold text-amber-400">{cat.warningThreshold != null ? `${cat.warningThreshold}%` : "—"}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 font-medium">Critical Threshold</p>
                  <p className="font-extrabold text-rose-400">{cat.criticalThreshold != null ? `${cat.criticalThreshold}%` : "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
