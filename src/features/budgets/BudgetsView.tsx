import React, { useState } from "react";
import { useBudgets, useCreateBudget, useCategories } from "../../hooks/useFinanceQueries";
import { api } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import { Budget, BudgetLine, BudgetPeriod } from "../../types";
import { Plus, Check, X, AlertTriangle, RefreshCw, PieChart } from "lucide-react";

export const BudgetsView: React.FC = () => {
  const { data: budgets = [], isLoading, isError, error, refetch } = useBudgets();
  const { data: categories = [] } = useCategories();
  const createBudgetMutation = useCreateBudget();

  const [isModalOpen, setModalOpen] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("MONTHLY");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [totalLimit, setTotalLimit] = useState("50000");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValidUUID = (id?: string) =>
      Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    let targetCategoryId = selectedCategoryId;
    let targetCategoryName = "General Spend";

    let categoryLabel = "General Spend";
    if (selectedCategoryId === "dining_food") categoryLabel = "Dining & Food";
    else if (selectedCategoryId === "groceries") categoryLabel = "Groceries";
    else if (selectedCategoryId === "shopping") categoryLabel = "Shopping & Household";
    else if (selectedCategoryId === "bills") categoryLabel = "Bills & Utilities";
    else if (selectedCategoryId === "investments") categoryLabel = "Investments & Savings";

    const foundCategory = categories.find((c) => c.id === targetCategoryId) || categories.find((c) => isValidUUID(c.id));

    if (foundCategory && isValidUUID(foundCategory.id)) {
      targetCategoryId = foundCategory.id;
      targetCategoryName = foundCategory.name;
    } else {
      try {
        // Auto-provision chosen category on backend to obtain a valid DB UUID
        const newCat = await api.createCategory({ name: categoryLabel, type: "EXPENSE", kind: "EXPENSE" });
        if (newCat && newCat.id) {
          targetCategoryId = newCat.id;
          targetCategoryName = newCat.name;
        }
      } catch {
        if (categories[0]?.id && isValidUUID(categories[0]?.id)) {
          targetCategoryId = categories[0].id;
          targetCategoryName = categories[0].name || categoryLabel;
        }
      }
    }

    const numericLimit = Math.abs(parseFloat(totalLimit) || 50000);
    const formattedLimit = numericLimit.toFixed(2);

    const budgetLines = [
      {
        categoryId: targetCategoryId,
        categoryName: targetCategoryName,
        limitAmount: formattedLimit,
        spentAmount: "0.00",
      },
    ];

    const isoStartDate = new Date(startDate).toISOString();

    createBudgetMutation.mutate(
      {
        name: budgetName,
        period,
        startDate: isoStartDate,
        totalLimit: formattedLimit,
        totalSpent: "0.00",
        lines: budgetLines,
      } as unknown as Partial<Budget>,
      {
        onSuccess: () => {
          setModalOpen(false);
          setBudgetName("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-rose-500/20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to Load Budgets</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {(error as Error)?.message || "Could not fetch monthly budget plans."}
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

  const activeBudget = budgets[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Monthly Budgets & Spend Controls</h2>
          <p className="text-xs text-slate-400">Category-level spend caps, progress tracking, and remaining budget forecasts</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Create Budget Plan
        </button>
      </div>

      {!activeBudget ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <PieChart className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Active Budget Plan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Create Budget Plan" to establish category spending limits for this month.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Budget Progress Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  Active Plan • {activeBudget.period}
                </span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">{activeBudget.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Spent / Limit</p>
                <p className="text-xl font-extrabold text-slate-100">
                  {formatCurrency(activeBudget.totalSpent)} /{" "}
                  <span className="text-slate-400">{formatCurrency(activeBudget.totalLimit)}</span>
                </p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            {(() => {
              const parseAmount = (val: unknown): number => {
                if (val === null || val === undefined) return 0;
                if (typeof val === "number") return val;
                if (typeof val === "string") return parseFloat(val) || 0;
                if (typeof val === "object" && "amount" in val) return parseFloat(String(val.amount)) || 0;
                return 0;
              };

              // Fallback to lines sum if totalLimit is 0
              const linesLimit = activeBudget.lines?.reduce((sum, line) => sum + parseAmount(line.limitAmount), 0) || 0;
              const linesSpent = activeBudget.lines?.reduce((sum, line) => sum + parseAmount(line.spentAmount), 0) || 0;

              const rawLimit = parseAmount(activeBudget.totalLimit);
              const rawSpent = parseAmount(activeBudget.totalSpent);

              const limit = rawLimit > 0 ? rawLimit : linesLimit;
              const spent = rawSpent > 0 ? rawSpent : linesSpent;

              const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
              const isOver = spent > limit && limit > 0;

              return (
                <div className="space-y-2">
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? "bg-rose-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{pct}% Utilized</span>
                    <span className={isOver ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {isOver
                        ? `Over Budget by ${formatCurrency((spent - limit).toFixed(2))}`
                        : `${formatCurrency(Math.max(limit - spent, 0).toFixed(2))} Remaining`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Category Lines */}
          {activeBudget.lines && activeBudget.lines.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-slate-100">Category Caps & Progress</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBudget.lines.map((line: BudgetLine) => {
                  const parseAmount = (val: unknown): number => {
                    if (val === null || val === undefined) return 0;
                    if (typeof val === "number") return val;
                    if (typeof val === "string") return parseFloat(val) || 0;
                    if (typeof val === "object" && "amount" in val) return parseFloat(String(val.amount)) || 0;
                    return 0;
                  };

                  const spent = parseAmount(line.spentAmount);
                  const limit = parseAmount(line.limitAmount);
                  const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
                  const isOver = spent > limit && limit > 0;

                  return (
                    <div key={line.id || line.categoryId} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-slate-100">{line.categoryName || "General Spend"}</h5>
                        <span className="text-xs font-bold text-slate-300">
                          {formatCurrency(spent)} /{" "}
                          <span className="text-slate-500">{formatCurrency(limit)}</span>
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOver ? "bg-rose-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{pct}% spent</span>
                        <span className={isOver ? "text-rose-400 font-semibold" : "text-slate-300 font-medium"}>
                          {isOver
                            ? `Over limit`
                            : `${formatCurrency(Math.max(limit - spent, 0).toFixed(2))} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100">Create New Monthly Budget</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Budget Plan Name</label>
                <input
                  type="text"
                  required
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g. August Household Budget"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Spend Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Target Spend Limit (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
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
                  disabled={createBudgetMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
                >
                  <Check className="w-4 h-4" /> Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
