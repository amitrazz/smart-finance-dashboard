import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAccounts, useCategories } from "../../../../hooks/useFinanceQueries";
import { Button } from "../../../../components/ui/Button";
import type {
  FinancePlanConstraint,
  FinancePlanConstraintType,
  FinancePlanObjective,
  GenerateFinancePlanInput,
} from "../../../../types";

const OBJECTIVES: { id: FinancePlanObjective; label: string; hint: string }[] = [
  { id: "SAVE_FOR_GOAL", label: "Save for a goal", hint: "A car, a trip, a down payment — anything with a target amount" },
  { id: "BUILD_EMERGENCY_FUND", label: "Build an emergency fund", hint: "A cash buffer sized to your expenses" },
  { id: "REDUCE_DISCRETIONARY_SPENDING", label: "Cut spending in specific categories", hint: "Pick categories to trim — proposes a new budget with reduced allocations" },
  { id: "ORGANIZE_BUDGET", label: "Organize a budget", hint: "Proposes a new budget across everything you already spend in" },
];

const GOAL_OBJECTIVES = new Set<FinancePlanObjective>(["SAVE_FOR_GOAL", "BUILD_EMERGENCY_FUND"]);

const CONSTRAINT_TYPES: { id: FinancePlanConstraintType; label: string; targetKind: "category" | "account" }[] = [
  { id: "CATEGORY_MINIMUM", label: "Keep spending at least this much in a category", targetKind: "category" },
  { id: "CATEGORY_MAXIMUM", label: "Cap spending in a category", targetKind: "category" },
  { id: "ACCOUNT_MINIMUM_BALANCE", label: "Keep an account above a minimum balance", targetKind: "account" },
];

interface DraftConstraint extends FinancePlanConstraint {
  key: string;
}

export const PlanGenerateForm: React.FC<{
  isSubmitting: boolean;
  onSubmit: (input: GenerateFinancePlanInput) => void;
  onCancel: () => void;
}> = ({ isSubmitting, onSubmit, onCancel }) => {
  const [objective, setObjective] = useState<FinancePlanObjective>("SAVE_FOR_GOAL");
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetCategoryIds, setTargetCategoryIds] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<DraftConstraint[]>([]);

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const isGoalObjective = GOAL_OBJECTIVES.has(objective);
  const needsTargetCategories = objective === "REDUCE_DISCRETIONARY_SPENDING";

  const amountValue = Number(targetAmount);
  const canSubmit =
    (!isGoalObjective ||
      (targetAmount.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0)) &&
    (!needsTargetCategories || targetCategoryIds.length > 0) &&
    constraints.every((c) => c.targetId && c.value.trim().length > 0);

  const toggleTargetCategory = (categoryId: string) => {
    setTargetCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  };

  const addConstraint = () => {
    setConstraints((prev) => [
      ...prev,
      { key: crypto.randomUUID(), type: "CATEGORY_MINIMUM", targetId: "", value: "" },
    ]);
  };
  const updateConstraint = (key: string, patch: Partial<DraftConstraint>) => {
    setConstraints((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };
  const removeConstraint = (key: string) => {
    setConstraints((prev) => prev.filter((c) => c.key !== key));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      objective,
      targetAmount: isGoalObjective ? targetAmount.trim() : undefined,
      goalName: isGoalObjective ? name.trim() || undefined : undefined,
      budgetName: !isGoalObjective ? name.trim() || undefined : undefined,
      targetCategoryIds: needsTargetCategories ? targetCategoryIds : undefined,
      constraints: constraints.length
        ? constraints.map(({ type, targetId, value }) => ({ type, targetId, value: value.trim() }))
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Objective</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OBJECTIVES.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={objective === o.id}
              onClick={() => setObjective(o.id)}
              className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                objective === o.id ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <span className="block text-sm font-medium text-slate-100">{o.label}</span>
              <span className="mt-0.5 block text-[11px] text-slate-500">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isGoalObjective && (
          <div className="space-y-1.5">
            <label htmlFor="plan-target-amount" className="text-xs font-semibold text-slate-300">
              Target amount
            </label>
            <input
              id="plan-target-amount"
              type="number"
              min={1}
              step="0.01"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="500000"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="plan-goal-name" className="text-xs font-semibold text-slate-300">
            Name <span className="font-normal text-slate-600">(optional)</span>
          </label>
          <input
            id="plan-goal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isGoalObjective ? "New Car Fund" : "Organized Budget"}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {needsTargetCategories && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Categories to cut <span className="font-normal text-slate-600">(required — there's no automatic "discretionary" detection)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-2.5">
            {categories.length === 0 && <span className="text-xs text-slate-600">No categories found.</span>}
            {categories.map((category) => {
              const selected = targetCategoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTargetCategory(category.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    selected
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Constraints <span className="font-normal text-slate-600">(optional)</span>
          </label>
          <Button type="button" variant="neutral" hierarchy="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addConstraint}>
            Add constraint
          </Button>
        </div>

        {constraints.map((constraint) => {
          const constraintDef = CONSTRAINT_TYPES.find((c) => c.id === constraint.type)!;
          const options = constraintDef.targetKind === "category" ? categories : accounts;
          return (
            <div key={constraint.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-2.5">
              <select
                value={constraint.type}
                onChange={(e) =>
                  updateConstraint(constraint.key, {
                    type: e.target.value as FinancePlanConstraintType,
                    targetId: "",
                  })
                }
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
              >
                {CONSTRAINT_TYPES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={constraint.targetId}
                onChange={(e) => updateConstraint(constraint.key, { targetId: e.target.value })}
                className="min-w-[9rem] flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
              >
                <option value="">Select {constraintDef.targetKind}…</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                value={constraint.value}
                onChange={(e) => updateConstraint(constraint.key, { value: e.target.value })}
                placeholder="Amount"
                className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200"
              />
              <button
                type="button"
                onClick={() => removeConstraint(constraint.key)}
                aria-label="Remove constraint"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
        <Button type="button" variant="neutral" hierarchy="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting} loadingText="Generating…">
          Generate plan
        </Button>
      </div>
    </form>
  );
};

export default PlanGenerateForm;
