import React, { useState } from "react";
import { X, FileText, Check } from "lucide-react";
import { useCreateCardStatement } from "../hooks/useCreditCardQueries";

interface AddStatementModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddStatementModal: React.FC<AddStatementModalProps> = ({ cardId, isOpen, onClose }) => {
  const createStatementMutation = useCreateCardStatement();
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [minimumDue, setMinimumDue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStatementMutation.mutate(
      {
        cardId,
        data: {
          statementDate,
          dueDate,
          statementBalance: String(parseFloat(statementBalance || "0")),
          minimumDue: String(parseFloat(minimumDue || "0")),
        },
      },
      {
        onSuccess: () => {
          onClose();
          setStatementDate(new Date().toISOString().split("T")[0]);
          setDueDate("");
          setStatementBalance("");
          setMinimumDue("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Add Statement Manually</h3>
              <p className="text-xs text-slate-400">Record a statement the nightly cron hasn't generated yet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-stmt-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Statement Date *
              </label>
              <input
                id="add-stmt-date"
                type="date"
                required
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="add-due-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Due Date *
              </label>
              <input
                id="add-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-stmt-balance" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Statement Balance *
              </label>
              <input
                id="add-stmt-balance"
                type="number"
                step="any"
                required
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="add-min-due" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Minimum Due *
              </label>
              <input
                id="add-min-due"
                type="number"
                step="any"
                required
                value={minimumDue}
                onChange={(e) => setMinimumDue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStatementMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {createStatementMutation.isPending ? "Adding..." : <><Check className="w-4 h-4" /> Add Statement</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
