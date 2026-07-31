import React, { useState } from "react";
import { X, CreditCard, CheckCircle2 } from "lucide-react";
import { useCreateCreditCard } from "../../../hooks/useFinanceQueries";

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCreditCardModal: React.FC<AddCreditCardModalProps> = ({ isOpen, onClose }) => {
  const createCreditCardMutation = useCreateCreditCard();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [creditLimit, setCreditLimit] = useState("");
  const [statementDay, setStatementDay] = useState("5");
  const [dueDay, setDueDay] = useState("25");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCreditCardMutation.mutate(
      {
        name,
        currency,
        creditLimit,
        statementDay: parseInt(statementDay, 10) || 5,
        dueDay: parseInt(dueDay, 10) || 25,
      },
      {
        onSuccess: () => {
          onClose();
          setName("");
          setCreditLimit("");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Add Credit Card</h3>
              <p className="text-xs text-slate-400">Track credit limits, billing cycles, and utilization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createCreditCardMutation.isError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {(createCreditCardMutation.error as Error)?.message || "Failed to add credit card. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Name</label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Regalia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Credit Limit</label>
              <input
                type="number"
                step="any"
                required
                placeholder="200000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Statement Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                placeholder="5"
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                placeholder="25"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCreditCardMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {createCreditCardMutation.isPending ? "Adding..." : <><CheckCircle2 className="w-4 h-4" /> Save Card</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
