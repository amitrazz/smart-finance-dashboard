import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, X, RefreshCw } from "lucide-react";
import { useGoals, useRecordGoalContribution } from "../../../hooks/useFinanceQueries";

interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGoalId?: string | null;
}

export const AddContributionModal: React.FC<AddContributionModalProps> = ({ isOpen, onClose, defaultGoalId }) => {
  const { data: goals = [] } = useGoals({ status: "ACTIVE" });
  const mutation = useRecordGoalContribution();

  const [goalId, setGoalId] = useState(defaultGoalId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setGoalId(defaultGoalId ?? (goals[0]?.id ?? ""));
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultGoalId]);

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
    if (!goalId || !amount) return;
    mutation.mutate(
      { goalId, data: { amount, date, notes } },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="add-contribution-title">
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
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
              <PiggyBank className="w-5 h-5 text-teal-400" />
            </div>
            <h3 id="add-contribution-title" className="font-bold text-lg text-slate-100">Add Contribution</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Goal</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="" disabled>Select a goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
              <button type="button" onClick={onClose} disabled={mutation.isPending} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || !goalId || !amount}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {mutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Add Contribution
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddContributionModal;
