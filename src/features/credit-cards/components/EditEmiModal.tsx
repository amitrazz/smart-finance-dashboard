import React, { useEffect, useState } from "react";
import { X, Edit2, Check } from "lucide-react";
import { CreditCardEmi } from "../../../types";
import { useUpdateCardEmi } from "../hooks/useCreditCardQueries";

interface EditEmiModalProps {
  cardId: string;
  emi: CreditCardEmi | null;
  isOpen: boolean;
  onClose: () => void;
}

const getVal = (val: unknown): number => {
  if (typeof val === "object" && val !== null) return parseFloat((val as { amount?: string }).amount || "0");
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  return 0;
};

export const EditEmiModal: React.FC<EditEmiModalProps> = ({ cardId, emi, isOpen, onClose }) => {
  const updateEmiMutation = useUpdateCardEmi();
  const [monthlyEmi, setMonthlyEmi] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");

  useEffect(() => {
    if (emi) {
      setMonthlyEmi(String(getVal(emi.monthlyEmiAmount || emi.monthlyEmi)));
      setNextDueDate(emi.nextDueDate ? emi.nextDueDate.split("T")[0] : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emi?.id]);

  if (!isOpen || !emi) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmiMutation.mutate(
      {
        cardId,
        emiId: emi.id,
        version: emi.version || 1,
        data: {
          monthlyEmi: monthlyEmi ? String(parseFloat(monthlyEmi)) : undefined,
          nextDueDate: nextDueDate || undefined,
        },
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Correct EMI Plan</h3>
              <p className="text-xs text-slate-400">{emi.merchantName || emi.merchant}</p>
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
          <div>
            <label htmlFor="edit-emi-amount" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Monthly EMI Amount
            </label>
            <input
              id="edit-emi-amount"
              type="number"
              step="any"
              value={monthlyEmi}
              onChange={(e) => setMonthlyEmi(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="edit-emi-due" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Next Due Date
            </label>
            <input
              id="edit-emi-due"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
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
              disabled={updateEmiMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {updateEmiMutation.isPending ? "Saving..." : <><Check className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
