import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, X, RefreshCw } from "lucide-react";
import { useBudgets, useBudgetCategories, useUpdateCategoryAllocation } from "../../../hooks/useFinanceQueries";

interface AdjustBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBudgetId?: string | null;
}

export const AdjustBudgetModal: React.FC<AdjustBudgetModalProps> = ({ isOpen, onClose, defaultBudgetId }) => {
  const { data: budgets = [] } = useBudgets();
  const [budgetId, setBudgetId] = useState(defaultBudgetId ?? "");
  const { data: categories = [] } = useBudgetCategories(budgetId);
  const mutation = useUpdateCategoryAllocation();

  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBudgetId(defaultBudgetId ?? (budgets[0]?.id ?? ""));
      setCategoryId("");
      setLimitAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultBudgetId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !mutation.isPending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, mutation.isPending, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetId || !categoryId || !limitAmount) return;
    mutation.mutate({ budgetId, categoryId, limitAmount }, { onSuccess: () => onClose() });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="adjust-budget-title">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative"
        >
          <button onClick={onClose} disabled={mutation.isPending} aria-label="Close dialog" className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <h3 id="adjust-budget-title" className="font-bold text-lg text-slate-100">Adjust Budget Category</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Budget</label>
              <select
                value={budgetId}
                onChange={(e) => { setBudgetId(e.target.value); setCategoryId(""); }}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="" disabled>Select a budget</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={!budgetId || categories.length === 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              >
                <option value="" disabled>{categories.length === 0 ? "No categories available" : "Select a category"}</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">New Limit</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
              <button type="button" onClick={onClose} disabled={mutation.isPending} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !budgetId || !categoryId || !limitAmount}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                {mutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Allocation
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdjustBudgetModal;
